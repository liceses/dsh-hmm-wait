/**
 * dsh-hmm-wait — module-level client state: the on-screen danmaku queue and
 * the mirrored settings snapshot. Re-renders flow through tiny external
 * stores (useSyncExternalStore), the same pattern the shipped GUI plugins use.
 */

import type { HmmWaitConfig } from '../schema.ts'
import { DEFAULT_CONFIG } from '../schema.ts'

/** 一条屏幕上存活中的弹幕。 */
export interface DanmakuItem {
  id: number
  trigger: string
  text: string
  ts: number
  sessionId?: string
  /** 本次命中时的连击数（≥1）。 */
  combo: number
  /** 本进程周期内的最高连击。 */
  comboMax: number
}

/** Combo HUD 快照（由弹幕事件驱动）。 */
export interface ComboSnapshot {
  /** 当前连击数（0 = 无连击）。 */
  combo: number
  /** 历史最高。 */
  max: number
  /** 最近一次命中的时间戳。 */
  lastHitAt: number
  /** 最近命中的触发词。 */
  trigger: string
}

/** 配置镜像快照（client 无法连到 settings 时回退默认值）。 */
export interface ConfigSnapshot {
  /** loading = settings 尚未就绪；ready = 已镜像；unavailable = 该 namespace 未暴露给本页。 */
  status: 'loading' | 'ready' | 'unavailable'
  config: HmmWaitConfig
}

// --- danmaku queue store ---

let items: DanmakuItem[] = []
let itemSnapshot: readonly DanmakuItem[] = []
const itemListeners = new Set<() => void>()

/** 已消费的事件 id（防 SSE 重放补发导致重复弹幕；保留最近 500 个）。 */
const seenIds: number[] = []
const seenSet = new Set<number>()

function markSeen(id: number): boolean {
  if (seenSet.has(id)) return false
  seenSet.add(id)
  seenIds.push(id)
  if (seenIds.length > 500) {
    const oldest = seenIds.shift()
    if (oldest !== undefined) seenSet.delete(oldest)
  }
  return true
}

function emitItems(): void {
  itemSnapshot = [...items]
  for (const fn of itemListeners) fn()
}

export function subscribeDanmakuStore(fn: () => void): () => void {
  itemListeners.add(fn)
  return () => {
    itemListeners.delete(fn)
  }
}

export function getDanmakuSnapshot(): readonly DanmakuItem[] {
  return itemSnapshot
}

/** 入队一条弹幕（按事件 id 去重）；超出 maxOnScreen 时挤掉最旧的。 */
export function pushDanmaku(item: DanmakuItem, maxOnScreen: number): void {
  if (!markSeen(item.id)) return
  items = [...items, item]
  const cap = Math.max(1, maxOnScreen)
  if (items.length > cap) items = items.slice(items.length - cap)
  emitItems()
  publishCombo({
    combo: item.combo,
    max: item.comboMax,
    lastHitAt: Date.now(),
    trigger: item.trigger,
  })
}

/** 动画结束后移除。 */
export function removeDanmaku(id: number): void {
  const next = items.filter((item) => item.id !== id)
  if (next.length !== items.length) {
    items = next
    emitItems()
  }
}

/** 关闭/禁用时清屏。 */
export function clearDanmaku(): void {
  if (items.length > 0) {
    items = []
    emitItems()
  }
}

// combo store ------------------------------------------------------------

let comboSnapshot: ComboSnapshot = { combo: 0, max: 0, lastHitAt: 0, trigger: '' }
const comboListeners = new Set<() => void>()

export function subscribeCombo(fn: () => void): () => void {
  comboListeners.add(fn)
  return () => {
    comboListeners.delete(fn)
  }
}

export function getComboSnapshot(): ComboSnapshot {
  return comboSnapshot
}

/** 由弹幕事件更新连击快照（pushDanmaku 内部调用）。 */
function publishCombo(next: ComboSnapshot): void {
  comboSnapshot = next
  for (const fn of comboListeners) fn()
}

// config store -----------------------------------------------------------

let configSnapshot: ConfigSnapshot = { status: 'loading', config: DEFAULT_CONFIG }
const configListeners = new Set<() => void>()

export function subscribeConfig(fn: () => void): () => void {
  configListeners.add(fn)
  return () => {
    configListeners.delete(fn)
  }
}

export function getConfigSnapshot(): ConfigSnapshot {
  return configSnapshot
}

/** 镜像 settings scope 的 snapshot（由 client apply 调用）。 */
export function publishConfigSnapshot(next: ConfigSnapshot): void {
  configSnapshot = next
  for (const fn of configListeners) fn()
}
