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
.dsh-hmm-wait-advanced {
  font-size: 12px;
  opacity: 0.85;
}
.dsh-hmm-wait-advanced summary {
  cursor: pointer;
  opacity: 0.7;
  user-select: none;
  padding: 2px 0;
}
.dsh-hmm-wait-advanced[open] summary { margin-bottom: 10px; }

/* ---- 页面迷你配置卡片 ---- */
.dsh-hmm-wait-mini {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483010;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.dsh-hmm-wait-mini-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(128, 128, 128, 0.45);
  background: rgba(16, 22, 34, 0.72);
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}
.dsh-hmm-wait-mini-btn:hover { transform: scale(1.08); }
.dsh-hmm-wait-mini-gear {
  font-size: 20px;
  line-height: 1;
  opacity: 0.55;
  transition: opacity 0.2s ease, transform 0.3s ease;
}
.dsh-hmm-wait-mini-gear.on { opacity: 1; }
.dsh-hmm-wait-mini-btn[aria-expanded='true'] .dsh-hmm-wait-mini-gear { transform: rotate(60deg); }
.dsh-hmm-wait-mini-card {
  background: rgba(12, 16, 26, 0.92);
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 12px;
  padding: 12px 14px;
  width: 236px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.45);
  font-size: 13px;
  color: inherit;
  backdrop-filter: blur(6px);
}
.dsh-hmm-wait-mini-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dsh-hmm-wait-mini-title { font-weight: 600; }
.dsh-hmm-wait-mini-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #666;
}
.dsh-hmm-wait-mini-dot.on { background: #4caf7d; box-shadow: 0 0 6px rgba(76, 175, 125, 0.8); }
.dsh-hmm-wait-mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.dsh-hmm-wait-mini-row > span { opacity: 0.75; white-space: nowrap; }
.dsh-hmm-wait-mini-row select {
  background: rgba(128, 128, 128, 0.14);
  color: inherit;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px;
}
.dsh-hmm-wait-mini-row input[type='range'] { flex: 1; min-width: 0; }
.dsh-hmm-wait-mini-toggle {
  background: rgba(128, 128, 128, 0.14);
  color: inherit;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  min-width: 64px;
}
.dsh-hmm-wait-mini-toggle.on {
  border-color: rgba(76, 175, 125, 0.6);
  color: #4caf7d;
}
.dsh-hmm-wait-mini-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.dsh-hmm-wait-mini-foot {
  font-size: 11px;
  opacity: 0.5;
  text-align: right;
}
`
