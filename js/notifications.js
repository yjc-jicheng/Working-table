/* In-page scheduling plus a service-worker bridge for desktop notifications. */
(function () {
  'use strict';
  let registration = null;
  const PREF_KEY = 'lab-workbench:notification-pref:v1';
  function prefs() {
    try { return Object.assign({ evening_report: true, morning_tasks: true, overdue_tasks: true }, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (_) { return { evening_report: true, morning_tasks: true, overdue_tasks: true }; }
  }
  function savePrefs(next) { try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch (_) {} }
  function notify(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const options = { body: body, tag: tag || 'lab-workbench', icon: '/favicon.svg', renotify: true };
    if (registration && registration.showNotification) registration.showNotification(title, options);
    else new Notification(title, options);
  }
  async function enable() {
    if (!('Notification' in window)) throw new Error('当前浏览器不支持通知');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('你拒绝了通知权限');
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        if (registration.pushManager && window.LabStore && window.LabStore.isOnline()) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) await window.LabStore.saveNotificationSubscription(subscription.toJSON());
        }
      } catch (err) { console.warn('Service worker 注册失败：', err); }
    }
    const next = prefs(); next.enabled = true; savePrefs(next);
    if (window.LabStore && window.LabStore.isOnline()) window.LabStore.setNotificationPreferences(next).catch(function () {});
    notify('课题组工作台通知已开启', '每天晚上提醒日报，早上提醒任务；延期任务会在工作台打开时提示。', 'lab-enabled');
    return true;
  }
  /* 与日报的 date 字段同为 YYYY-MM-DD，否则无法判断「今天是否已上报」。 */
  function todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function status() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.permission === 'granted' && prefs().enabled ? 'enabled' : 'off';
  }
  function setPref(key, value) {
    const next = prefs(); next[key] = Boolean(value); savePrefs(next);
    if (key !== 'enabled' && window.LabStore && window.LabStore.isOnline()) { const patch = {}; patch[key] = next[key]; window.LabStore.setNotificationPreferences(patch).catch(function () {}); }
    return next;
  }
  function disable() { return setPref('enabled', false); }
  function check() {
    if (!window.LabStore || !window.LabStore.isAuthenticated()) return;
    const p = prefs(); if (!p.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date(); const hhmm = now.getHours() * 60 + now.getMinutes(); const key = todayKey();
    const logs = window.LabStore.list('logs'); const me = window.LabStore.currentUser();
    const mine = me ? logs.some(function (log) { return log.author_id === me.id && log.date === key; }) : false;
    const mark = function (name) { const k = 'lab-workbench:notified:' + name + ':' + key; try { if (localStorage.getItem(k)) return false; localStorage.setItem(k, '1'); return true; } catch (_) { return true; } };
    if (p.evening_report !== false && hhmm >= 20 * 60 && !mine && mark('evening')) notify('该上报今日进展了', '填写今天做了什么，AI 会帮你整理日报。', 'daily-report-' + key);
    if (p.morning_tasks !== false && hhmm >= 8 * 60 && hhmm < 10 * 60 && mark('morning')) {
      const tasks = window.LabStore.list('tasks').filter(function (t) { return t.status !== 'done' && (!me || t.assignee_id === me.id); });
      if (tasks.length) notify('早安，今天有 ' + tasks.length + ' 项任务', tasks.slice(0, 3).map(function (t) { return t.title; }).join('；'), 'morning-tasks-' + key);
    }
    if (p.overdue_tasks !== false && mark('overdue')) {
      const overdue = window.LabStore.list('tasks').filter(function (t) { return t.status !== 'done' && t.due_date && new Date(t.due_date + 'T23:59:59') < now && (!me || t.assignee_id === me.id); });
      if (overdue.length) notify('有延期任务需要推进', overdue.slice(0, 3).map(function (t) { return t.title; }).join('；'), 'overdue-tasks-' + key);
    }
  }
  window.LabNotifications = { enable: enable, disable: disable, status: status, setPref: setPref, check: check, prefs: prefs, savePrefs: savePrefs, notify: notify };
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').then(function (reg) { registration = reg; }).catch(function () {});
  setInterval(check, 60000);
})();
