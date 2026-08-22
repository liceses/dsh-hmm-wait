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
  background: rgba(8, 12, 20, 0.34);
  border-radius: 10px;
  padding: 2px 12px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
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
`
