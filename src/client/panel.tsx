/**
 * dsh-hmm-wait — settings card, rendered into the `settings.plugin.item` slot
 * (the official configurable-plugins tab). Keyed by the `dsh-hmm-wait`
 * settings namespace; every write goes through the client settings scope so
 * it lands in the host settings document and applies live.
 */

import { useRef, useState, useSyncExternalStore, type ReactElement } from 'react'
import type { DanmakuDirection, DanmakuZone, HmmWaitConfig, TriggerMatchMode } from '../schema.ts'
import { DEFAULT_CONFIG } from '../schema.ts'
import { sendTestDanmaku } from './api.ts'
import { getConfigSnapshot, subscribeConfig } from './state.ts'

/** 面板写入面（client apply 注入）。 */
export interface HmmWaitCardActions {
  /** 写一个字段到 settings scope（即时生效）。 */
  set(field: keyof HmmWaitConfig, value: unknown): Promise<void>
}

/** 设置卡片（settings.plugin.item 注册组件）。 */
export function SettingsCard({ actions }: { actions: HmmWaitCardActions }): ReactElement {
  const { status, config } = useSyncExternalStore(subscribeConfig, getConfigSnapshot)
  const [saving, setSaving] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const savingTimer = useRef<number | null>(null)

  const apply = (field: keyof HmmWaitConfig, value: unknown): void => {
    if (savingTimer.current !== null) window.clearTimeout(savingTimer.current)
    setSaving(true)
    void actions.set(field, value).finally(() => {
      savingTimer.current = window.setTimeout(() => setSaving(false), 600)
    })
  }

  const runTest = async (): Promise<void> => {
    setTestState('sending')
    const result = await sendTestDanmaku()
    setTestState(result.ok ? 'ok' : 'error')
    window.setTimeout(() => setTestState('idle'), 2000)
  }

  const triggersText = config.triggers.join(', ')
  const directionOptions: Array<[DanmakuDirection, string]> = [
    ['right-to-left', '从右向左'],
    ['left-to-right', '从左向右'],
    ['top-to-bottom', '从上向下'],
    ['bottom-to-top', '从下向上'],
  ]
  const zoneOptions: Array<[DanmakuZone, string]> = [
    ['top', '顶部'],
    ['bottom', '底部'],
    ['full', '全屏'],
  ]
  const matchOptions: Array<[TriggerMatchMode, string]> = [
    ['sentence-start', '句子/段首（推荐）'],
    ['anywhere', '任意位置'],
  ]

  return (
    <div className="dsh-hmm-wait-card">
      <div className="dsh-hmm-wait-card-head">
        <div>
          <strong>Hmm-Wait 思维链弹幕</strong>
          <div className="dsh-hmm-wait-card-sub">
            模型思维链出现 hmm / wait / let me 时弹幕提醒
            {status === 'unavailable' ? '（设置不可达，使用默认值）' : ''}
          </div>
        </div>
        <div className="dsh-hmm-wait-card-actions">
          <button type="button" className="dsh-hmm-wait-btn" disabled={testState === 'sending'} onClick={() => void runTest()}>
            {testState === 'sending' ? '发送中…' : testState === 'ok' ? '已发送 ✓' : testState === 'error' ? '失败 ✗' : '测试弹幕'}
          </button>
          <label className="dsh-hmm-wait-switch">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) => apply('enabled', event.target.checked)}
            />
            <span className={config.enabled ? 'dsh-hmm-wait-switch-on' : 'dsh-hmm-wait-switch-off'}>
              {config.enabled ? '已启用' : '已停用'}
            </span>
          </label>
        </div>
      </div>

      <div className="dsh-hmm-wait-card-grid">
        <label className="dsh-hmm-wait-field">
          <span>触发词（逗号分隔）</span>
          <input
            value={triggersText}
            onChange={(event) => {
              const list = event.target.value
                .split(/[,，]/)
                .map((part) => part.trim())
                .filter((part) => part !== '')
              apply('triggers', list.length > 0 ? list : DEFAULT_CONFIG.triggers)
            }}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>流动方向</span>
          <select value={config.direction} onChange={(event) => apply('direction', event.target.value as DanmakuDirection)}>
            {directionOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="dsh-hmm-wait-field">
          <span>显示区域</span>
          <select value={config.zone} onChange={(event) => apply('zone', event.target.value as DanmakuZone)}>
            {zoneOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="dsh-hmm-wait-field">
          <span>速度（px/s）</span>
          <input
            type="number"
            min={20}
            max={600}
            value={config.speed}
            onChange={(event) => apply('speed', Number(event.target.value) || DEFAULT_CONFIG.speed)}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>字号（px）</span>
          <input
            type="number"
            min={10}
            max={64}
            value={config.fontSize}
            onChange={(event) => apply('fontSize', Number(event.target.value) || DEFAULT_CONFIG.fontSize)}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>文字颜色</span>
          <input
            type="color"
            value={config.color}
            onChange={(event) => apply('color', event.target.value)}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>透明度（0.05–1）</span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={config.opacity}
            onChange={(event) => apply('opacity', Number(event.target.value))}
          />
        </label>

        <label className="dsh-hmm-wait-field dsh-hmm-wait-check">
          <input
            type="checkbox"
            checked={config.shake}
            onChange={(event) => apply('shake', event.target.checked)}
          />
          <span>出现时抖动提醒</span>
        </label>

        <label className="dsh-hmm-wait-field">
          <span>抖动幅度（px）</span>
          <input
            type="number"
            min={1}
            max={20}
            value={config.shakeIntensity}
            onChange={(event) => apply('shakeIntensity', Number(event.target.value) || DEFAULT_CONFIG.shakeIntensity)}
          />
        </label>
      </div>

      <details className="dsh-hmm-wait-advanced">
        <summary>高级选项</summary>
        <div className="dsh-hmm-wait-card-grid">
        <label className="dsh-hmm-wait-field">
          <span>匹配位置</span>
          <select value={config.match} onChange={(event) => apply('match', event.target.value as TriggerMatchMode)}>
            {matchOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="dsh-hmm-wait-field dsh-hmm-wait-check">
          <input
            type="checkbox"
            checked={config.caseSensitive}
            onChange={(event) => apply('caseSensitive', event.target.checked)}
          />
          <span>大小写敏感</span>
        </label>

        <label className="dsh-hmm-wait-field">
          <span>同屏上限</span>
          <input
            type="number"
            min={1}
            max={50}
            value={config.maxOnScreen}
            onChange={(event) => apply('maxOnScreen', Number(event.target.value) || DEFAULT_CONFIG.maxOnScreen)}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>冷却（ms）</span>
          <input
            type="number"
            min={500}
            max={120000}
            step={500}
            value={config.cooldownMs}
            onChange={(event) => apply('cooldownMs', Number(event.target.value) || DEFAULT_CONFIG.cooldownMs)}
          />
        </label>

        <label className="dsh-hmm-wait-field">
          <span>弹幕文本</span>
          <select
            value={config.showContext ? 'context' : 'trigger'}
            onChange={(event) => apply('showContext', event.target.value === 'context')}
          >
            <option value="context">触发词所在句</option>
            <option value="trigger">仅触发词</option>
          </select>
        </label>

        <label className="dsh-hmm-wait-field">
          <span>文本最大字符</span>
          <input
            type="number"
            min={8}
            max={200}
            value={config.maxContextChars}
            onChange={(event) => apply('maxContextChars', Number(event.target.value) || DEFAULT_CONFIG.maxContextChars)}
          />
        </label>
        </div>
      </details>

      {saving ? <div className="dsh-hmm-wait-card-hint">保存中…</div> : null}
    </div>
  )
}
