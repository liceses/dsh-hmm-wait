/**
 * dsh-hmm-wait — the danmaku overlay, rendered into the shell.overlay seat.
 *
 * Every item flies across the viewport with the Web Animations API (exact
 * distance/speed control per direction), wrapped by an optional shake burst
 * on appearance. Click-through, never blocks the GUI. All visual parameters
 * come from the mirrored settings snapshot.
 */

import { useEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties, type ReactElement } from 'react'
import type { DanmakuDirection, HmmWaitConfig } from '../schema.ts'
import { subscribeDanmaku as subscribeSse } from './api.ts'
import {
  clearDanmaku,
  getDanmakuSnapshot,
  getConfigSnapshot,
  pushDanmaku,
  removeDanmaku,
  subscribeConfig,
  subscribeDanmakuStore,
  type DanmakuItem,
} from './state.ts'

/** 顶部/底部区域各用的轨道数。 */
const TRACKS_PER_ZONE = 3

/** 文本宽度估算（动画前测量不到的兜底）：全角 1 倍字宽，其余 0.55 倍。 */
function estimateWidth(text: string, fontSize: number): number {
  let width = 0
  for (const ch of text) {
    width += ch.charCodeAt(0) > 0x2e80 ? fontSize : fontSize * 0.55
  }
  return width
}

/** 计算一条弹幕的起止 transform 与时长（ms）。 */
function flight(
  direction: DanmakuDirection,
  speed: number,
  width: number,
  height: number,
  viewport: { w: number; h: number },
): { from: string; to: string; duration: number } {
  const gap = 48
  switch (direction) {
    case 'right-to-left': {
      const distance = viewport.w + width + gap
      return { from: 'translateX(100vw)', to: `translateX(calc(-100% - ${gap}px))`, duration: (distance / speed) * 1000 }
    }
    case 'left-to-right': {
      const distance = viewport.w + width + gap
      return { from: `translateX(calc(-100% - ${gap}px))`, to: 'translateX(100vw)', duration: (distance / speed) * 1000 }
    }
    case 'top-to-bottom': {
      const distance = viewport.h + height + gap * 2
      return { from: 'translateY(-150%)', to: `translateY(calc(100vh + ${gap}px))`, duration: (distance / speed) * 1000 }
    }
    case 'bottom-to-top': {
      const distance = viewport.h + height + gap * 2
      return { from: `translateY(calc(100vh + ${gap}px))`, to: 'translateY(-150%)', duration: (distance / speed) * 1000 }
    }
  }
}

/** 单条弹幕：定位 + 飞行动画 + 抖动。 */
function DanmakuView({ item, config }: { item: DanmakuItem; config: HmmWaitConfig }): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)
  const configRef = useRef(config)
  configRef.current = config

  // 轨道与位置（由 id 派生，稳定）。
  const placement = useMemo(() => {
    const zone = config.zone
    const track = item.id % TRACKS_PER_ZONE
    const lineHeight = config.fontSize * 1.7
    const pad = 10
    let y: number
    if (zone === 'top') {
      y = pad + track * lineHeight
    } else if (zone === 'bottom') {
      y = window.innerHeight - pad - (TRACKS_PER_ZONE - track) * lineHeight
    } else {
      // full：0..1 顶部，2..3 底部。
      const upper = track < 2
      const t = upper ? track : track - 2
      y = upper ? pad + t * lineHeight : window.innerHeight - pad - (TRACKS_PER_ZONE - t) * lineHeight
    }
    const horizontal = config.direction === 'right-to-left' || config.direction === 'left-to-right'
    return { y, horizontal }
  }, [config.zone, config.direction, config.fontSize, item.id])

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    const rect = el.getBoundingClientRect()
    const width = rect.width > 0 ? rect.width : estimateWidth(item.text, configRef.current.fontSize)
    const height = rect.height > 0 ? rect.height : configRef.current.fontSize * 1.6
    const f = flight(configRef.current.direction, configRef.current.speed, width, height, {
      w: window.innerWidth,
      h: window.innerHeight,
    })
    const animation = el.animate([{ transform: f.from }, { transform: f.to }], {
      duration: f.duration,
      easing: 'linear',
      fill: 'forwards',
    })
    animation.onfinish = () => {
      if (!doneRef.current) {
        doneRef.current = true
        removeDanmaku(item.id)
      }
    }
    return () => {
      animation.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  const style: CSSProperties = {
    position: 'absolute',
    left: placement.horizontal ? 0 : '50%',
    top: placement.horizontal ? placement.y : undefined,
    opacity: config.opacity,
    zIndex: 10,
    willChange: 'transform',
    transform: placement.horizontal ? undefined : 'translateX(-50%)',
  }

  // 抖动时长：随速度稍作缩放（快弹幕抖动短一些）。
  const shakeSeconds = Math.min(0.7, Math.max(0.25, 500 / Math.max(300, config.speed)))

  return (
    <div ref={ref} className="dsh-hmm-wait-item" style={style}>
      <span
        className={config.shake ? 'dsh-hmm-wait-shake' : undefined}
        style={{
          fontSize: config.fontSize,
          color: config.color,
          animationDuration: `${shakeSeconds}s`,
          ['--dsh-hmm-shake' as string]: `${config.shakeIntensity}px`,
        }}
      >
        {item.text}
      </span>
    </div>
  )
}

/** 弹幕层根组件：订阅 SSE + 渲染存活弹幕。 */
export function DanmakuLayer(): ReactElement {
  const items = useSyncExternalStore(subscribeDanmakuStore, getDanmakuSnapshot)
  const { status, config } = useSyncExternalStore(subscribeConfig, getConfigSnapshot)
  const enabledRef = useRef(config.enabled)
  const configRef = useRef(config)
  enabledRef.current = config.enabled
  configRef.current = config

  // SSE 订阅（跟随 enabled 开关）。
  useEffect(() => {
    if (status !== 'ready' && status !== 'unavailable') return
    if (!enabledRef.current) return
    const unsubscribe = subscribeSse((event) => {
      if (!enabledRef.current) return
      const cfg = configRef.current
      const max = Math.max(1, cfg.maxOnScreen)
      pushDanmaku(
        {
          id: event.id,
          trigger: event.trigger,
          text: event.text,
          ts: event.ts,
          ...(event.sessionId !== undefined ? { sessionId: event.sessionId } : {}),
        },
        max,
      )
    })
    return () => {
      unsubscribe()
      clearDanmaku()
    }
  }, [status])

  // enabled 关闭时清屏。
  useEffect(() => {
    if (!config.enabled) clearDanmaku()
  }, [config.enabled])

  return (
    <div className="dsh-hmm-wait-layer">
      {items.map((item) => (
        <DanmakuView key={item.id} item={item} config={config} />
      ))}
    </div>
  )
}
