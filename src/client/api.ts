/**
 * dsh-hmm-wait — browser-side API: SSE subscription to the danmaku stream
 * (with auto-reconnect) and the test-danmaku call. Plain fetch on the same
 * origin — the same data path the dsh web GUI itself uses.
 */

import type { DanmakuEvent } from '../protocol.ts'
import { EVENTS_PATH, TEST_PATH, SSE_EVENT_DANMAKU } from '../protocol.ts'

/** 订阅弹幕流；返回取消函数。断线自动 3s 重连（直到 close）。 */
export function subscribeDanmaku(onEvent: (event: DanmakuEvent) => void): () => void {
  let closed = false
  let timer: number | null = null

  const scheduleReconnect = (): void => {
    if (closed) return
    timer = window.setTimeout(() => {
      timer = null
      void connect()
    }, 3000)
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
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
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
    if (!closed) scheduleReconnect()
  }

  void connect()
  return () => {
    closed = true
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
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
