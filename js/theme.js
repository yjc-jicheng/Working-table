/* 主题：跟随系统 / 浅色 / 深色。放在 <head> 中同步执行，避免首屏闪烁。 */
window.LabTheme = (function () {
  'use strict';
  const KEY = 'lab-workbench:theme';
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const listeners = [];

  function mode() {
    try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (_) { return 'auto'; }
  }
  function isDark() { const m = mode(); return m === 'dark' || (m === 'auto' && Boolean(media && media.matches)); }
  function apply() {
    const dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#101114' : '#F5F4F0');
    listeners.forEach(function (fn) { try { fn(dark); } catch (_) {} });
  }
  function set(next) {
    try { if (next === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, next); } catch (_) { /* 无痕模式下仅本次生效 */ }
    apply();
  }
  function toggle() { set(isDark() ? 'light' : 'dark'); }
  function onChange(fn) { listeners.push(fn); }

  if (media) {
    const handler = function () { if (mode() === 'auto') apply(); };
    if (media.addEventListener) media.addEventListener('change', handler); else if (media.addListener) media.addListener(handler);
  }
  apply();
  return { mode: mode, isDark: isDark, set: set, toggle: toggle, onChange: onChange };
})();
