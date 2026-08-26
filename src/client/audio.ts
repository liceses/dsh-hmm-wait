/**
 * dsh-hmm-wait — 街机合成音效（Web Audio API，零音频文件）。
 *
 * 三种音效：
 *  - hit      拳击连击"咚"：短促方波 + 快速衰减，音高随连击数微升（越连越燃）
 *  - milestone 里程碑：追加 4 音上行琶音（C5-E5-G5-C6），胜利感
 *  - break    连击中断：下滑锯齿音，失落感
 *
 * 浏览器自动播放策略：AudioContext 需用户交互后恢复（sticky activation）。
 * dsh GUI 正常使用必有交互；若仍被拦截则静默跳过，不影响其他功能。
 */

let sharedCtx: AudioContext | null = null
/** hit 音效最短间隔（ms）：命中频率过高时节流，避免连续咚咚咚。 */
const HIT_MIN_GAP_MS = 120
let lastHitAt = 0

/** 取共享 AudioContext（首次调用创建，suspended 时尝试恢复）。 */
function getSharedContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (AC === undefined) return null
  if (sharedCtx === null) sharedCtx = new AC()
  if (sharedCtx.state === 'suspended') {
    // 用户已交互过（sticky activation）即可恢复；失败则静默跳过。
    void sharedCtx.resume()
  }
  return sharedCtx
}

/** 短促音符：振荡器 + 指数衰减包络。 */
function blip(
  ctx: AudioContext,
  at: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, at)
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.55), at + duration)
  gain.gain.setValueAtTime(volume, at)
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + duration + 0.02)
}

/** 播放连击音效。 */
export function playComboSound(kind: 'hit' | 'milestone' | 'break', combo: number): void {
  const ctx = getSharedContext()
  if (ctx === null || ctx.state !== 'running') return
  const now = ctx.currentTime

  if (kind === 'hit') {
    // 节流：间隔过短（高频命中流）跳过，避免"咚咚咚"噪音。
    const wallNow = Date.now()
    if (wallNow - lastHitAt < HIT_MIN_GAP_MS) return
    lastHitAt = wallNow
    // 拳击感：音高随连击数上升（每级 +7Hz，上限封顶）。
    const base = 150 + Math.min(combo, 30) * 7
    blip(ctx, now, base, 0.1, 0.16, 'square')
    // 紧接一个八度泛音（打击更"爽"）。
    blip(ctx, now + 0.02, base * 2, 0.07, 0.07, 'triangle')
  } else if (kind === 'milestone') {
    // 命中音 + 四音上行琶音（胜利号角）。
    blip(ctx, now, 180, 0.12, 0.18, 'square')
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => {
      blip(ctx, now + 0.05 + i * 0.06, f, 0.12, 0.13, 'triangle')
    })
  } else {
    // 中断：低沉下滑（挫败感）。
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }
}
