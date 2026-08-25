/**
 * dsh-hmm-wait — settings card（官方折叠卡片风格）。
 *
 * Rendered into the `settings.plugin.item` slot（设置 → 插件 → 可配置）。
 * 形态与官方 BashCard / AgentLoopCard 一致：折叠卡片（标题 + 描述 +
 * chevron + 未保存徽章）→ 展开为字段表单 → 底部 丢弃 / 保存 操作；
 * 编辑先暂存（draft），点保存才写入 settings scope（live 生效）。
 * 样式使用官方主题变量（--dsw-alias-*），与设置页其余卡片同观感。
 */

import { useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import type { ComboPosition, DanmakuDirection, DanmakuZone, HmmWaitConfig, TriggerMatchMode } from '../schema.ts'
import { DEFAULT_CONFIG } from '../schema.ts'
import { sendTestDanmaku } from './api.ts'
import { getConfigSnapshot, subscribeConfig } from './state.ts'

/** 面板写入面（client apply 注入）。 */
export interface HmmWaitCardActions {
  /** 写一个字段到 settings scope（即时生效）。 */
  set(field: keyof HmmWaitConfig, value: unknown): Promise<void>
}

/** 字段序（决定表单顺序与保存 diff 顺序）。 */
const FIELDS: Array<keyof HmmWaitConfig> = [
  'enabled',
  'triggers',
  'match',
  'caseSensitive',
  'direction',
  'zone',
  'speed',
  'fontSize',
  'color',
  'opacity',
  'shake',
  'shakeIntensity',
  'maxOnScreen',
  'cooldownMs',
  'maxPerSecond',
  'showContext',
  'maxContextChars',
  'fontFamily',
  'shadow',
  'comboEnabled',
  'comboWindowMs',
  'comboPosition',
  'comboMilestones',
]

/** 解析触发词输入框文本为数组（逗号/中文逗号分隔，去空白，忽略空项）。 */
function parseTriggers(text: string): string[] {
  return text
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

/** 值是否相等（触发词数组按序比较）。 */
function valueEquals(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index])
  }
  return Object.is(a, b)
}

const DIRECTION_OPTIONS: Array<[DanmakuDirection, string]> = [
  ['right-to-left', '从右向左'],
  ['left-to-right', '从左向右'],
  ['top-to-bottom', '从上向下'],
  ['bottom-to-top', '从下向上'],
]
const ZONE_OPTIONS: Array<[DanmakuZone, string]> = [
  ['top', '顶部'],
  ['bottom', '底部'],
  ['full', '全屏'],
]
const MATCH_OPTIONS: Array<[TriggerMatchMode, string]> = [
  ['sentence-start', '句子/段首（推荐）'],
  ['anywhere', '任意位置'],
]

/** 一个字段行：label + 控件（官方 ValueField 的紧凑双列版）。 */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}): ReactElement {
  return (
    <div className="dsh-hmm-wait-field">
      <label>{label}</label>
      {children}
      {hint !== undefined ? <p className="dsh-hmm-wait-field-hint">{hint}</p> : null}
    </div>
  )
}

