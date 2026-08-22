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

/** 入队一条弹幕；超出 maxOnScreen 时挤掉最旧的。 */
export function pushDanmaku(item: DanmakuItem, maxOnScreen: number): void {
  items = [...items, item]
  const cap = Math.max(1, maxOnScreen)
  if (items.length > cap) items = items.slice(items.length - cap)
  emitItems()
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
