/**
 * dsh-hmm-wait — 街机风 Combo 连击 HUD（shell.overlay 第三条目）。
 *
 * 游戏化显示：大数字连击 + 触发词标签 + 每击弹跳 + 分级变色
 * （白→黄→橙→红+光晕）+ 里程碑全屏播报（×10/×20/…）+ 连击中断动画。
 * 位置可配置（右下/左下/右上/左上）。数据来自弹幕事件携带的 combo
 * （host 状态机计算，刷新/重连不丢）。
 */

import { useEffect, useRef, useState, useSyncExternalStore, type ReactElement } from 'react'
import type { ComboPosition, HmmWaitConfig } from '../schema.ts'
import { getComboSnapshot, getConfigSnapshot, subscribeCombo, subscribeConfig } from './state.ts'

/** 里程碑文案池（combo ≥ 10 且为 10 的倍数时随机播报）。 */
const MILESTONE_LINES: Array<[number, string]> = [
  [10, '热身完毕！'],
  [20, '脑内风暴！'],
  [30, 'CPU 燃烧中！'],
  [50, '模型宕机边缘！'],
  [100, 'AI の 沉思极限！'],
]

/** 连击分级 → 视觉等级。 */
function tierOf(combo: number): 1 | 2 | 3 | 4 {
  if (combo >= 20) return 4
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  return 1
}

/** 里程碑文案（无则 null）。 */
function milestoneText(combo: number): string | null {
  for (let i = MILESTONE_LINES.length - 1; i >= 0; i--) {
    const [threshold, text] = MILESTONE_LINES[i]!
    if (combo >= threshold) return `${combo} COMBO — ${text}`
  }
  return null
}

/** 街机风 Combo HUD。 */
export function ComboHud(): ReactElement {
  const combo = useSyncExternalStore(subscribeCombo, getComboSnapshot)
  const { config } = useSyncExternalStore(subscribeConfig, getConfigSnapshot)
  const [bounceKey, setBounceKey] = useState(0)
  const [milestone, setMilestone] = useState<string | null>(null)
  const [broke, setBroke] = useState<number | null>(null)
  const prevCombo = useRef(0)
  const timerLastRef = useRef(combo.lastHitAt)
  timerLastRef.current = combo.lastHitAt

  // combo 增长 → 弹跳 + 里程碑播报。
  useEffect(() => {
    const prev = prevCombo.current
    prevCombo.current = combo.combo
    if (combo.combo > 0 && combo.combo !== prev) {
      setBounceKey((key) => key + 1)
      setBroke(null)
      if (combo.combo > prev && config.comboMilestones) {
        const text = milestoneText(combo.combo)
        if (text !== null) {
          setMilestone(text)
          const timer = window.setTimeout(() => setMilestone(null), 2000)
          return () => window.clearTimeout(timer)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo.combo])

  // 连击中断检测：窗口内无新命中 → "COMBO END" 动画。
  useEffect(() => {
    timerLastRef.current = combo.lastHitAt
    if (combo.combo === 0) return
    const check = (): void => {
      if (Date.now() - timerLastRef.current > config.comboWindowMs) {
        setBroke(combo.combo)
        prevCombo.current = 0
      }
    }
    const timer = window.setInterval(check, 500)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo.combo, combo.lastHitAt])

  if (!config.comboEnabled) return <></>
  const active = combo.combo > 0
  const tier = tierOf(combo.combo)
  const pos = config.comboPosition

  return (
    <div className={`dsh-hmm-combo dsh-hmm-combo-${pos}`} data-combo={active ? combo.combo : 0}>
      {milestone !== null ? <div className="dsh-hmm-combo-milestone">{milestone}</div> : null}
      {broke !== null ? (
        <div className="dsh-hmm-combo-broke" key={`broke-${broke}-${combo.lastHitAt}`}>
          <span className="dsh-hmm-combo-broke-num">×{broke}</span>
          <span className="dsh-hmm-combo-broke-label">COMBO END</span>
        </div>
      ) : null}
      {active ? (
        <div className={`dsh-hmm-combo-hud dsh-hmm-combo-tier-${tier}`} key={bounceKey}>
          <div className="dsh-hmm-combo-num">
            <span className="dsh-hmm-combo-times">×</span>
            <span className="dsh-hmm-combo-count">{combo.combo}</span>
          </div>
          <div className="dsh-hmm-combo-trigger">{combo.trigger}</div>
          {combo.max > 0 ? <div className="dsh-hmm-combo-max">BEST {combo.max}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