/** 官方风格折叠配置卡片。 */
export function SettingsCard({ actions }: { actions: HmmWaitCardActions }): ReactElement {
  const { status, config } = useSyncExternalStore(subscribeConfig, getConfigSnapshot)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<HmmWaitConfig | null>(null)
  // 触发词用原始字符串暂存（不实时解析，保证空格/逗号输入不被吞）。
  const [triggersText, setTriggersText] = useState<string>(config.triggers.join(', '))
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  const parsedTriggers = parseTriggers(triggersText)
  const triggersDirty = !valueEquals(parsedTriggers, config.triggers)
  const dirty = draft !== null || triggersDirty
  const current: HmmWaitConfig = draft ?? config

  const edit = (field: keyof HmmWaitConfig, value: unknown): void => {
    setFailed(false)
    setDraft({ ...(draft ?? config), [field]: value })
  }

  const save = async (): Promise<void> => {
    if (!dirty || saving) return
    setSaving(true)
    setFailed(false)
    try {
      // 最终值 = 暂存字段 + 触发词解析结果（触发词不经过 draft）。
      const final: HmmWaitConfig = {
        ...(draft ?? config),
        triggers: parsedTriggers.length > 0 ? parsedTriggers : DEFAULT_CONFIG.triggers,
      }
      for (const field of FIELDS) {
        if (!valueEquals(final[field], config[field])) {
          await actions.set(field, final[field])
        }
      }
      setDraft(null)
      setTriggersText(final.triggers.join(', '))
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const discard = (): void => {
    setDraft(null)
    setTriggersText(config.triggers.join(', '))
    setFailed(false)
  }

  const runTest = async (): Promise<void> => {
    if (testState === 'sending') return
    setTestState('sending')
    const result = await sendTestDanmaku()
    setTestState(result.ok ? 'ok' : 'error')
    window.setTimeout(() => setTestState('idle'), 2000)
  }

  const number = (field: keyof HmmWaitConfig, min: number, max: number, fallback: number) => (
    <input
      type="number"
      min={min}
      max={max}
      value={current[field] as number}
      onChange={(event) => edit(field, Number(event.target.value) || fallback)}
    />
  )

  return (
    <li className={open ? 'dsh-hmm-wait-card dsh-hmm-wait-card-open' : 'dsh-hmm-wait-card'}>
      <button
        type="button"
        className="dsh-hmm-wait-card-header"
        aria-expanded={open}
        aria-label={`${open ? '收起' : '展开'} Hmm-Wait 思维链弹幕设置`}
        onClick={() => setOpen(!open)}
      >
        <span className="dsh-hmm-wait-card-headtext">
          <span className="dsh-hmm-wait-card-name">Hmm-Wait 思维链弹幕</span>
          <span className="dsh-hmm-wait-card-desc">
            模型思维链出现 hmm / wait / let me 时弹幕提醒
            {status === 'unavailable' ? '（设置不可达，使用默认值）' : ''}
          </span>
        </span>
        {dirty ? <span className="dsh-hmm-wait-card-pending">未保存</span> : null}
        <span className="dsh-hmm-wait-card-chevron" aria-hidden>▾</span>
      </button>

      {open ? (
        <div className="dsh-hmm-wait-card-body">
          <div className="dsh-hmm-wait-fields">
            <Field label="开关">
              <label className="dsh-hmm-wait-check">
                <input
                  type="checkbox"
                  checked={current.enabled}
                  onChange={(event) => edit('enabled', event.target.checked)}
                />
                <span>{current.enabled ? '已启用' : '已停用'}</span>
              </label>
            </Field>

            <Field label="触发词（逗号分隔）" hint="支持含空格的词，如 let me；正则自动转义">
              <input
                value={triggersText}
                onChange={(event) => {
                  setFailed(false)
                  setTriggersText(event.target.value)
                }}
              />
            </Field>

            <Field label="匹配位置">
              <select value={current.match} onChange={(event) => edit('match', event.target.value as TriggerMatchMode)}>
                {MATCH_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="流动方向">
              <select value={current.direction} onChange={(event) => edit('direction', event.target.value as DanmakuDirection)}>
                {DIRECTION_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="显示区域">
              <select value={current.zone} onChange={(event) => edit('zone', event.target.value as DanmakuZone)}>
                {ZONE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="速度（px/s）">{number('speed', 20, 600, DEFAULT_CONFIG.speed)}</Field>

            <Field label="字号（px）">{number('fontSize', 10, 64, DEFAULT_CONFIG.fontSize)}</Field>

            <Field label="文字颜色">
              <input type="color" value={current.color} onChange={(event) => edit('color', event.target.value)} />
            </Field>

            <Field label="透明度（0.05–1）">{number('opacity', 0.05, 1, DEFAULT_CONFIG.opacity)}</Field>

            <Field label="抖动提醒">
              <label className="dsh-hmm-wait-check">
                <input type="checkbox" checked={current.shake} onChange={(event) => edit('shake', event.target.checked)} />
                <span>{current.shake ? '开' : '关'}</span>
              </label>
            </Field>

            <Field label="抖动幅度（px）">{number('shakeIntensity', 1, 20, DEFAULT_CONFIG.shakeIntensity)}</Field>

            <Field label="同屏上限">{number('maxOnScreen', 1, 50, DEFAULT_CONFIG.maxOnScreen)}</Field>

            <Field label="触发冷却（ms）" hint="同一触发词防重复">{number('cooldownMs', 500, 120000, DEFAULT_CONFIG.cooldownMs)}</Field>

            <Field label="全局限流（条/秒）">{number('maxPerSecond', 1, 30, DEFAULT_CONFIG.maxPerSecond)}</Field>

            <Field label="弹幕文本">
              <select
                value={current.showContext ? 'context' : 'trigger'}
                onChange={(event) => edit('showContext', event.target.value === 'context')}
              >
                <option value="context">触发词所在句</option>
                <option value="trigger">仅触发词</option>
              </select>
            </Field>

            <Field label="文本最大字符">{number('maxContextChars', 8, 200, DEFAULT_CONFIG.maxContextChars)}</Field>

            <Field label="弹幕字体" hint="留空继承界面字体，如 Microsoft YaHei">
              <input
                type="text"
                value={current.fontFamily}
                placeholder="留空 = 继承"
                onChange={(event) => edit('fontFamily', event.target.value)}
              />
            </Field>

            <Field label="弹幕框阴影">
              <label className="dsh-hmm-wait-check">
                <input type="checkbox" checked={current.shadow} onChange={(event) => edit('shadow', event.target.checked)} />
                <span>{current.shadow ? '开' : '关'}</span>
              </label>
            </Field>

            <Field label="大小写敏感">
              <label className="dsh-hmm-wait-check">
                <input type="checkbox" checked={current.caseSensitive} onChange={(event) => edit('caseSensitive', event.target.checked)} />
                <span>{current.caseSensitive ? '开' : '关'}</span>
              </label>
            </Field>

            <Field label="连击计数 HUD">
              <label className="dsh-hmm-wait-check">
                <input type="checkbox" checked={current.comboEnabled} onChange={(event) => edit('comboEnabled', event.target.checked)} />
                <span>{current.comboEnabled ? '开' : '关'}</span>
              </label>
            </Field>

            <Field label="连击窗口（ms）" hint="两次命中间隔超过则中断">
              {number('comboWindowMs', 1000, 60000, DEFAULT_CONFIG.comboWindowMs)}
            </Field>

            <Field label="HUD 位置">
              <select value={current.comboPosition} onChange={(event) => edit('comboPosition', event.target.value as ComboPosition)}>
                <option value="bottom-right">右下</option>
                <option value="bottom-left">左下</option>
                <option value="top-right">右上</option>
                <option value="top-left">左上</option>
              </select>
            </Field>

            <Field label="里程碑播报">
              <label className="dsh-hmm-wait-check">
                <input type="checkbox" checked={current.comboMilestones} onChange={(event) => edit('comboMilestones', event.target.checked)} />
                <span>{current.comboMilestones ? '开' : '关'}</span>
              </label>
            </Field>
          </div>

          <div className="dsh-hmm-wait-card-footer">
            <button
              type="button"
              className="dsh-hmm-wait-card-test"
              disabled={testState === 'sending'}
              onClick={() => void runTest()}
            >
              {testState === 'sending' ? '发送中…' : testState === 'ok' ? '测试弹幕 ✓' : testState === 'error' ? '测试失败 ✗' : '测试弹幕'}
            </button>
            {failed ? <p className="dsh-hmm-wait-card-failed" role="status">保存失败</p> : null}
            <button type="button" className="dsh-hmm-wait-card-discard" disabled={!dirty || saving} onClick={discard}>
              丢弃
            </button>
            <button type="button" className="dsh-hmm-wait-card-save" disabled={!dirty || saving} onClick={() => void save()}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
