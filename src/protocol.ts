/**
 * dsh-hmm-wait — wire protocol shared by the host half (SSE producer) and the
 * browser half (SSE consumer). Both sides keep this shape in sync; the host
 * is the only writer, the client only reads.
 */

/** One danmaku event pushed from host to browser over SSE. */
export interface DanmakuEvent {
  /** Monotonic event id（host 生成，用于 client 去重）。 */
  id: number
  /** 事件时间戳（ms）。 */
  ts: number
  /** 命中的触发词（原文）。 */
  trigger: string
  /** 弹幕显示文本（触发词所在句或触发词本身）。 */
  text: string
  /** 所属会话 id（agent-loop 请求携带；手写请求可能缺失）。 */
  sessionId?: string
}

/** SSE 事件名（event: 行）。 */
export const SSE_EVENT_DANMAKU = 'danmaku'
export const SSE_EVENT_PING = 'ping'

/** SSE 推送端点（GET，浏览器订阅）。 */
export const EVENTS_PATH = '/api/dsh-hmm-wait/events'

/** 测试弹幕端点（POST，设置面板"测试"按钮触发一条模拟弹幕）。 */
export const TEST_PATH = '/api/dsh-hmm-wait/test'

/** 把一条弹幕事件序列化为一条 SSE 帧（不含结尾空行）。 */
export function encodeSseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}
