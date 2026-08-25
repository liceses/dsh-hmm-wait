/**
 * dsh-hmm-wait — package styles, injected once per page by the client apply.
 * Theme-neutral: works on both light and dark dsh themes.
 */

export const CSS = `
.dsh-hmm-wait-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  pointer-events: none;
  overflow: hidden;
}
.dsh-hmm-wait-item {
  position: absolute;
  display: inline-block;
  white-space: nowrap;
  line-height: 1.5;
}
.dsh-hmm-wait-item > span {
  display: inline-block;
  border-radius: 10px;
  padding: 2px 12px;
  letter-spacing: 0.02em;
}
@keyframes dsh-hmm-wait-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(calc(var(--dsh-hmm-shake, 4px) * -1)); }
  40% { transform: translateX(var(--dsh-hmm-shake, 4px)); }
  60% { transform: translateX(calc(var(--dsh-hmm-shake, 4px) * -0.6)); }
  80% { transform: translateX(calc(var(--dsh-hmm-shake, 4px) * 0.6)); }
}
.dsh-hmm-wait-shake {
  animation-name: dsh-hmm-wait-shake;
  animation-timing-function: ease-in-out;
  animation-iteration-count: 1;
}

/* ---- settings card（官方折叠卡片风格，dsw 主题变量） ---- */
.dsh-hmm-wait-card {
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  background: var(--dsw-alias-bg-layer-3, rgba(128, 128, 128, 0.06));
  border-radius: 12px;
  list-style: none;
  margin: 0;
  transition: border-color 0.16s, background 0.16s;
}
.dsh-hmm-wait-card:hover { border-color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.5)); }
.dsh-hmm-wait-card-open {
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.1));
  border-color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.5));
}
.dsh-hmm-wait-card-header {
  appearance: none;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  display: flex;
}
.dsh-hmm-wait-card-header:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #4c9aff);
  outline-offset: -2px;
}
.dsh-hmm-wait-card-headtext {
  flex-direction: column;
  flex: 1;
  gap: 4px;
  min-width: 0;
  display: flex;
}
.dsh-hmm-wait-card-name {
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.dsh-hmm-wait-card-desc {
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.8;
}
.dsh-hmm-wait-card-pending {
  white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform, rgba(128, 128, 128, 0.2));
  color: var(--dsw-alias-label-secondary, inherit);
  border-radius: 999px;
  flex: none;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 17px;
}
.dsh-hmm-wait-card-chevron {
  color: var(--dsw-alias-label-tertiary, inherit);
  flex: none;
  transition: transform 0.16s;
  font-size: 14px;
}
.dsh-hmm-wait-card-open .dsh-hmm-wait-card-chevron { transform: rotate(180deg); }
.dsh-hmm-wait-card-body {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  margin: 0 16px;
  padding: 12px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dsh-hmm-wait-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px 16px;
}
.dsh-hmm-wait-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  min-width: 0;
}
.dsh-hmm-wait-field > label {
  color: var(--dsw-alias-label-secondary, inherit);
  opacity: 0.9;
}
.dsh-hmm-wait-field-hint {
  color: var(--dsw-alias-label-tertiary, inherit);
  margin: 0;
  font-size: 11px;
  opacity: 0.7;
}
.dsh-hmm-wait-field input[type='number'],
.dsh-hmm-wait-field input[type='text'],
.dsh-hmm-wait-field select {
  background: var(--dsw-alias-bg-module-platform, rgba(128, 128, 128, 0.09));
  color: inherit;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35));
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 13px;
  min-width: 0;
}
.dsh-hmm-wait-field input[type='color'] {
  width: 100%;
  height: 30px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35));
  border-radius: 8px;
  background: transparent;
  padding: 2px;
  cursor: pointer;
}
.dsh-hmm-wait-check {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-top: 18px;
  display: flex;
}
.dsh-hmm-wait-check > span { opacity: 0.9; }
.dsh-hmm-wait-card-footer {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
  display: flex;
  flex-wrap: wrap;
}
.dsh-hmm-wait-card-failed {
  min-width: 0;
  color: var(--dsw-alias-label-error, #e5484d);
  flex: 1;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}
.dsh-hmm-wait-card-discard,
.dsh-hmm-wait-card-save,
.dsh-hmm-wait-card-test {
  appearance: none;
  font: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 5px 14px;
  font-size: 13px;
  line-height: 1.5;
}
.dsh-hmm-wait-card-discard {
  border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  color: var(--dsw-alias-label-secondary, inherit);
  background: transparent;
}
.dsh-hmm-wait-card-discard:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, inherit);
  border-color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.5));
}
.dsh-hmm-wait-card-test {
  border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  color: var(--dsw-alias-label-secondary, inherit);
  background: transparent;
}
.dsh-hmm-wait-card-save {
  background: var(--dsw-alias-label-primary, #e8e8e8);
  color: var(--dsw-alias-bg-layer-3, #16181d);
}
.dsh-hmm-wait-card-discard:disabled,
.dsh-hmm-wait-card-save:disabled,
.dsh-hmm-wait-card-test:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh-hmm-wait-card-discard:focus-visible,
.dsh-hmm-wait-card-save:focus-visible,
.dsh-hmm-wait-card-test:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #4c9aff);
  outline-offset: 1px;
}

/* ---- combo 连击 HUD（街机风） ---- */
.dsh-hmm-combo {
  position: fixed;
  z-index: 2147483010;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
}
.dsh-hmm-combo-bottom-right { right: 22px; bottom: 26px; }
.dsh-hmm-combo-bottom-left { left: 22px; bottom: 26px; }
.dsh-hmm-combo-top-right { right: 22px; top: 84px; }
.dsh-hmm-combo-top-left { left: 22px; top: 84px; }
.dsh-hmm-combo-hud {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: dsh-hmm-combo-bounce 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
  filter: drop-shadow(0 0 10px currentColor);
}
.dsh-hmm-combo-num {
  display: flex;
  align-items: baseline;
  font-weight: 900;
  line-height: 1;
  font-style: italic;
  letter-spacing: -0.02em;
}
.dsh-hmm-combo-times { font-size: 0.45em; margin-right: 2px; }
.dsh-hmm-combo-count { font-size: 46px; }
.dsh-hmm-combo-trigger {
  font-size: 12px;
  font-weight: 700;
  opacity: 0.9;
  margin-top: 2px;
  padding: 1px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dsh-hmm-combo-max {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.55;
  margin-top: 4px;
  letter-spacing: 0.08em;
}
/* 分级变色 */
.dsh-hmm-combo-tier-1 { color: #f2f2f2; }
.dsh-hmm-combo-tier-2 { color: #ffd866; }
.dsh-hmm-combo-tier-3 { color: #ff9f43; }
.dsh-hmm-combo-tier-4 { color: #ff4d4f; animation-duration: 0.28s; }
/* 里程碑全屏播报 */
.dsh-hmm-combo-milestone {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(28px, 6vw, 56px);
  font-weight: 900;
  font-style: italic;
  color: #ffd866;
  text-shadow: 0 0 24px rgba(255, 216, 102, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6);
  animation: dsh-hmm-combo-flash 2s ease-out forwards;
  pointer-events: none;
}
/* 连击中断 */
.dsh-hmm-combo-broke {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: dsh-hmm-combo-broke 1.2s ease-in forwards;
  color: #9aa4b2;
}
.dsh-hmm-combo-broke-num { font-size: 34px; font-weight: 900; font-style: italic; }
.dsh-hmm-combo-broke-label { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; }
@keyframes dsh-hmm-combo-bounce {
  0% { transform: scale(1); }
  35% { transform: scale(1.35); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
}
@keyframes dsh-hmm-combo-flash {
  0% { opacity: 0; transform: scale(0.6); }
  15% { opacity: 1; transform: scale(1.05); }
  25% { transform: scale(1); }
  75% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.12); }
}
@keyframes dsh-hmm-combo-broke {
  0% { opacity: 0; transform: translateY(8px) scale(0.8); }
  20% { opacity: 1; transform: translateY(0) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-14px) scale(0.9); }
}
`
