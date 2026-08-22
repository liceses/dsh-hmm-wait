/**
 * dsh-hmm-wait — SSE hub and web routes (host half).
 *
 * A tiny broadcast hub: browser tabs subscribe via GET
 * /api/dsh-hmm-wait/events (SSE, holds the response open), the llm/stream tap
 * and the test endpoint push danmaku events through it. All HTTP shapes ride
 * the official `webServer` route registry — no dsh internals touched.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  EVENTS_PATH,
  TEST_PATH,
  STATS_PATH,
  SSE_EVENT_DANMAKU,
  SSE_EVENT_PING,
  encodeSseFrame,
  type DanmakuEvent,
} from './protocol.ts'

/** Producer face of the hub (used by the llm/stream tap and the test route). */
export interface DanmakuHub {
  /** 推一条弹幕给所有已订阅的浏览器。 */
  broadcast(event: DanmakuEvent): void
  /** 当前订阅连接数（诊断用）。 */
  subscriberCount(): number
  /** 关闭所有连接并停止心跳（挂在 ctx.effect 的清理里）。 */
  dispose(): void
}

/** Hub 内部面：额外的订阅挂载点（仅 eventsRoute 使用）。 */
export interface DanmakuHubInternal extends DanmakuHub {
  _subscribe(res: ServerResponse): void
}

/** 路由形状（与 webServer.register 入参一致）。 */
export interface RouteLike {
  kind: 'exact'
  path: string
  handler(req: IncomingMessage, res: ServerResponse): void | Promise<void>
}

/**
 * Create the hub. The heartbeat interval is owned by the caller's fiber:
 * dispose() must run when the plugin unloads (call it from ctx.effect).
 */
export function createHub(heartbeatMs = 30000): DanmakuHubInternal {
  const subscribers = new Set<ServerResponse>()
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const send = (res: ServerResponse, frame: string): void => {
    if (res.destroyed || res.writableEnded) {
      subscribers.delete(res)
      return
    }
    res.write(frame)
  }

  heartbeat = setInterval(() => {
    const frame = encodeSseFrame(SSE_EVENT_PING, { ts: Date.now() })
    for (const res of [...subscribers]) send(res, frame)
  }, heartbeatMs)

  return {
    broadcast(event: DanmakuEvent): void {
      const frame = encodeSseFrame(SSE_EVENT_DANMAKU, event)
      for (const res of [...subscribers]) send(res, frame)
    },
    subscriberCount(): number {
      return subscribers.size
    },
    dispose(): void {
      if (heartbeat !== null) {
        clearInterval(heartbeat)
        heartbeat = null
      }
      for (const res of subscribers) {
        try {
          res.end()
        } catch {
          /* ignore */
        }
      }
      subscribers.clear()
    },
    _subscribe(res: ServerResponse): void {
      subscribers.add(res)
      res.on('close', () => {
        subscribers.delete(res)
      })
    },
  }
}

/** GET 订阅端点：挂起响应，推送 `danmaku` 与 `ping` 事件。 */
export function eventsRoute(hub: DanmakuHubInternal): RouteLike {
  return {
    kind: 'exact',
    path: EVENTS_PATH,
    handler(_req, res) {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      })
      res.write(': connected\n\n')
      hub._subscribe(res)
    },
  }
}

/** GET 诊断端点：订阅者数与累计事件数（排障用）。 */
export function statsRoute(hub: DanmakuHub, events: () => number): RouteLike {
  return {
    kind: 'exact',
    path: STATS_PATH,
    handler(_req, res) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: true, subscribers: hub.subscriberCount(), events: events(), ts: Date.now() }))
    },
  }
}

/** POST 测试端点：广播一条模拟弹幕（设置面板"测试"按钮调用）。 */
export function testRoute(hub: DanmakuHub, makeEvent: (body: unknown) => DanmakuEvent): RouteLike {
  return {
    kind: 'exact',
    path: TEST_PATH,
    handler(req, res) {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
        return
      }
      let raw = ''
      req.setEncoding('utf8')
      req.on('data', (chunk: string) => {
        raw += chunk
        if (raw.length > 64 * 1024) req.destroy()
      })
      req.on('end', () => {
        let body: unknown
        try {
          body = raw === '' ? {} : JSON.parse(raw)
        } catch {
          body = {}
        }
        const event = makeEvent(body)
        hub.broadcast(event)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, id: event.id }))
      })
      req.on('error', () => {
        if (!res.writableEnded) {
          res.writeHead(400, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'bad request' }))
        }
      })
    },
  }
}
