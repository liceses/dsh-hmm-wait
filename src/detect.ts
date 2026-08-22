/**
 * dsh-hmm-wait — trigger detection over streaming reasoning text.
 *
 * Pure, dependency-free logic: feed reasoning-delta chunks into a Detector
 * and it yields danmaku hits as soon as a trigger word appears at a sentence
 * start (or anywhere, per config). Stream-friendly: chunks may split a word
 * mid-way (the rolling buffer re-scans), per-trigger cooldown prevents
 * duplicate pops from the same spill, and a global rate window caps the
 * fan-out. The host keeps ONE detector per llm/stream call so sentence state
 * never leaks across model requests.
 */

import type { TriggerMatchMode } from './schema.ts'

/** Detector options; derived from the settings config at install time. */
export interface DetectorOptions {
  triggers: readonly string[]
  match: TriggerMatchMode
  caseSensitive: boolean
  cooldownMs: number
  maxPerSecond: number
  /** 弹幕文本最大字符数。 */
  maxChars: number
}

/** One accepted hit. */
export interface DetectorHit {
  /** 命中的触发词（原文，来自配置）。 */
  trigger: string
  /** 弹幕文本：触发词所在句（截断到 maxChars）。 */
  text: string
}

/** 句子边界：换行 + 中英文句末/分句标点。 */
const SENTENCE_BOUNDARY = '\n。！？!?；;'

/** 正则转义。 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 触发词模式：捕获组 1 = 触发词本身，组 0 = 前导邻接字符 + 触发词。
 * 邻接字符要求使 "wait" 不会命中 "await"，"hmm" 不会命中 "shmmmer"。
 */
function boundaryPattern(trigger: string): string {
  return `(?:^|[^\\p{L}\\p{N}])(${escapeRegExp(trigger)})`
}

/** 从后往前找最近的句子边界，返回其后的起始索引；无边界返回 0。 */
function sentenceStartIndex(buf: string): number {
  for (let i = buf.length - 1; i >= 0; i--) {
    if (SENTENCE_BOUNDARY.indexOf(buf[i]!) !== -1) return i + 1
  }
  return 0
}

/** buf 的 [start, idx) 区间是否只有空白/引号（"句首"判定用）。 */
function isBlankish(buf: string, start: number, idx: number): boolean {
  for (let i = start; i < idx; i++) {
    const c = buf[i]!
    if (c !== ' ' && c !== '\t' && c !== '\u00a0' && c !== '\u3000' &&
        c !== '"' && c !== "'" && c !== '\u201c' && c !== '\u2018' &&
        c !== '\u201d' && c !== '\u2019') return false
  }
  return true
}

/** 提取触发词所在句子（含到当前已流入的文本末尾），截断到 maxChars。 */
function extractSentence(buf: string, maxChars: number): string {
  let text = buf.slice(sentenceStartIndex(buf)).trim()
  if (text.length > maxChars) text = `${text.slice(0, maxChars)}…`
  return text
}

/** 每秒限流滑动窗口。 */
class RateLimiter {
  private hits: number[] = []
  private readonly maxPerSecond: number

  constructor(maxPerSecond: number) {
    this.maxPerSecond = maxPerSecond
  }

  allow(now: number): boolean {
    const cutoff = now - 1000
    while (this.hits.length > 0 && this.hits[0]! < cutoff) this.hits.shift()
    if (this.hits.length >= this.maxPerSecond) return false
    this.hits.push(now)
    return true
  }
}

/** 流式触发器：每路 llm/stream 一个实例。 */
export class StreamTriggerDetector {
  private buf = ''
  private readonly regexps: Array<{ trigger: string; re: RegExp }>
  private readonly lastAt = new Map<string, number>()
  private readonly rate: RateLimiter
  private readonly options: DetectorOptions

  constructor(options: DetectorOptions) {
    this.options = options
    // u flag 使 \p{L}/\p{N} 生效（Unicode 属性转义）。
    const flags = options.caseSensitive ? 'gu' : 'giu'
    this.regexps = options.triggers.map((trigger) => ({
      trigger,
      re: new RegExp(boundaryPattern(trigger), flags),
    }))
    this.rate = new RateLimiter(options.maxPerSecond)
  }

  /**
   * 推入一段推理文本（一个 reasoning-delta chunk），返回本次产生的命中。
   * 命中后内部缓冲重置，同一句不会重复弹。
   */
  push(chunk: string): DetectorHit[] {
    const hits: DetectorHit[] = []
    if (chunk === '') return hits
    this.buf += chunk
    // 防膨胀：无命中的超长流只保留尾部窗口（保留句子起点，句首判定仍正确）。
    if (this.buf.length > 16384) this.buf = this.buf.slice(-8192)
    const now = Date.now()

    for (const { trigger, re } of this.regexps) {
      re.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = re.exec(this.buf)) !== null) {
        // 触发词起点 = 组 0 末尾回退组 1 长度（组 0 含前导边界字符或 ^）。
        const idx = match.index + match[0].length - match[1].length
        // 句首模式：触发词之前（自句边界起）只能有空白/引号。
        if (this.options.match === 'sentence-start') {
          const s = sentenceStartIndex(this.buf)
          if (!isBlankish(this.buf, s, idx)) {
            re.lastIndex = idx + Math.max(1, match[0].length - 1)
            continue
          }
        }
        // 冷却：同一触发词在 cooldownMs 内只弹一次。
        const last = this.lastAt.get(trigger)
        if (last !== undefined && now - last < this.options.cooldownMs) {
          re.lastIndex = idx + 1
          continue
        }
        // 全局限流。
        if (!this.rate.allow(now)) break

        this.lastAt.set(trigger, now)
        const text = extractSentence(this.buf, this.options.maxChars)
        hits.push({ trigger, text: text === '' ? trigger : text })
        // 命中即重置句子累积：同一句的后续文本另起一句，避免重复弹。
        this.buf = ''
        break
      }
    }
    return hits
  }
}

/** 便捷工厂。 */
export function createDetector(options: DetectorOptions): StreamTriggerDetector {
  return new StreamTriggerDetector(options)
}
