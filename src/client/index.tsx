/**
 * dsh-hmm-wait — browser half, runs inside the dsh web GUI.
 *
 * Registers two surfaces through the official slot system:
 *  - `shell.overlay`   → the danmaku layer (click-through, frame-wide);
 *  - `settings.plugin.item` (keyed by the `dsh-hmm-wait` settings namespace)
 *    → the configuration card in the official settings → plugins tab.
 *
 * The settings snapshot is mirrored into module state so both surfaces react
 * to live changes (applies: live on the host side).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { DEFAULT_CONFIG, SETTINGS_NS, type HmmWaitConfig } from '../schema.ts'
import { DanmakuLayer } from './danmaku.tsx'
import { SettingsCard, type HmmWaitCardActions } from './panel.tsx'
import { publishConfigSnapshot } from './state.ts'
import { CSS } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** The frame-wide floating layer: hosts the danmaku overlay. */
    'shell.overlay': { kind: 'list'; scope: 'root'; owner: Record<string, never> }
  }
}

/** Required services (fiber inject waiting — slots and settings must be up). */
export const inject = ['slots', 'settingsScope']

/** 把 settings scope 快照镜像进模块 store（含默认值合并）。 */
function mirror(scope: SettingsScope<HmmWaitConfig>): void {
  const snapshot = scope.getSnapshot()
  publishConfigSnapshot({
    status: snapshot.status,
    config: { ...DEFAULT_CONFIG, ...(snapshot.value ?? {}) },
  })
}

/**
 * Mount the overlay and the settings card.
 * @param ctx - client root context (slots + settingsScope services).
 */
export function apply(ctx: ClientContext): void {
  // Package styles (shake keyframes + card + layer).
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-hmm-wait'
    style.textContent = CSS
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, 'dsh-hmm-wait: styles')

  // Settings mirror: host document → module store (live updates).
  const scope = ctx.settingsScope.bind<HmmWaitConfig>({ namespace: SETTINGS_NS })
  ctx.effect(() => scope.subscribe(() => mirror(scope)), 'dsh-hmm-wait: config mirror')
  mirror(scope)

  const actions: HmmWaitCardActions = {
    async set(field, value) {
      await scope.set(field, value)
    },
  }

  // Danmaku overlay seat.
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'dsh-hmm-wait-overlay',
        order: 100,
      },
      DanmakuLayer,
    ),
  )

  // Settings card (configurable-plugins tab), keyed by our namespace.
  ctx.slots.inject('settings.plugin.item', () =>
    ctx.slots.register(
      {
        name: 'settings.plugin.item',
        key: SETTINGS_NS,
      },
      () => <SettingsCard actions={actions} />,
    ),
  )
}
