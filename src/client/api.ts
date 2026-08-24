/**
 * dsh-hmm-wait — browser-side API: SSE subscription to the danmaku stream
 * (with auto-reconnect + half-open watchdog) and the test-danmaku call.
 * Plain fetch on the same origin — the same data path the dsh web GUI uses.
 */

import type { DanmakuEvent } from '../protocol.ts'
import { EVENTS_PATH, TEST_PATH, SSE_EVENT_DANMAKU } from '../protocol.ts'

/** 心跳间隔（host 30s ping）；超过该值的 1.5 倍无数据即判定连接半开。 */
const WATCHDOG_STALE_MS = 45_000
/** 看门狗检查周期。 */
const WATCHDOG_TICK_MS = 10_000

/**
 * 订阅弹幕流；返回取消函数。
 * 断线自动 1s 重连；看门狗每 10s 检查一次，若超过 45s 未收到任何数据
 * （含心跳 ping）则判定连接已半开（休眠/网络切换/浏览器长时流 bug），
 * 主动断开当前流触发重连；页面从后台回到前台时也立即检查。
 */
export function subscribeDanmaku(onEvent: (event: DanmakuEvent) => void): () => void {
  let closed = false
  let timer: number | null = null
  let watchdog: number | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let lastDataAt = Date.now()

  const scheduleReconnect = (): void => {
    if (closed) return
    timer = window.setTimeout(() => {
      timer = null
      void connect()
    }, 1000)
  }

  /** 主动掐断当前流（read() 会 resolve done → 走重连）。 */
  const killStream = (): void => {
    if (reader !== null) {
      const r = reader
      reader = null
      r.cancel().catch(() => undefined)
    }
  }

  const connect = async (): Promise<void> => {
    if (closed) return
    try {
      const response = await fetch(EVENTS_PATH, { headers: { accept: 'text/event-stream' } })
      if (closed) {
        response.body?.cancel().catch(() => undefined)
        return
      }
      if (!response.ok || response.body === null) {
        throw new Error(`HTTP ${response.status}`)
      }
      reader = response.body.getReader()
      lastDataAt = Date.now()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        lastDataAt = Date.now()
        buffer += decoder.decode(value, { stream: true })
        let sep: number
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          handleFrame(frame, onEvent)
        }
      }
    } catch {
      // 连接被拒/中断：走重连。
    }
    reader = null
    if (!closed) scheduleReconnect()
  }

  // 看门狗：长时间无数据 → 判定半开 → 掐断重连。
  watchdog = window.setInterval(() => {
    if (closed) return
    if (Date.now() - lastDataAt > WATCHDOG_STALE_MS) {
      killStream()
    }
  }, WATCHDOG_TICK_MS)

  // 页面回到前台：立即检查连接是否已僵死。
  const onVisibility = (): void => {
    if (closed || document.visibilityState !== 'visible') return
    if (Date.now() - lastDataAt > WATCHDOG_STALE_MS) {
      killStream()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  void connect()
  return () => {
    closed = true
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    if (watchdog !== null) {
      window.clearInterval(watchdog)
      watchdog = null
    }
    document.removeEventListener('visibilitychange', onVisibility)
    killStream()
  }
}

/** 解析一帧 SSE（event/data 行），danmaku 事件回调。 */
function handleFrame(frame: string, onEvent: (event: DanmakuEvent) => void): void {
  let eventName = ''
  let data = ''
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) data += line.slice(5).trimStart()
  }
  if (eventName !== SSE_EVENT_DANMAKU || data === '') return
  try {
    const parsed = JSON.parse(data) as Partial<DanmakuEvent>
    if (typeof parsed.id === 'number' && typeof parsed.text === 'string') {
      onEvent({
        id: parsed.id,
        ts: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
        trigger: typeof parsed.trigger === 'string' ? parsed.trigger : '',
        text: parsed.text,
        ...(typeof parsed.sessionId === 'string' ? { sessionId: parsed.sessionId } : {}),
      })
    }
  } catch {
    /* 忽略坏帧 */
  }
}

/** 让 host 广播一条测试弹幕（设置面板"测试"按钮）。 */
export async function sendTestDanmaku(patch?: { text?: string; trigger?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(TEST_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch ?? {}),
    })
    const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    if (!response.ok) {
      return { ok: false, error: body?.error ?? `HTTP ${response.status}` }
    }
    return { ok: body?.ok === true, error: body?.ok === true ? undefined : body?.error ?? '未知错误' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
