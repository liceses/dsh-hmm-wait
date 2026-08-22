/**
 * dsh-hmm-wait — host half.
 *
 * Watches the model's streaming reasoning output (the `llm/stream` waterfall
 * event, official dsh-llm protocol) for trigger words such as "hmm", "wait",
 * "let me", and pushes danmaku events to every subscribed browser tab over
 * SSE. All behavior is configurable through the official settings panel
 * (namespace `dsh-hmm-wait`): the master switch here is `enabled` — when
 * off, the tap is detached entirely.
 *
 * Version-agnostic by design: the only hard coupling is the `llm/stream`
 * event name and the `reasoning-delta` chunk shape (both public dsh-llm
 * stream protocol); every dependency is resolved from the host at runtime.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  DEFAULT_CONFIG,
  SETTINGS_NS,
  type HmmWaitConfig,
} from './schema.ts'
import { HmmWaitSettingsSchema } from './schema-def.ts'
import { createDetector, type DetectorHit, type DetectorOptions } from './detect.ts'
import { createHub, eventsRoute, testRoute, type DanmakuHub } from './routes.ts'
import type { DanmakuEvent } from './protocol.ts'

/** Stable cordis plugin name. */
export const name = 'hmm-wait'

/** Services required before the plugin can mount. */
export const inject = ['webServer', 'settings']

/** 弹幕事件全局序号。 */
let eventSeq = 0

/** 从配置派生检测器选项。 */
function detectorOptions(config: HmmWaitConfig): DetectorOptions {
  return {
    triggers: config.triggers,
    match: config.match,
    caseSensitive: config.caseSensitive,
    cooldownMs: config.cooldownMs,
    maxPerSecond: config.maxPerSecond,
    maxChars: config.maxContextChars,
  }
}

/** 把一次检测命中转成推送事件（showContext=false 时只显示触发词）。 */
function toEvent(
  config: HmmWaitConfig,
  hit: DetectorHit,
  options?: GenerateOptions,
): DanmakuEvent {
  return {
    id: ++eventSeq,
    ts: Date.now(),
    trigger: hit.trigger,
    text: config.showContext ? hit.text : hit.trigger,
    ...(options?.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
  }
}

/**
 * Mount the plugin: settings namespace, llm/stream tap (switchable), SSE hub,
 * and the two web routes.
 * @param ctx - host plugin context (webServer + settings services).
 */
export function apply(ctx: Context): void {
  const scope = ctx.settings.register(settingsNamespace(SETTINGS_NS), HmmWaitSettingsSchema, {
    applies: 'live',
  })
  let config: HmmWaitConfig = { ...DEFAULT_CONFIG, ...(scope.get() ?? {}) }
  const hub = createHub()
  let disposeTap: (() => void) | null = null

  // 动态挂/卸 llm/stream 监听：关闭时完全不触碰模型流。
  const installTap = (): void => {
    if (disposeTap !== null) return
    disposeTap = ctx.on('llm/stream', (options, next) => {
      if (!config.enabled) return next()
      return tapReasoningStream(hub, config, options, next())
    })
  }
  const uninstallTap = (): void => {
    if (disposeTap !== null) {
      disposeTap()
      disposeTap = null
    }
  }

  installTap()
  scope.watch((next) => {
    config = { ...DEFAULT_CONFIG, ...(next ?? {}) }
    if (config.enabled) installTap()
    else uninstallTap()
  })

  // 路由与心跳的卸载跟随插件 fiber。
  ctx.effect(() => ctx.webServer.register(eventsRoute(hub)), 'dsh-hmm-wait: events route')
  ctx.effect(
    () =>
      ctx.webServer.register(
        testRoute(hub, (body) => {
          const raw = body as { text?: unknown; trigger?: unknown } | null
          const trigger = typeof raw?.trigger === 'string' && raw.trigger !== '' ? raw.trigger : 'hmm'
          const text = typeof raw?.text === 'string' && raw.text !== '' ? raw.text : 'hmm… 让我再想想（测试弹幕）'
          return { id: ++eventSeq, ts: Date.now(), trigger, text }
        }),
      ),
    'dsh-hmm-wait: test route',
  )
  ctx.effect(() => () => hub.dispose(), 'dsh-hmm-wait: hub dispose')
}

/**
 * 包装一路 llm/stream：边透传边扫描 reasoning-delta。
 * 观察者语义：绝不修改、绝不吞 chunk；检测抛错时退化为纯透传。
 */
function tapReasoningStream(
  hub: DanmakuHub,
  config: HmmWaitConfig,
  options: GenerateOptions | undefined,
  source: AsyncIterable<StreamChunk>,
): AsyncIterable<StreamChunk> {
  const detector = createDetector(detectorOptions(config))
  return (async function* () {
    for await (const chunk of source) {
      try {
        if (
          chunk !== null &&
          typeof chunk === 'object' &&
          (chunk as StreamChunk).type === 'reasoning-delta' &&
          typeof (chunk as { text?: unknown }).text === 'string'
        ) {
          for (const hit of detector.push((chunk as { text: string }).text)) {
            hub.broadcast(toEvent(config, hit, options))
          }
        }
      } catch {
        // 检测绝不破坏模型流。
      }
      yield chunk
    }
  })()
}
