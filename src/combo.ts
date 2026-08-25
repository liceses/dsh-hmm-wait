/**
 * dsh-hmm-wait — combo（连击）状态机（host 侧）。
 *
 * 游戏化连击：命中触发词 = 一击；两次命中间隔 ≤ 窗口则连击延续 +1，
 * 超窗则归零重新开始。状态挂进程级（ctx.root），热重载/插件重装不丢。
 * 纯逻辑、无依赖，可单测。
 */

/** 一次命中后的连击快照（广播进事件）。 */
export interface ComboHitResult {
  /** 当前连击数（≥1）。 */
  combo: number
  /** 本进程周期内的最高连击。 */
  max: number
}

/** 连击追踪器。 */
export interface ComboTracker {
  /** 处理一次命中；windowMs 为连击窗口（ms）。 */
  hit(now: number, windowMs: number): ComboHitResult
  /** 当前状态快照。 */
  snapshot(): ComboSnapshotState
  /** 清零（保留 max？——按游戏惯例，最高纪录保留到进程结束）。 */
  reset(): void
}

export interface ComboSnapshotState {
  count: number
  max: number
  lastHitAt: number
  startedAt: number
}

/** 工厂：创建连击追踪器。 */
export function createComboTracker(): ComboTracker {
  let count = 0
  let max = 0
  let lastHitAt = 0
  let startedAt = 0

  return {
    hit(now: number, windowMs: number): ComboHitResult {
      if (lastHitAt > 0 && now - lastHitAt <= windowMs) {
        count += 1
      } else {
        count = 1
        startedAt = now
      }
      lastHitAt = now
      if (count > max) max = count
      return { combo: count, max }
    },
    snapshot(): ComboSnapshotState {
      return { count, max, lastHitAt, startedAt }
    },
    reset(): void {
      count = 0
      max = 0
      lastHitAt = 0
      startedAt = 0
    },
  }
}
