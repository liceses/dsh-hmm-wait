/**
 * dsh-hmm-wait — settings schema definition (HOST ONLY).
 *
 * Kept separate from `schema.ts` so the browser bundle never pulls in
 * schemastery: the client half only needs the plain config types, defaults,
 * and the namespace string.
 */

import Schema from '@deepseek-ai/schemastery'
import { DEFAULT_CONFIG } from './schema.ts'

/** Settings schema（schemastery），供 host 注册与设置面板渲染。 */
export const HmmWaitSettingsSchema = Schema.object({
  enabled: Schema.boolean().default(DEFAULT_CONFIG.enabled),
  triggers: Schema.array(Schema.string()).default(DEFAULT_CONFIG.triggers),
  match: Schema.union([Schema.const('sentence-start' as const), Schema.const('anywhere' as const)])
    .default(DEFAULT_CONFIG.match),
  caseSensitive: Schema.boolean().default(DEFAULT_CONFIG.caseSensitive),
  cooldownMs: Schema.number().default(DEFAULT_CONFIG.cooldownMs),
  maxPerSecond: Schema.number().default(DEFAULT_CONFIG.maxPerSecond),
  direction: Schema.union([
    Schema.const('right-to-left' as const),
    Schema.const('left-to-right' as const),
    Schema.const('top-to-bottom' as const),
    Schema.const('bottom-to-top' as const),
  ]).default(DEFAULT_CONFIG.direction),
  speed: Schema.number().default(DEFAULT_CONFIG.speed),
  fontSize: Schema.number().default(DEFAULT_CONFIG.fontSize),
  color: Schema.string().default(DEFAULT_CONFIG.color),
  opacity: Schema.number().default(DEFAULT_CONFIG.opacity),
  zone: Schema.union([
    Schema.const('top' as const),
    Schema.const('bottom' as const),
    Schema.const('full' as const),
  ]).default(DEFAULT_CONFIG.zone),
  shake: Schema.boolean().default(DEFAULT_CONFIG.shake),
  shakeIntensity: Schema.number().default(DEFAULT_CONFIG.shakeIntensity),
  maxOnScreen: Schema.number().default(DEFAULT_CONFIG.maxOnScreen),
  showContext: Schema.boolean().default(DEFAULT_CONFIG.showContext),
  maxContextChars: Schema.number().default(DEFAULT_CONFIG.maxContextChars),
})
