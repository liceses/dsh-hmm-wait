/**
 * dsh-hmm-wait — browser half, runs inside the dsh web GUI.
 *
 * Registers two surfaces through the official slot system:
 *  - `shell.overlay` → the danmaku layer (click-through, frame-wide);
 *  - `plugins.bundle.config`（键 = 本插件的组合包名 `dsh-hmm-wait`）
 *    → 配置面板，画在 0.1.6a2 插件管理页里本插件自己的页面上
 *    （侧栏「插件」→「已安装」→「查看 dsh-hmm-wait」）。
 *
 * 0.1.6a2 统一插件管理后，rc7 时代的 `settings.plugin.item` 槽位已不存在；
 * 注册统一交给内置适配层 `src/vendor/dsh-plugin-config-slot.tsx`（该文件头部
 * 有新旧对照说明；唯一源在 workspace 的 dsh-plugin-config-slot 包里）。
 *
 * The settings snapshot is mirrored into module state so both surfaces react
 * to live changes (applies: live on the host side).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { registerBundleConfigPage } from '../vendor/dsh-plugin-config-slot.tsx'
import { DEFAULT_CONFIG, SETTINGS_NS, type HmmWaitConfig } from '../schema.ts'
import { DanmakuLayer } from './danmaku.tsx'
import { ComboHud } from './combo.tsx'
import { SettingsCard, type HmmWaitCardActions } from './panel.tsx'
import { getConfigSnapshot, publishConfigSnapshot, subscribeConfig } from './state.ts'
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

  // Combo 连击 HUD seat。
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'dsh-hmm-wait-combo',
        order: 120,
      },
      ComboHud,
    ),
  )

  // 配置面板：0.1.6a2 插件管理页的 `plugins.bundle.config`，键 = 本组合包名。
  registerBundleConfigPage(ctx, {
    bundle: 'dsh-hmm-wait',
    summary: '模型思维链出现 hmm / wait / let me 时弹幕提醒',
    source: { getSnapshot: getConfigSnapshot, subscribe: subscribeConfig },
    render: () => <SettingsCard actions={actions} defaultOpen />,
  })
}
