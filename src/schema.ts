/**
 * dsh-hmm-wait — settings types, defaults, and the namespace string.
 *
 * The settings namespace is registered by the host half through the official
 * `ctx.settings` service, so the dsh 设置面板（settings → plugins →
 * configurable）auto-discovers the namespace and pairs it with the card this
 * package registers into the `settings.plugin.item` slot. This file carries
 * NO runtime dependencies (the browser bundle imports it); the schemastery
 * schema itself lives in `schema-def.ts` (host only).
 */

/** Settings namespace this package owns (lowercase kebab-case). */
export const SETTINGS_NS = 'dsh-hmm-wait'

/** 弹幕流动方向。 */
export type DanmakuDirection = 'right-to-left' | 'left-to-right' | 'top-to-bottom' | 'bottom-to-top'

/** 弹幕显示区域。 */
export type DanmakuZone = 'top' | 'bottom' | 'full'

/** 触发匹配模式：句子/段首（推荐）或任意位置。 */
export type TriggerMatchMode = 'sentence-start' | 'anywhere'

/** 完整用户配置。所有字段均有默认值；设置面板只写用户覆盖的字段。 */
export interface HmmWaitConfig {
  /** 总开关：关闭后 host 不再监听思维链，弹幕层静默。 */
  enabled: boolean
  /** 触发词列表（正则片段，自动转义）。 */
  triggers: string[]
  /** 匹配模式：sentence-start = 只匹配句子/段落的开头；anywhere = 任意位置。 */
  match: TriggerMatchMode
  /** 大小写敏感（对英文触发词有效）。 */
  caseSensitive: boolean
  /** 同一触发词的冷却毫秒数（防流式 chunk 重复触发）。 */
  cooldownMs: number
  /** 全局限流：每秒最多推送的弹幕数。 */
  maxPerSecond: number
  /** 弹幕流动方向。 */
  direction: DanmakuDirection
  /** 流动速度（px/s）。 */
  speed: number
  /** 字号（px）。 */
  fontSize: number
  /** 文字颜色（CSS 颜色）。 */
  color: string
  /** 整体透明度 0..1。 */
  opacity: number
  /** 显示区域：顶部 / 底部 / 全屏。 */
  zone: DanmakuZone
  /** 出现时是否抖动提醒。 */
  shake: boolean
  /** 抖动幅度（px）。 */
  shakeIntensity: number
  /** 同屏最多弹幕条数（超出丢弃新弹幕）。 */
  maxOnScreen: number
  /** 弹幕文本：true = 触发词所在句；false = 只显示触发词。 */
  showContext: boolean
  /** 弹幕文本最大字符数。 */
  maxContextChars: number
}

/** 工厂默认值（与 schema 默认值保持一致，供 client 端无 settings 时回退）。 */
export const DEFAULT_CONFIG: HmmWaitConfig = {
  enabled: true,
  triggers: ['hmm', 'wait', 'let me'],
  match: 'sentence-start',
  caseSensitive: false,
  cooldownMs: 5000,
  maxPerSecond: 3,
  direction: 'right-to-left',
  speed: 120,
  fontSize: 18,
  color: '#ffd866',
  opacity: 0.92,
  zone: 'top',
  shake: true,
  shakeIntensity: 4,
  maxOnScreen: 12,
  showContext: true,
  maxContextChars: 80,
}
