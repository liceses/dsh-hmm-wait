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

/* ---- settings card ---- */
.dsh-hmm-wait-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  min-width: 0;
}
.dsh-hmm-wait-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.dsh-hmm-wait-card-sub {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 3px;
}
.dsh-hmm-wait-card-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.dsh-hmm-wait-btn {
  background: rgba(80, 140, 255, 0.14);
  color: inherit;
  border: 1px solid rgba(80, 140, 255, 0.4);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.dsh-hmm-wait-btn:disabled { opacity: 0.5; cursor: default; }
.dsh-hmm-wait-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-hmm-wait-switch-on { color: #4caf7d; font-weight: 600; }
.dsh-hmm-wait-switch-off { color: inherit; opacity: 0.6; }
.dsh-hmm-wait-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px 16px;
}
.dsh-hmm-wait-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  min-width: 0;
}
.dsh-hmm-wait-field > span { opacity: 0.7; }
.dsh-hmm-wait-field input[type='number'],
.dsh-hmm-wait-field input[type='text'],
.dsh-hmm-wait-field select {
  background: rgba(128, 128, 128, 0.09);
  color: inherit;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 13px;
  min-width: 0;
}
.dsh-hmm-wait-field input[type='color'] {
  width: 100%;
  height: 30px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  background: transparent;
  padding: 2px;
  cursor: pointer;
}
.dsh-hmm-wait-field input[type='range'] { width: 100%; }
.dsh-hmm-wait-check {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-top: 18px;
}
.dsh-hmm-wait-check > span { opacity: 0.85; }
.dsh-hmm-wait-card-hint {
  font-size: 12px;
  opacity: 0.5;
}
`
