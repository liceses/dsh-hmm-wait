/**
 * dsh-hmm-wait — 页面迷你配置卡片（shell.overlay 第二条目）。
 *
 * 右下角一个小齿轮按钮，点击展开紧凑配置卡：开关、方向、速度、字号、
 * 抖动、测试弹幕。所有写入走同一个 settings scope（与官方设置页卡片
 * 同源、live 生效），设置页里的完整配置保持不变。
 */

import { useState, useSyncExternalStore, type ReactElement } from 'react'
import type { DanmakuDirection, HmmWaitConfig } from '../schema.ts'
import { sendTestDanmaku } from './api.ts'
import type { HmmWaitCardActions } from './panel.tsx'
import { getConfigSnapshot, subscribeConfig } from './state.ts'

const DIRECTION_OPTIONS: Array<[DanmakuDirection, string]> = [
  ['right-to-left', '右→左'],
  ['left-to-right', '左→右'],
  ['top-to-bottom', '上→下'],
  ['bottom-to-top', '下→上'],
]

/** 迷你卡片：常驻齿轮按钮 + 展开的紧凑配置。 */
export function MiniConfigCard({ actions }: { actions: HmmWaitCardActions }): ReactElement {
  const { config } = useSyncExternalStore(subscribeConfig, getConfigSnapshot)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<'idle' | 'ok' | 'error'>('idle')

  const apply = (field: keyof HmmWaitConfig, value: unknown): void => {
    void actions.set(field, value)
  }

  const runTest = async (): Promise<void> => {
    if (sending) return
    setSending(true)
    const result = await sendTestDanmaku()
    setSent(result.ok ? 'ok' : 'error')
    setSending(false)
    window.setTimeout(() => setSent('idle'), 1500)
  }

  return (
    <div className="dsh-hmm-wait-mini">
      {open ? (
        <div className="dsh-hmm-wait-mini-card">
          <div className="dsh-hmm-wait-mini-head">
            <span className="dsh-hmm-wait-mini-title">💬 弹幕设置</span>
            <span
              className={config.enabled ? 'dsh-hmm-wait-mini-dot on' : 'dsh-hmm-wait-mini-dot'}
              title={config.enabled ? '已启用' : '已停用'}
            />
          </div>

          <label className="dsh-hmm-wait-mini-row">
            <span>开关</span>
            <button
              type="button"
              className={config.enabled ? 'dsh-hmm-wait-mini-toggle on' : 'dsh-hmm-wait-mini-toggle'}
              onClick={() => apply('enabled', !config.enabled)}
            >
              {config.enabled ? '已启用' : '已停用'}
            </button>
          </label>

          <label className="dsh-hmm-wait-mini-row">
            <span>方向</span>
            <select
              value={config.direction}
              onChange={(event) => apply('direction', event.target.value as DanmakuDirection)}
            >
              {DIRECTION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="dsh-hmm-wait-mini-row">
            <span>速度 {config.speed}</span>
            <input
              type="range"
              min={40}
              max={400}
              step={20}
              value={config.speed}
              onChange={(event) => apply('speed', Number(event.target.value))}
            />
          </label>

          <label className="dsh-hmm-wait-mini-row">
            <span>字号 {config.fontSize}</span>
            <input
              type="range"
              min={12}
              max={40}
              step={1}
              value={config.fontSize}
              onChange={(event) => apply('fontSize', Number(event.target.value))}
            />
          </label>

          <label className="dsh-hmm-wait-mini-row">
            <span>抖动</span>
            <button
              type="button"
              className={config.shake ? 'dsh-hmm-wait-mini-toggle on' : 'dsh-hmm-wait-mini-toggle'}
              onClick={() => apply('shake', !config.shake)}
            >
              {config.shake ? '开' : '关'}
            </button>
          </label>

          <div className="dsh-hmm-wait-mini-actions">
            <button type="button" className="dsh-hmm-wait-btn" disabled={sending} onClick={() => void runTest()}>
              {sending ? '发送中…' : sent === 'ok' ? '已发送 ✓' : sent === 'error' ? '失败 ✗' : '测试弹幕'}
            </button>
          </div>

          <div className="dsh-hmm-wait-mini-foot">完整配置：设置 → 插件 → 可配置</div>
        </div>
      ) : null}

      <button
        type="button"
        className="dsh-hmm-wait-mini-btn"
        title={open ? '收起弹幕设置' : '弹幕设置'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={config.enabled ? 'dsh-hmm-wait-mini-gear on' : 'dsh-hmm-wait-mini-gear'}>⚙</span>
      </button>
    </div>
  )
}
