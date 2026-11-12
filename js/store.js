/* Data/auth adapter.
 * file:// keeps the original demo mode; an HTTP(S) page uses the server API.
 */
window.LabStore = (function () {
  'use strict';
  const KEY = 'lab-workbench:v1';
  const ONLINE = window.location.protocol !== 'file:' && !/[?&]demo=1(?:&|$)/.test(window.location.search);
  const API_BASE = window.LabConfig && window.LabConfig.apiBase ? window.LabConfig.apiBase.replace(/\/$/, '') : '';
  const COLLECTIONS = ['members', 'projects', 'tasks', 'papers', 'events', 'analyses', 'experiments', 'logs', 'daily_logs', 'weekly_reports', 'reviews'];
  let state = null;
  let readyPromise = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function emptyData() { return { members: [], projects: [], tasks: [], papers: [], events: [], analyses: [], experiments: [], logs: [], daily_logs: [], weekly_reports: [], reviews: [] }; }
  function newId(collection) { return collection.slice(0, 2) + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function freshDemo() {
    return {
      currentUserId: 'u2', authenticated: true, workspace: null, permissions: { isPI: false },
      aiMode: 'mock', aiConfig: { provider: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', chatPath: '/chat/completions', model: 'deepseek-chat', apiKey: '' },
      data: clone(window.LabSeed)
    };
  }
  function freshOnline() {
    return { currentUserId: null, authenticated: false, workspace: null, permissions: { isPI: false }, aiMode: 'http', aiConfig: { provider: '国模', baseUrl: '', chatPath: '/chat/completions', model: '', apiKey: '', configured: false }, data: emptyData() };
  }
  function saveDemo() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* Private browsing can remain memory-only. */ }
  }
  function setData(data) {
    state.data = Object.assign(emptyData(), data || {});
    if (!Array.isArray(state.data.daily_logs)) state.data.daily_logs = Array.isArray(state.data.logs) ? state.data.logs : [];
    state.data.logs = state.data.daily_logs;
    for (const c of COLLECTIONS) if (!Array.isArray(state.data[c])) state.data[c] = [];
    state.data.logs = state.data.daily_logs;
  }
  async function request(path, options) {
    const opts = Object.assign({ credentials: 'include', headers: {} }, options || {});
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers);
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(API_BASE + path, opts);
    const out = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      const err = new Error(out.message || ('请求失败（' + res.status + '）'));
      err.status = res.status; err.code = out.error;
      throw err;
    }
    return out;
  }
  async function loadOnline() {
    state = freshOnline();
    try {
      const me = await request('/api/auth/me');
      state.authenticated = true; state.currentUserId = me.user && me.user.id; state.workspace = me.workspace || null;
      const boot = await request('/api/bootstrap');
      state.currentUserId = boot.currentUser && boot.currentUser.id;
      state.workspace = boot.workspace || state.workspace;
      state.permissions = boot.permissions || { isPI: false };
      state.aiConfig = Object.assign(state.aiConfig, boot.settings && boot.settings.ai || {});
      setData(boot.data);
    } catch (err) {
      state.authenticated = false; state.currentUserId = null; setData(emptyData());
      if (err.status && err.status !== 401) console.warn('工作台加载失败：', err.message);
    }
    return state;
  }
  function loadDemo() {
    let loaded = null;
    try { loaded = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { loaded = null; }
    state = loaded && loaded.data && Array.isArray(loaded.data.members) ? loaded : freshDemo();
    if (!state.aiConfig) state.aiConfig = freshDemo().aiConfig;
    setData(state.data);
    saveDemo();
    return Promise.resolve(state);
  }
  function init(force) {
    if (force) readyPromise = null;
    if (!readyPromise) readyPromise = ONLINE ? loadOnline() : loadDemo();
    return readyPromise;
  }
  function data() { return state.data; }
  function getState() { return state; }
  function adapter() { return ONLINE ? 'http' : 'demo'; }
  function isOnline() { return ONLINE; }
  function isAuthenticated() { return Boolean(state && state.authenticated); }
  function workspace() { return state && state.workspace; }
  function can(permission) {
    if (!ONLINE) return true;
    if (permission === 'manage') return Boolean(state.permissions && state.permissions.isPI);
    return isAuthenticated();
  }
  function members() { return state.data.members; }
  function currentUser() { return state.data.members.find(m => m.id === state.currentUserId) || null; }
  function member(id) { return state.data.members.find(m => m.id === id) || null; }
  function switchUser(id) { if (!ONLINE) { state.currentUserId = id; saveDemo(); } }
  function collectionName(collection) { return collection === 'logs' ? 'daily_logs' : collection; }
  function list(collection) { return state.data[collection] || []; }
  function find(collection, id) { return (state.data[collection] || []).find(x => x.id === id) || null; }
  function create(collection, item) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    const row = Object.assign({}, item, { id: item && item.id || newId(collection) });
    if (!ONLINE) { state.data[localCollection].unshift(row); saveDemo(); return row; }
    state.data[localCollection].unshift(row);
    request('/api/' + collectionName(collection), { method: 'POST', body: item }).then(function (out) {
      const remote = out.item;
      const index = state.data[localCollection].findIndex(x => x.id === row.id);
      if (index >= 0 && remote) state.data[localCollection][index] = remote;
    }).catch(function (err) { state.data[localCollection] = state.data[localCollection].filter(x => x.id !== row.id); console.warn(err); });
    return row;
  }
  async function createAsync(collection, item) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    if (!ONLINE) return create(collection, item);
    const out = await request('/api/' + collectionName(collection), { method: 'POST', body: item });
    if (out.item) state.data[localCollection].unshift(out.item);
    return out.item;
  }
  function update(collection, id, patch) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    const row = find(localCollection, id);
    if (!row) return null;
    Object.assign(row, patch);
    if (!ONLINE) { saveDemo(); return row; }
    request('/api/' + collectionName(collection) + '/' + encodeURIComponent(id), { method: 'PATCH', body: patch }).then(function (out) { if (out.item) Object.assign(row, out.item); }).catch(function (err) { console.warn(err); });
    return row;
  }
  async function updateAsync(collection, id, patch) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    const row = find(localCollection, id);
    if (!row) return null;
    if (!ONLINE) return update(collection, id, patch);
    const out = await request('/api/' + collectionName(collection) + '/' + encodeURIComponent(id), { method: 'PATCH', body: patch });
    if (out.item) Object.assign(row, out.item);
    return row;
  }
  function remove(collection, id) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    const before = state.data[localCollection].length;
    state.data[localCollection] = state.data[localCollection].filter(x => x.id !== id);
    if (!ONLINE) { saveDemo(); return state.data[localCollection].length < before; }
    request('/api/' + collectionName(collection) + '/' + encodeURIComponent(id), { method: 'DELETE' }).catch(function (err) { console.warn(err); });
    return state.data[localCollection].length < before;
  }
  async function removeAsync(collection, id) {
    const localCollection = collection === 'daily_logs' ? 'logs' : collection;
    if (!ONLINE) return remove(collection, id);
    await request('/api/' + collectionName(collection) + '/' + encodeURIComponent(id), { method: 'DELETE' });
    const before = state.data[localCollection].length;
    state.data[localCollection] = state.data[localCollection].filter(x => x.id !== id);
    return state.data[localCollection].length < before;
  }
  function aiMode() { return state.aiMode; }
  function setAiMode(mode) { state.aiMode = ONLINE ? 'http' : mode; if (!ONLINE) saveDemo(); }
  function aiConfig() { return state.aiConfig; }
  function setAiConfig(patch) {
    const safe = Object.assign({}, patch); delete safe.apiKey;
    Object.assign(state.aiConfig, safe);
    if (!ONLINE) { saveDemo(); return Promise.resolve(state.aiConfig); }
    return request('/api/settings/ai', { method: 'PATCH', body: safe }).then(function (out) { if (out.ai) Object.assign(state.aiConfig, out.ai); return state.aiConfig; });
  }
  function save() { if (!ONLINE) saveDemo(); }
  function reset() { if (!ONLINE) { state = freshDemo(); setData(state.data); saveDemo(); } }
  async function signIn(credentials) { if (!ONLINE) return state; await request('/api/auth/login', { method: 'POST', body: credentials }); return init(true); }
  async function register(credentials) { if (!ONLINE) return state; await request('/api/auth/register', { method: 'POST', body: credentials }); return init(true); }
  async function signOut() { if (ONLINE) await request('/api/auth/logout', { method: 'POST' }); state = freshOnline(); readyPromise = Promise.resolve(state); return state; }
  async function applyDailySummary(payload, result) {
    if (!ONLINE) return null;
    const out = await request('/api/ai/daily-summary/apply', { method: 'POST', body: { payload: payload, result: result, idempotencyKey: 'daily-' + payload.date + '-' + payload.member.id + '-' + String(payload.content).slice(0, 32) } });
    await loadOnline();
    return out;
  }
  async function weeklySummary(payload) { return request('/api/ai/weekly-summary', { method: 'POST', body: payload || {} }); }
  async function refresh() { if (ONLINE) await loadOnline(); return state; }
  async function uploadAttachment(experimentId, file) {
    if (!ONLINE) throw new Error('附件上传需要联网工作台');
    const res = await fetch(API_BASE + '/api/experiments/' + encodeURIComponent(experimentId) + '/attachments', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
      body: file
    });
    const out = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(out.message || ('上传失败（' + res.status + '）'));
    return out.attachment;
  }
  async function downloadAttachment(experimentId, attachmentId) {
    const res = await fetch(API_BASE + '/api/experiments/' + encodeURIComponent(experimentId) + '/attachments/' + encodeURIComponent(attachmentId), { credentials: 'include' });
    if (!res.ok) {
      const out = await res.json().catch(function () { return {}; });
      throw new Error(out.message || ('下载失败（' + res.status + '）'));
    }
    return res.blob();
  }
  async function removeAttachment(experimentId, attachmentId) {
    return request('/api/experiments/' + encodeURIComponent(experimentId) + '/attachments/' + encodeURIComponent(attachmentId), { method: 'DELETE' });
  }
  async function saveNotificationSubscription(subscription) { return request('/api/notifications/subscriptions', { method: 'POST', body: { subscription: subscription } }); }
  async function notificationPreferences() { return request('/api/notifications/preferences'); }
  async function setNotificationPreferences(preferences) { return request('/api/notifications/preferences', { method: 'PATCH', body: preferences }); }

  return {
    init, data, getState, adapter, isOnline, isAuthenticated, workspace, can, members, member, currentUser, switchUser,
    list, find, create, update, updateAsync, remove, removeAsync, aiMode, setAiMode, aiConfig, setAiConfig, reset, save,
    signIn, register, signOut, applyDailySummary, weeklySummary, createAsync, refresh, uploadAttachment, downloadAttachment, removeAttachment, saveNotificationSubscription, notificationPreferences, setNotificationPreferences,
    request
  };
})();
