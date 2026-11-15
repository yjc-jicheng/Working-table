/* 课题组工作台主界面 */
(function () {
  'use strict';
  const S = window.LabStore;
  const Charts = window.LabCharts;
  const Theme = window.LabTheme;
  const Branding = window.LabBranding;
  function boot() {
    if (S.isOnline() && !S.isAuthenticated()) {
      document.body.classList.add('auth-mode');
      if (window.LabAuthUI) window.LabAuthUI.render();
      return;
    }

  /* ---------- 认证适配器 ---------- */
  const AuthAdapter = {
    current: function () { return S.currentUser(); },
    members: function () { return S.members(); },
    switchTo: function (id) { S.switchUser(id); },
    signOut: function () { return S.signOut(); },
  };

  /* ---------- 图标 ---------- */
  const ICONS = {
    home: '<path d="M3 10.6 12 3l9 7.6V21H14v-7h-4v7H3z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
    book: '<path d="M12 6c-2-2-5-2-8-1v14c3-1 6-1 8 1 2-2 5-2 8-1V5c-3-1-6-1-8 1z"/><path d="M12 6v14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5a3 3 0 0 1 0 6M18 14c2 1 3 2.8 3 6"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.1A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.9L14 9V3"/><path d="M8 15h8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    file: '<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/>'
  };
  function icon(n, size) {
    return '<svg class="ni-icon" width="' + (size || 17) + '" height="' + (size || 17) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || ICONS.home) + '</svg>';
  }
  function iconBtn(ic, label, attrs, extraClass) {
    return '<button type="button" class="icon-btn sm ' + (extraClass || '') + '" title="' + label + '" aria-label="' + label + '" ' + attrs + '>' + icon(ic, 15) + '</button>';
  }

  /* ---------- 通用工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function iso(d) {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function today() { return iso(new Date()); }
  function shift(n) { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmt(s) { if (!s) return '—'; const p = String(s).slice(0, 10).split('-'); return p.length < 3 ? s : (+p[1]) + '月' + (+p[2]) + '日'; }
  function diffDays(s) { if (!s) return 999; return Math.round((new Date(String(s).slice(0, 10) + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000); }
  function dueLabel(s) {
    if (!s) return '未设截止';
    const d = diffDays(s);
    if (d === 0) return '今天到期';
    if (d === 1) return '明天到期';
    return d > 0 ? d + ' 天后到期' : '已逾期 ' + (-d) + ' 天';
  }
  function isOverdue(t) { return t.status !== 'done' && Boolean(t.due_date) && diffDays(t.due_date) < 0; }
  function member(id) { return S.member(id) || { name: '未指派', color: '#9AA0AC' }; }
  function project(id) { return S.find('projects', id); }
  function projectTitle(id) { const p = project(id); return p ? p.title : '未关联项目'; }
  function avatar(m, size) {
    const sz = size || 26;
    return '<span class="avatar" style="width:' + sz + 'px;height:' + sz + 'px;flex:0 0 ' + sz + 'px;font-size:' + Math.max(10, Math.round(sz * 0.42)) + 'px;background:' + esc(m.color || '#9AA0AC') + '">' + esc(String(m.name || '?').slice(0, 1)) + '</span>';
  }
  function val(id) { const e = document.getElementById(id); return e ? e.value : ''; }
  function statusText(s) { return { todo: '待开始', doing: '进行中', done: '已完成', delayed: '已延期' }[s] || s; }
  function statusBadge(s) {
    const map = { todo: 'b-gray', doing: 'b-blue', done: 'b-green', delayed: 'b-red' };
    return '<span class="badge ' + (map[s] || 'b-gray') + '">' + statusText(s) + '</span>';
  }
  function priorityBadge(p) {
    const map = { '高': 'b-red', '中': 'b-amber', '低': 'b-gray' };
    return '<span class="badge ' + (map[p] || 'b-gray') + '">' + esc(p || '中') + '优先</span>';
  }
  const PRIORITY_RANK = { '高': 0, '中': 1, '低': 2 };
  function taskOrder(a, b) {
    const pa = PRIORITY_RANK[a.priority] == null ? 1 : PRIORITY_RANK[a.priority], pb = PRIORITY_RANK[b.priority] == null ? 1 : PRIORITY_RANK[b.priority];
    return pa - pb || String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'));
  }
  const EVENT_TONE = { '组会': 'purple', '实验': 'blue', '写作': 'amber', '文献': 'cyan', '答辩': 'red' };
  function eventTone(type) { return EVENT_TONE[type] || 'gray'; }
  /* 只放行 http(s) 链接；裸 DOI 自动补全，其余一律不渲染为链接 */
  function safeUrl(u) {
    const s = String(u || '').trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (/^10\.\d{4,9}\/\S+$/.test(s)) return 'https://doi.org/' + s;
    return '';
  }
  /* 与服务端 canWriteRow 保持一致，用来隐藏当前成员无权使用的操作 */
  function canEdit(collection, row) {
    if (!S.isOnline() || S.can('manage')) return true;
    const me = S.currentUser();
    if (!me || !row) return false;
    if (collection === 'logs') return row.author_id === me.id;
    if (collection === 'tasks') return row.assignee_id === me.id || row.created_by === me.id;
    if (collection === 'projects') return row.lead_id === me.id || row.created_by === me.id;
    return row.created_by === me.id;
  }
  function toast(msg, type) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.innerHTML = (type === 'error' ? icon('alert', 15) : type === 'success' ? icon('ok', 15) : '') + '<span></span>';
    el.lastChild.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 220); }, type === 'error' ? 4200 : 2600);
  }
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      const root = document.getElementById('confirm-root');
      root.innerHTML = '<div class="modal-mask" data-confirm="cancel"><div class="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">' +
        '<div class="modal-body confirm-body"><span class="confirm-icon ' + (opts.danger ? 'danger' : '') + '">' + icon(opts.danger ? 'alert' : 'ok', 20) + '</span>' +
        '<div><h3 id="confirm-title">' + esc(opts.title) + '</h3>' + (opts.body ? '<p>' + esc(opts.body) + '</p>' : '') + '</div></div>' +
        '<div class="modal-foot"><button type="button" class="btn" data-confirm="cancel">取消</button>' +
        '<button type="button" class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-confirm="ok">' + esc(opts.okText || '确定') + '</button></div></div></div>';
      function done(result) { root.innerHTML = ''; root.onclick = null; document.removeEventListener('keydown', onKey, true); resolve(result); }
      function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); done(false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true); }
      }
      root.onclick = function (e) {
        const el = e.target.closest('[data-confirm]');
        if (!el || (el.classList.contains('modal-mask') && e.target !== el)) return;
        done(el.dataset.confirm === 'ok');
      };
      document.addEventListener('keydown', onKey, true);
      root.querySelector('[data-confirm="ok"]').focus();
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    // 局域网 http 部署不是安全上下文，退回到 execCommand
    return new Promise(function (resolve, reject) {
      const box = document.createElement('textarea');
      box.value = text; box.setAttribute('readonly', ''); box.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(box); box.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      box.remove();
      if (ok) resolve(); else reject(new Error('浏览器不支持自动复制，请手动选择文本'));
    });
  }
  function downloadText(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })), link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- 数据派生 ---------- */
  function lastNDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(shift(-i));
    return out;
  }
  function logsByDay(n) {
    const days = lastNDays(n), logs = S.list('logs');
    return days.map(function (d) { return logs.filter(function (l) { return l.date === d; }); });
  }
  function startOfWeek(offset) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const wd = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - wd + offset * 7);
    return d;
  }
  function weekLabel(offset) { const d = startOfWeek(offset); return (d.getMonth() + 1) + '/' + d.getDate(); }
  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return Math.ceil(((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
  }
  function weekPeriodLabel() {
    const start = startOfWeek(0);
    return start.getFullYear() + ' 年第 ' + isoWeek(start) + ' 周（' + fmt(iso(start)) + ' — ' + fmt(iso(addDays(start, 6))) + '）';
  }
  function recentLogs() {
    return S.list('logs').slice().sort(function (a, b) { return String(b.created_at || b.date || '').localeCompare(String(a.created_at || a.date || '')); });
  }

  /* ---------- 导航 ---------- */
  const NAV = [
    { group: '工作区', items: [
      { id: 'overview', label: '总览', icon: 'home' },
      { id: 'daily', label: '每日上报', icon: 'edit' }
    ] },
    { group: '研究管理', items: [
      { id: 'projects', label: '论文项目管理', icon: 'folder' },
      { id: 'tasks', label: '科研任务看板', icon: 'check' },
      { id: 'experiments', label: '实验记录', icon: 'flask' },
      { id: 'papers', label: '文献管理', icon: 'book' },
      { id: 'calendar', label: '科研日历', icon: 'calendar' }
    ] },
    { group: '数据与复盘', items: [
      { id: 'analyses', label: '数据分析', icon: 'chart' },
      { id: 'reviews', label: '可视化复盘', icon: 'pie' }
    ] },
    { group: '课题组', items: [
      { id: 'members', label: '成员与权限', icon: 'users' },
      { id: 'settings', label: '设置', icon: 'settings' }
    ] }
  ];
  const TITLES = {
    overview: ['工作区', '总览'], daily: ['工作区', '每日上报'],
    projects: ['研究管理', '论文项目管理'], tasks: ['研究管理', '科研任务看板'],
    experiments: ['研究管理', '实验记录'],
    papers: ['研究管理', '文献管理'], calendar: ['研究管理', '科研日历'],
    analyses: ['数据与复盘', '数据分析'], reviews: ['数据与复盘', '可视化复盘'],
    members: ['课题组', '成员与权限'], settings: ['课题组', '设置']
  };
  function viewFromHash() {
    const v = (location.hash || '').replace('#/', '');
    return TITLES[v] ? v : 'overview';
  }

  const state = {
    view: viewFromHash(),
    renderedView: null,
    flashId: null,
    calOffset: 0,
    calMode: 'week',
    projectFilter: '全部',
    taskQuery: '',
    taskProject: '',
    taskAssignee: '',
    paperFilter: '全部',
    paperQuery: '',
    paperSort: 'recent',
    experimentQuery: '',
    logScope: 'all',
    logLimit: 8,
    reportForm: null,
    aiDraft: null,
    aiLoading: false,
    savingLog: false,
    weeklyDraft: null,
    weeklyLoading: false
  };

  function navCount(id) {
    if (id === 'tasks') return S.list('tasks').filter(function (t) { return t.status !== 'done'; }).length;
    if (id === 'projects') return S.list('projects').length;
    if (id === 'papers') return S.list('papers').length;
    if (id === 'experiments') return S.list('experiments').length;
    if (id === 'calendar') return S.list('events').filter(function (e) { return diffDays(e.date) >= 0 && diffDays(e.date) <= 7; }).length;
    if (id === 'daily') return S.list('logs').filter(function (l) { return l.date === today(); }).length;
    return null;
  }
  function renderNav() {
    document.getElementById('nav').innerHTML = NAV.map(function (g) {
      return '<div class="nav-group"><div class="nav-group-title">' + g.group + '</div>' +
        g.items.map(function (it) {
          const c = navCount(it.id), active = state.view === it.id;
          return '<button type="button" class="nav-item ' + (active ? 'active' : '') + '" ' + (active ? 'aria-current="page" ' : '') + 'data-action="nav" data-view="' + it.id + '">' + icon(it.icon) + '<span>' + it.label + '</span>' +
            (c ? '<span class="ni-count">' + c + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    }).join('');
  }
  function renderMemberSwitch() {
    const me = AuthAdapter.current();
    if (!me) { document.getElementById('member-switch').innerHTML = ''; return; }
    const online = S.isOnline();
    document.getElementById('member-switch').innerHTML = online ?
      '<div class="ms-account">' + avatar(me, 32) + '<span class="ms-who"><strong>' + esc(me.name) + '</strong><small>' + esc(me.academic_role || me.role || '') + '</small></span>' +
      iconBtn('logout', '退出登录', 'data-action="logout"') + '</div>' :
      '<div class="ms-label">演示身份</div><div class="ms-account">' + avatar(me, 32) + '<select id="user-select" aria-label="切换演示身份">' + AuthAdapter.members().map(function (m) {
        return '<option value="' + esc(m.id) + '" ' + (m.id === me.id ? 'selected' : '') + '>' + esc(m.name) + ' · ' + esc(m.role) + '</option>';
      }).join('') + '</select></div><div class="ms-hint">演示数据仅保存在本机浏览器</div>';
  }
  function renderBrand() {
    const el = document.getElementById('brand-sub');
    const workspace = S.workspace();
    if (el) el.textContent = workspace && workspace.name ? workspace.name : (S.isOnline() ? '我的课题组' : '智能感知与分子设计实验室');
    Branding.apply(workspace, true);
  }
  function renderTopbar() {
    const t = TITLES[state.view];
    document.getElementById('crumb').textContent = t[0] + ' / ' + t[1];
    document.getElementById('page-title').textContent = t[1];
    document.title = t[1] + ' · 课题组工作台';
    const wd = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()];
    document.getElementById('today').textContent = fmt(today()) + ' 星期' + wd;
  }
  function renderChrome() {
    document.getElementById('menu-btn').innerHTML = icon('menu', 19);
    document.getElementById('search-btn').innerHTML = icon('search', 18);
    document.getElementById('search-trigger-icon').innerHTML = icon('search', 15);
    document.getElementById('theme-toggle').innerHTML = icon(Theme.isDark() ? 'sun' : 'moon', 18);
    if (/Mac|iPhone|iPad/.test(navigator.platform || '')) document.getElementById('search-kbd').textContent = '⌘ K';
  }
  function sectionHead(title, note, actionHtml) {
    return '<div class="section-head"><div><div class="section-title">' + title + '</div>' +
      (note ? '<div class="section-note">' + note + '</div>' : '') + '</div>' + (actionHtml ? '<div class="section-actions">' + actionHtml + '</div>' : '') + '</div>';
  }
  function addBtn(collection, label) {
    return '<button type="button" class="btn btn-primary btn-sm" data-action="new" data-collection="' + collection + '">' + icon('plus', 14) + (label || '新建') + '</button>';
  }
  function rowActions(collection, row) {
    if (!canEdit(collection, row)) return '';
    const attrs = 'data-collection="' + collection + '" data-id="' + esc(row.id) + '"';
    return '<span class="row-actions">' + iconBtn('edit', '编辑', 'data-action="edit" ' + attrs) + iconBtn('trash', '删除', 'data-action="del" ' + attrs, 'danger') + '</span>';
  }
  function empty(text, ic, actionHtml) {
    return '<div class="empty">' + (ic ? '<span class="empty-icon">' + icon(ic, 20) + '</span>' : '') + '<div>' + text + '</div>' + (actionHtml || '') + '</div>';
  }
  function chips(action, options, current) {
    return '<div class="chips" role="group">' + options.map(function (o) {
      const value = o.value == null ? o.label : o.value;
      return '<button type="button" class="chip ' + (current === value ? 'active' : '') + '" aria-pressed="' + (current === value) + '" data-action="' + action + '" data-value="' + esc(value) + '">' + esc(o.label) +
        (o.count == null ? '' : '<span class="chip-count">' + o.count + '</span>') + '</button>';
    }).join('') + '</div>';
  }
  function progressBar(value, done) {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="progress-fill ' + (done || pct >= 100 ? 'done' : '') + '" style="width:' + pct + '%"></div></div>';
  }
  function logItem(l, withActions) {
    const m = member(l.author_id);
    return '<div class="timeline-item" data-row-id="' + esc(l.id) + '">' + avatar(m, 30) + '<div class="tl-main">' +
      '<div class="tl-head"><span class="strong">' + esc(m.name) + '</span><span class="small muted">' + fmt(l.date) + '</span>' +
      '<span class="badge b-blue">' + esc(projectTitle(l.project_id)) + '</span>' + (l.hours ? '<span class="small muted">' + l.hours + ' 小时</span>' : '') +
      (withActions ? (l.applied ? '<span class="badge b-green">已回写</span>' : '<span class="badge b-gray">仅记录</span>') : '') +
      (withActions && canEdit('logs', l) ? '<span class="tl-actions">' + iconBtn('trash', '删除这条上报', 'data-action="del" data-collection="logs" data-id="' + esc(l.id) + '"', 'danger') + '</span>' : '') + '</div>' +
      '<div class="tl-body">' + esc(l.content) + '</div>' +
      (l.summary && l.summary.summary ? '<div class="tl-ai">' + icon('spark', 14) + '<span>' + esc(l.summary.summary) + '</span></div>' : '') +
      (withActions && l.summary && arr(l.summary.tags).length ? '<div class="tag-row">' + arr(l.summary.tags).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '</div></div>';
  }

  /* ---------- 视图：总览 ---------- */
  function viewOverview() {
    const me = AuthAdapter.current() || {};
    const tasks = S.list('tasks'), logs = S.list('logs'), events = S.list('events'), projects = S.list('projects');
    const days = lastNDays(14), byDay = logsByDay(14);
    const weekEvents = events.filter(function (e) { return diffDays(e.date) >= 0 && diffDays(e.date) <= 7; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    const recent = recentLogs().slice(0, 3);
    const open = tasks.filter(function (t) { return t.status !== 'done'; });
    const doing = tasks.filter(function (t) { return t.status === 'doing'; }).length;
    const delayed = tasks.filter(function (t) { return t.status === 'delayed'; }).length;
    const weekLogs = logs.filter(function (l) { return diffDays(l.date) > -7 && diffDays(l.date) <= 0; }).length;
    const mine = open.filter(function (t) { return t.assignee_id === me.id; }).sort(taskOrder);
    const mineOverdue = mine.filter(isOverdue).length;
    const mineSoon = mine.filter(function (t) { const d = diffDays(t.due_date); return d >= 0 && d <= 7; }).length;
    const reported = logs.some(function (l) { return l.author_id === me.id && l.date === today(); });
    const hour = new Date().getHours();
    const hello = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

    let html = '<div class="hero block"><div><div class="hero-title">' + hello + '，' + esc(me.name || '同学') + '</div>' +
      '<div class="hero-sub">' + (mine.length ? '你有 <b>' + mine.length + '</b> 项未完成任务' + (mineOverdue ? '，其中 <b class="text-red">' + mineOverdue + '</b> 项已逾期' : '') + (mineSoon ? '，<b>' + mineSoon + '</b> 项在一周内到期' : '') + '。' : '目前没有分配给你的未完成任务。') + '</div></div>' +
      '<div class="hero-side">' + (reported ? '<span class="report-state done">' + icon('ok', 16) + '今日已上报</span>' :
        '<span class="report-state">' + icon('edit', 15) + '今日尚未上报</span><button type="button" class="btn btn-primary" data-action="go-report">去上报' + icon('arrow', 15) + '</button>') + '</div></div>';

    html += '<div class="grid g4 block">' +
      metric('在研项目', projects.length, '论文 ' + projects.filter(function (p) { return p.kind === '论文'; }).length + ' · 课题 ' + projects.filter(function (p) { return p.kind !== '论文'; }).length, 'folder', 'blue', 'projects') +
      metric('未完成任务', open.length, '进行中 ' + doing + ' · 已延期 <b class="text-red">' + delayed + '</b>', 'check', 'cyan', 'tasks') +
      metric('文献库', S.list('papers').length, '待读 ' + S.list('papers').filter(function (p) { return p.read_state === '待读'; }).length + ' 篇', 'book', 'amber', 'papers') +
      metric('近 7 天上报', weekLogs, '累计 ' + logs.length + ' 条', 'edit', 'green', 'daily') +
      '</div>';

    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>我的待办</h3><button type="button" class="link" data-action="nav" data-view="tasks">全部任务' + icon('arrow', 13) + '</button></div>' +
      (mine.length ? mine.slice(0, 5).map(function (t) {
        return '<div class="list-row"><span class="status-dot dot-' + t.status + '" title="' + statusText(t.status) + '"></span>' +
          '<div class="lr-main"><div class="lr-title">' + esc(t.title) + '</div><div class="lr-sub">' + esc(projectTitle(t.project_id)) + ' · <span class="' + (isOverdue(t) ? 'text-red' : '') + '">' + dueLabel(t.due_date) + '</span></div></div>' +
          priorityBadge(t.priority) +
          '<button type="button" class="btn btn-sm" data-action="advance-task" data-id="' + esc(t.id) + '">' + ({ todo: '开始', doing: '完成', delayed: '继续' }[t.status] || '推进') + '</button></div>';
      }).join('') + (mine.length > 5 ? '<div class="list-more">还有 ' + (mine.length - 5) + ' 项未显示</div>' : '') : empty('没有分配给你的未完成任务', 'ok')) + '</div>' +
      '<div class="card"><div class="card-head"><h3>未来一周安排</h3><button type="button" class="link" data-action="nav" data-view="calendar">打开日历' + icon('arrow', 13) + '</button></div>' +
      (weekEvents.length ? weekEvents.slice(0, 5).map(function (e) {
        return '<div class="list-row"><span class="badge b-' + eventTone(e.type) + '">' + esc(e.type) + '</span>' +
          '<div class="lr-main"><div class="lr-title ' + (e.done ? 'struck' : '') + '">' + esc(e.title) + '</div><div class="lr-sub">' + fmt(e.date) + ' · ' + esc(projectTitle(e.project_id)) + '</div></div>' +
          '<span class="small muted nowrap">' + (diffDays(e.date) === 0 ? '今天' : diffDays(e.date) + ' 天后') + '</span></div>';
      }).join('') : empty('未来一周暂无安排', 'calendar')) + '</div></div>';

    // 顺序让红、绿不相邻，色觉障碍下也能区分
    const statusSeg = [
      { label: '已完成', value: tasks.filter(function (t) { return t.status === 'done'; }).length, color: 'var(--st-done)' },
      { label: '进行中', value: doing, color: 'var(--st-doing)' },
      { label: '已延期', value: delayed, color: 'var(--st-delayed)' },
      { label: '待开始', value: tasks.filter(function (t) { return t.status === 'todo'; }).length, color: 'var(--st-todo)' }
    ];
    html += '<div class="grid g2"><div class="stack">' +
      '<div class="card"><div class="card-head"><h3>项目整体进度</h3><span class="sub">成员确认后更新</span></div>' +
      (projects.length ? projects.map(function (p) {
        return '<div class="progress-row"><div class="pr-main"><div class="pr-title">' + esc(p.title) + '</div>' +
          '<div class="pr-sub">' + esc(p.kind) + ' · 负责人 ' + esc(member(p.lead_id).name) + ' · 节点 ' + fmt(p.deadline) + '</div></div>' +
          '<div class="pr-track">' + progressBar(p.progress) + '</div><div class="pr-num">' + (Number(p.progress) || 0) + '%</div></div>';
      }).join('') : empty('还没有项目', 'folder', addBtn('projects', '新建项目'))) + '</div>' +
      '<div class="card"><div class="card-head"><h3>近 14 天上报活跃度</h3><span class="sub">每日上报条数</span></div>' +
      Charts.slot({ type: 'line', values: byDay.map(function (a) { return a.length; }), labels: days.map(function (d) { return (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)); }),
        tips: days.map(function (d, i) { return fmt(d) + '：' + byDay[i].length + ' 条上报'; }), label: '近 14 天每日上报条数' }) + '</div>' +
      '</div><div class="stack">' +
      '<div class="card"><div class="card-head"><h3>任务状态分布</h3><span class="sub">共 ' + tasks.length + ' 项</span></div>' +
      '<div class="donut-wrap">' + Charts.donut(statusSeg, String(tasks.length), '任务') +
      '<div class="donut-legend">' + statusSeg.map(function (s) {
        return '<div class="legend-row"><span class="swatch" style="background:' + s.color + '"></span><span>' + s.label + '</span><span class="strong">' + s.value + '</span></div>';
      }).join('') + '</div></div></div>' +
      '<div class="card"><div class="card-head"><h3>组内最新动态</h3><button type="button" class="link" data-action="nav" data-view="daily">全部上报' + icon('arrow', 13) + '</button></div>' +
      (recent.length ? recent.map(function (l) { return logItem(l, false); }).join('') : empty('还没有上报记录，从今天的工作开始吧', 'inbox')) + '</div>' +
      '</div></div>';
    return html;
  }
  function metric(label, value, hint, ic, tone, view) {
    return '<button type="button" class="card metric" data-action="nav" data-view="' + view + '"><span class="m-top"><span class="m-label">' + label + '</span><span class="m-icon tone-' + tone + '">' + icon(ic, 16) + '</span></span>' +
      '<span class="m-value">' + value + '</span><span class="m-hint">' + hint + '</span></button>';
  }

  /* ---------- 视图：每日上报 ---------- */
  function viewDaily() {
    const f = state.reportForm || {};
    const me = AuthAdapter.current() || {};
    const aiReady = !S.isOnline() || Boolean(S.aiConfig().configured);
    const busy = state.aiLoading || state.savingLog;
    const reportNote = aiReady ? '填写工作内容，生成日报摘要与进度建议；也可以不经 AI 直接保存' : 'AI 服务尚未配置完整，可先直接保存上报，或联系 PI 完成设置';
    const projects = S.list('projects');
    let html = '<div class="card">' + sectionHead('今日工作上报', reportNote,
      '<button type="button" class="btn btn-sm" data-action="weekly-summary" ' + ((S.isOnline() && !aiReady) || state.weeklyLoading ? 'disabled' : '') + '>' + icon('file', 14) + (state.weeklyLoading ? '生成中…' : '生成本周周报') + '</button>') +
      '<div class="form-grid">' +
      '<label class="field"><span>日期</span><input type="date" id="rf-date" max="' + today() + '" value="' + esc(f.date || today()) + '"></label>' +
      '<label class="field"><span>投入时长（小时）</span><input type="number" id="rf-hours" min="0" max="24" step="0.5" value="' + esc(f.hours == null ? 6 : f.hours) + '"></label>' +
      '<label class="field full"><span>关联项目</span><select id="rf-project">' + projects.map(function (p) {
        return '<option value="' + esc(p.id) + '" ' + (f.projectId === p.id ? 'selected' : '') + '>' + esc(p.title) + '</option>';
      }).join('') + '<option value="" ' + (f.projectId === '' || !projects.length ? 'selected' : '') + '>未关联项目</option></select></label>' +
      '<label class="field full"><span>今天做了什么</span><textarea id="rf-content" rows="5" placeholder="例如：完成消息传递层的边特征改造，跑了三组超参，验证集 MAE 从 0.142 降到 0.128，整理了消融实验表格。">' + esc(f.content || '') + '</textarea>' +
      '<small class="field-hint">写清完成内容、结果和遇到的问题，摘要会更准确。</small></label>' +
      '</div>' +
      '<div class="form-actions"><button type="button" class="btn btn-ghost btn-sm" data-action="insert-template">插入上报模板</button><span class="grow"></span>' +
      '<button type="button" class="btn" data-action="save-log" ' + (busy ? 'disabled' : '') + '>' + (state.savingLog ? '保存中…' : '直接保存') + '</button>' +
      '<button type="button" class="btn btn-primary" data-action="generate-ai" ' + (busy || !aiReady ? 'disabled' : '') + '>' + icon('spark', 15) + (state.aiLoading ? '正在生成…' : (!aiReady ? 'AI 尚未配置' : '生成进度摘要')) + '</button>' +
      '</div>' +
      (state.aiDraft ? aiResultHtml(state.aiDraft.res) : '') +
      '</div>';

    if (state.weeklyDraft) {
      const w = state.weeklyDraft;
      const column = function (title, items, fallback) {
        return '<div class="ai-section"><h4>' + title + '</h4>' + (arr(items).length ? arr(items).map(function (x) { return '<div class="ai-bullet">' + esc(x) + '</div>'; }).join('') : '<div class="small muted">' + fallback + '</div>') + '</div>';
      };
      html += '<div class="card block-top"><div class="card-head"><div><h3>本周周报</h3><div class="section-note">' + esc(weekPeriodLabel()) + ' · ' + (w.source === 'ai' ? '由 ' + esc(w.model || 'AI') + ' 生成' : '按规则汇总，未调用大模型') + '</div></div>' +
        '<div class="section-actions"><button type="button" class="btn btn-sm" data-action="weekly-copy">' + icon('copy', 14) + '复制</button>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="weekly-save">存档</button>' +
        iconBtn('close', '关闭周报', 'data-action="weekly-close"') + '</div></div>' +
        '<div class="ai-summary">' + esc(w.summary || '') + '</div>' +
        '<div class="grid g3">' + column('本周亮点', w.highlights, '暂无') + column('阻塞点', w.blockers, '未发现阻塞点') + column('下周建议', w.nextSteps, '暂无') + '</div></div>';
    }

    const all = recentLogs();
    const list = state.logScope === 'mine' ? all.filter(function (l) { return l.author_id === me.id; }) : all;
    html += '<div class="card block-top">' + sectionHead('上报记录', '共 ' + list.length + ' 条',
      chips('log-scope', [{ label: '全部', value: 'all' }, { label: '只看我的', value: 'mine' }], state.logScope)) +
      (list.length ? list.slice(0, state.logLimit).map(function (l) { return logItem(l, true); }).join('') +
        (list.length > state.logLimit ? '<div class="list-more"><button type="button" class="btn btn-sm" data-action="more-logs">显示更多（还有 ' + (list.length - state.logLimit) + ' 条）</button></div>' : '') :
        empty('还没有上报记录', 'inbox')) + '</div>';

    const weekly = S.list('weekly_reports');
    if (weekly.length) {
      html += '<div class="card block-top">' + sectionHead('周报存档', '共 ' + weekly.length + ' 份') +
        weekly.map(function (r) {
          const sum = r.summary && typeof r.summary === 'object' ? r.summary : {};
          return '<details class="fold" data-row-id="' + esc(r.id) + '"><summary><span class="strong">' + esc(r.period || '周报') + '</span><span class="small muted">' + esc(member(r.created_by).name) + ' · ' + fmt(r.created_at) + '</span></summary>' +
            '<div class="fold-body"><p>' + esc(r.content || sum.summary || '') + '</p>' +
            [['本周亮点', sum.highlights], ['阻塞点', sum.blockers], ['下周建议', sum.nextSteps]].filter(function (x) { return arr(x[1]).length; }).map(function (x) {
              return '<div class="ai-section"><h4>' + x[0] + '</h4>' + arr(x[1]).map(function (line) { return '<div class="ai-bullet">' + esc(line) + '</div>'; }).join('') + '</div>';
            }).join('') +
            (canEdit('weekly_reports', r) ? '<div class="fold-actions"><button type="button" class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="weekly_reports" data-id="' + esc(r.id) + '">删除存档</button></div>' : '') +
            '</div></details>';
        }).join('') + '</div>';
    }
    return html;
  }
  function aiResultHtml(r) {
    const source = r.source === 'ai' ? esc(r.model || 'AI 模型') : (r.source === 'demo' ? '本地演示生成器' : 'AI 暂不可用，已按规则整理');
    // 服务端只回写当前成员有权修改的项目和任务，其余建议在这里标出来，避免误以为已生效
    const locked = function (collection, id) { const row = S.find(collection, id); return Boolean(row) && !canEdit(collection, row); };
    const lockNote = '<span class="chip-lock">需负责人或 PI 更新</span>';
    const anyLocked = arr(r.progress).some(function (p) { return locked('projects', p.projectId); }) || arr(r.taskUpdates).some(function (u) { return locked('tasks', u.taskId); });
    return '<div class="ai-result"><div class="ai-result-head"><div class="arh-title">' + icon('spark', 15) + '整理结果</div><span class="small muted">' + source + '</span></div>' +
      '<div class="ai-result-body"><div class="ai-summary">' + esc(r.summary) + '</div>' +
      '<div class="grid g2">' +
      '<div class="ai-section"><h4>项目进度建议</h4>' + (arr(r.progress).length ? arr(r.progress).map(function (p) {
        const delta = Number(p.delta) || 0;
        return '<div class="ai-chip"><span class="strong ' + (delta < 0 ? 'text-red' : 'text-green') + '">' + (delta >= 0 ? '+' : '') + delta + '%</span>' + esc(p.title) + (locked('projects', p.projectId) ? lockNote : '') + '</div>';
      }).join('') : '<div class="small muted">无</div>') + '</div>' +
      '<div class="ai-section"><h4>任务状态整理</h4>' + (arr(r.taskUpdates).length ? arr(r.taskUpdates).map(function (u) {
        return '<div class="ai-chip">' + esc(String(u.title || '').slice(0, 18)) + ' · ' + statusText(u.from) + ' → <span class="strong">' + statusText(u.to) + '</span>' + (locked('tasks', u.taskId) ? lockNote : '') + '</div>';
      }).join('') : '<div class="small muted">本次无需调整任务状态</div>') + '</div>' +
      '<div class="ai-section"><h4>下一步建议</h4>' + (arr(r.suggestions).map(function (s) { return '<div class="ai-bullet">' + esc(s) + '</div>'; }).join('') || '<div class="small muted">无</div>') + '</div>' +
      '<div class="ai-section"><h4>工作类型标签</h4><div class="tag-row">' + arr(r.tags).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></div>' +
      '</div><div class="ai-actions">' +
      '<button type="button" class="btn btn-primary" data-action="apply-ai" ' + (state.aiLoading ? 'disabled' : '') + '>应用并保存</button>' +
      '<button type="button" class="btn" data-action="discard-ai">放弃</button>' +
      '<span class="ai-warn">' + (anyLocked ? '上报会保存并计入复盘统计；标注「需负责人或 PI 更新」的建议不会自动回写' : '应用后将回写项目进度与任务状态，并计入复盘统计') + '</span></div></div></div>';
  }

  /* ---------- 视图：论文项目 ---------- */
  function viewProjects() {
    const all = S.list('projects'), tasks = S.list('tasks');
    const list = all.filter(function (p) { return state.projectFilter === '全部' || p.kind === state.projectFilter; });
    let html = sectionHead('论文与课题项目', '管理研究项目、拆解阶段任务、记录关键成果与待办事项', addBtn('projects', '新建项目')) +
      '<div class="toolbar">' + chips('project-filter', ['全部', '论文', '课题'].map(function (k) {
        return { label: k, count: k === '全部' ? all.length : all.filter(function (p) { return p.kind === k; }).length };
      }), state.projectFilter) + '</div>';
    if (!list.length) return html + '<div class="card">' + empty(all.length ? '没有该类型的项目' : '还没有项目，创建第一个论文或课题项目', 'folder', all.length ? '' : addBtn('projects', '新建项目')) + '</div>';
    html += '<div class="grid g2">' + list.map(function (p) {
      const ms = arr(p.milestones);
      const done = ms.filter(function (m) { return m.done; }).length;
      const dleft = diffDays(p.deadline), finished = Number(p.progress) >= 100;
      const own = tasks.filter(function (t) { return t.project_id === p.id; });
      const ownDone = own.filter(function (t) { return t.status === 'done'; }).length;
      const editable = canEdit('projects', p);
      return '<article class="card project-card" data-row-id="' + esc(p.id) + '"><div class="card-top">' +
        '<div class="ct-main"><div class="badge-row"><span class="badge ' + (p.kind === '论文' ? 'b-blue' : 'b-purple') + '">' + esc(p.kind) + '</span>' +
        (finished ? '<span class="badge b-green">已完成</span>' : (p.deadline && dleft < 0 ? '<span class="badge b-red">已逾期 ' + (-dleft) + ' 天</span>' : (p.deadline && dleft <= 14 ? '<span class="badge b-amber">剩 ' + dleft + ' 天</span>' : ''))) + '</div>' +
        '<h3>' + esc(p.title) + '</h3><div class="small muted">目标：' + esc(p.goal || '—') + '</div></div>' + rowActions('projects', p) + '</div>' +
        '<div class="spread progress-head"><span class="small muted">整体进度</span><span class="strong">' + (Number(p.progress) || 0) + '%</span></div>' + progressBar(p.progress) +
        '<div class="meta-row">' + avatar(member(p.lead_id), 20) + '<span>' + esc(member(p.lead_id).name) + '</span><span class="sep">·</span><span>节点 ' + fmt(p.deadline) + '</span>' +
        (p.deadline && !finished && dleft > 14 ? '<span class="sep">·</span><span>剩 ' + dleft + ' 天</span>' : '') +
        '<button type="button" class="link push" data-action="project-tasks" data-id="' + esc(p.id) + '">任务 ' + ownDone + '/' + own.length + icon('arrow', 13) + '</button></div>' +
        '<div class="hr"></div><div class="spread"><span class="small strong">阶段任务 ' + done + '/' + ms.length + '</span>' +
        (editable ? '<button type="button" class="btn btn-sm btn-ghost" data-action="add-milestone" data-id="' + esc(p.id) + '">' + icon('plus', 13) + '添加阶段</button>' : '') + '</div>' +
        (ms.length ? '<div class="milestones">' + ms.map(function (m, i) {
          return '<div class="milestone ' + (m.done ? 'done' : '') + '"><label><input type="checkbox" data-action="toggle-milestone" data-id="' + esc(p.id) + '" data-index="' + i + '" ' + (m.done ? 'checked' : '') + ' ' + (editable ? '' : 'disabled') + '>' +
            '<span class="ms-title">' + esc(m.title) + '</span></label><span class="ms-due ' + (!m.done && m.due && diffDays(m.due) < 0 ? 'text-red' : '') + '">' + fmt(m.due) + '</span>' +
            (editable ? iconBtn('close', '移除阶段', 'data-action="del-milestone" data-id="' + esc(p.id) + '" data-index="' + i + '"', 'ms-del') : '') + '</div>';
        }).join('') + '</div>' : '<div class="small muted ms-empty">还没有阶段任务' + (editable ? '，把项目拆成几个关键节点更容易跟踪' : '') + '</div>') +
        (p.notes ? '<div class="note-box">' + esc(p.notes) + '</div>' : '') + '</article>';
    }).join('') + '</div>';
    return html;
  }

  /* ---------- 视图：任务看板 ---------- */
  function viewTasks() {
    const me = AuthAdapter.current() || {};
    const all = S.list('tasks');
    const q = state.taskQuery.trim().toLowerCase();
    const tasks = all.filter(function (t) {
      if (state.taskProject && t.project_id !== state.taskProject) return false;
      if (state.taskAssignee && t.assignee_id !== state.taskAssignee) return false;
      return !q || (String(t.title || '') + arr(t.tags).join(' ') + projectTitle(t.project_id) + member(t.assignee_id).name).toLowerCase().indexOf(q) >= 0;
    });
    const cols = [
      { key: 'todo', label: '待开始' },
      { key: 'doing', label: '进行中' },
      { key: 'done', label: '已完成' },
      { key: 'delayed', label: '已延期' }
    ];
    const overdue = all.filter(function (t) { return t.status === 'delayed' || isOverdue(t); }).length;
    const weekDue = all.filter(function (t) { return t.status !== 'done' && diffDays(t.due_date) >= 0 && diffDays(t.due_date) <= 7; }).length;
    const filtered = Boolean(q || state.taskProject || state.taskAssignee);
    let html = sectionHead('科研任务看板', '拖动卡片即可改变状态；按优先级和截止日期排序', addBtn('tasks', '新建任务')) +
      '<div class="grid g3 block">' +
      '<div class="card tight stat"><div class="small muted">一周内到期</div><div class="stat-value">' + weekDue + '</div></div>' +
      '<div class="card tight stat"><div class="small muted">延期或逾期</div><div class="stat-value">' + overdue + (overdue ? '<span class="badge b-red">需关注</span>' : '') + '</div></div>' +
      '<div class="card tight stat"><div class="small muted">任务完成率</div><div class="stat-value">' +
      (all.length ? Math.round(all.filter(function (t) { return t.status === 'done'; }).length / all.length * 100) : 0) + '%</div></div></div>' +
      '<div class="toolbar"><div class="search-box">' + icon('search', 15) + '<input type="search" id="task-search" data-state="taskQuery" placeholder="搜索任务、项目或负责人" value="' + esc(state.taskQuery) + '"></div>' +
      '<select data-state="taskProject" aria-label="按项目筛选"><option value="">全部项目</option>' + S.list('projects').map(function (p) {
        return '<option value="' + esc(p.id) + '" ' + (state.taskProject === p.id ? 'selected' : '') + '>' + esc(p.title) + '</option>';
      }).join('') + '</select>' +
      '<select data-state="taskAssignee" aria-label="按负责人筛选"><option value="">全部成员</option>' + S.list('members').map(function (m) {
        return '<option value="' + esc(m.id) + '" ' + (state.taskAssignee === m.id ? 'selected' : '') + '>' + esc(m.name) + (m.id === me.id ? '（我）' : '') + '</option>';
      }).join('') + '</select>' +
      (filtered ? '<button type="button" class="btn btn-sm btn-ghost" data-action="task-clear">清除筛选</button>' : '') +
      '<span class="small muted push">' + tasks.length + ' / ' + all.length + ' 项</span></div>' +
      '<div class="board">' + cols.map(function (col) {
        const list = tasks.filter(function (t) { return t.status === col.key; }).sort(taskOrder);
        return '<section class="board-col" data-status="' + col.key + '"><div class="board-col-head"><span class="flex"><span class="status-dot dot-' + col.key + '"></span>' + col.label + '<span class="cnt">' + list.length + '</span></span>' +
          iconBtn('plus', '在「' + col.label + '」新建任务', 'data-action="new" data-collection="tasks" data-status="' + col.key + '"') + '</div>' +
          (list.length ? list.map(function (t) {
            const m = member(t.assignee_id), editable = canEdit('tasks', t), late = isOverdue(t);
            return '<div class="board-card" ' + (editable ? 'draggable="true" ' : '') + 'data-row-id="' + esc(t.id) + '">' +
              '<div class="bc-top"><div class="badge-row">' + priorityBadge(t.priority) + (late ? '<span class="badge b-red">逾期</span>' : '') + '</div>' + rowActions('tasks', t) + '</div>' +
              '<div class="bc-title">' + esc(t.title) + '</div>' +
              '<div class="bc-project">' + esc(projectTitle(t.project_id)) + '</div>' +
              '<div class="bc-foot">' + avatar(m, 20) + '<span>' + esc(m.name) + '</span>' +
              '<span class="push ' + (late ? 'text-red' : '') + '" title="' + dueLabel(t.due_date) + '">' + fmt(t.due_date) + '</span></div>' +
              (editable && t.status !== 'done' ? '<button type="button" class="btn btn-sm bc-advance" data-action="advance-task" data-id="' + esc(t.id) + '">' + ({ todo: '开始', doing: '标记完成', delayed: '继续推进' }[t.status]) + icon('arrow', 13) + '</button>' : '') + '</div>';
          }).join('') : '<div class="board-empty">' + (filtered ? '无匹配任务' : '拖到这里，或点击 + 新建') + '</div>') + '</section>';
      }).join('') + '</div>';
    return html;
  }

  /* ---------- 视图：文献管理 ---------- */
  function viewPapers() {
    const all = S.list('papers');
    const q = state.paperQuery.trim().toLowerCase();
    const list = all.filter(function (p) {
      const okFilter = state.paperFilter === '全部' || p.read_state === state.paperFilter;
      const okQuery = !q || (String(p.title || '') + (p.authors || '') + arr(p.tags).join('') + (p.venue || '') + (p.note || '')).toLowerCase().indexOf(q) >= 0;
      return okFilter && okQuery;
    });
    if (state.paperSort === 'year') list.sort(function (a, b) { return (Number(b.year) || 0) - (Number(a.year) || 0); });
    if (state.paperSort === 'rating') list.sort(function (a, b) { return (Number(b.rating) || 0) - (Number(a.rating) || 0); });
    let html = sectionHead('文献管理', '分类管理文献、记录阅读笔记、关联项目与任务形成知识积累',
      '<button type="button" class="btn btn-sm" data-action="export-papers" ' + (all.length ? '' : 'disabled') + '>' + icon('download', 14) + '导出 CSV</button>' + addBtn('papers', '添加文献')) +
      '<div class="toolbar">' + chips('paper-filter', ['全部', '待读', '略读', '精读'].map(function (f) {
        return { label: f, count: f === '全部' ? all.length : all.filter(function (p) { return p.read_state === f; }).length };
      }), state.paperFilter) +
      '<select class="push" data-state="paperSort" aria-label="排序方式">' + [['recent', '按添加顺序'], ['year', '按年份'], ['rating', '按评分']].map(function (o) {
        return '<option value="' + o[0] + '" ' + (state.paperSort === o[0] ? 'selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<div class="search-box">' + icon('search', 15) + '<input type="search" id="paper-search" data-state="paperQuery" placeholder="搜索标题 / 作者 / 标签 / 笔记" value="' + esc(state.paperQuery) + '"></div></div>';
    if (!list.length) return html + '<div class="card">' + empty(all.length ? '没有匹配的文献' : '文献库还是空的，添加第一篇文献', 'book', all.length ? '' : addBtn('papers', '添加文献')) + '</div>';
    html += '<div class="card table-card"><div class="table-scroll"><table class="table"><thead><tr><th style="width:34%">文献</th><th>标签</th><th>关联项目</th><th>阅读状态</th><th>评分</th><th>笔记</th><th aria-label="操作"></th></tr></thead><tbody>' +
      list.map(function (p) {
        const url = safeUrl(p.url), editable = canEdit('papers', p), rating = Number(p.rating) || 0;
        return '<tr data-row-id="' + esc(p.id) + '"><td><div class="td-title">' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + icon('link', 13) + '</a>' : esc(p.title)) + '</div>' +
          '<div class="td-sub">' + esc([p.authors, p.year || '', p.venue].filter(Boolean).join(' · ')) + '</div></td>' +
          '<td><div class="tag-row">' + arr(p.tags).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></td>' +
          '<td class="small">' + esc(projectTitle(p.project_id)) + '</td>' +
          '<td><select class="paper-state mini" data-id="' + esc(p.id) + '" aria-label="阅读状态" ' + (editable ? '' : 'disabled') + '>' + ['待读', '略读', '精读'].map(function (s) {
            return '<option ' + (p.read_state === s ? 'selected' : '') + '>' + s + '</option>';
          }).join('') + '</select></td>' +
          '<td><div class="stars" role="group" aria-label="评分 ' + rating + ' / 5">' + [1, 2, 3, 4, 5].map(function (n) {
            return '<button type="button" class="star ' + (n <= rating ? 'on' : '') + '" ' + (editable ? 'data-action="rate-paper" data-id="' + esc(p.id) + '" data-value="' + n + '"' : 'disabled') + ' aria-label="' + n + ' 星">★</button>';
          }).join('') + '</div></td>' +
          '<td><div class="td-note" title="' + esc(p.note || '') + '">' + esc(p.note || '—') + '</div></td>' +
          '<td>' + rowActions('papers', p) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    return html;
  }
  function exportPapersCsv() {
    const cell = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    const rows = [['标题', '作者', '年份', '期刊/会议', '标签', '关联项目', '阅读状态', '评分', '链接', '笔记']].concat(S.list('papers').map(function (p) {
      return [p.title, p.authors, p.year, p.venue, arr(p.tags).join('；'), p.project_id ? projectTitle(p.project_id) : '', p.read_state, p.rating || '', p.url || '', p.note];
    }));
    // BOM 让 Excel 以 UTF-8 打开中文
    downloadText('文献库-' + today() + '.csv', '﻿' + rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8');
  }

  /* ---------- 视图：实验记录 ---------- */
  function viewExperiments() {
    const all = S.list('experiments').slice().sort(function (a, b) { return (b.date || b.created_at || '').localeCompare(a.date || a.created_at || ''); });
    const q = state.experimentQuery.trim().toLowerCase();
    const records = all.filter(function (r) {
      const text = [r.title, r.category, r.hypothesis, r.materials, r.procedure, r.observations, r.results, r.conclusion, r.next_steps].join(' ').toLowerCase();
      return !q || text.indexOf(q) >= 0 || projectTitle(r.project_id).toLowerCase().indexOf(q) >= 0;
    });
    let html = sectionHead('实验记录', '按项目与任务归档实验过程、观察结果和结论', addBtn('experiments', '新建记录')) +
      '<div class="toolbar"><div class="search-box wide">' + icon('search', 15) + '<input type="search" id="experiment-search" data-state="experimentQuery" placeholder="搜索实验记录、项目或结论" value="' + esc(state.experimentQuery) + '"></div><span class="small muted push">' + records.length + ' 条记录</span></div>';
    if (!records.length) return html + '<div class="card">' + empty(all.length ? '没有匹配的实验记录' : '还没有实验记录，创建一条记录来整理实验过程与结果', 'flask', all.length ? '' : addBtn('experiments', '新建记录')) + '</div>';
    html += '<div class="experiment-list">' + records.map(function (r) {
      const author = member(r.created_by);
      const editable = canEdit('experiments', r);
      const details = [
        ['实验假设 / 目的', r.hypothesis], ['材料与设备', r.materials], ['实验步骤', r.procedure],
        ['观察记录', r.observations], ['结果', r.results], ['结论', r.conclusion], ['后续计划', r.next_steps]
      ].filter(function (entry) { return entry[1]; });
      const attachments = r.attachments || [];
      return '<article class="card experiment-card" data-row-id="' + esc(r.id) + '"><div class="card-top"><div class="ct-main"><div class="badge-row">' +
        '<span class="badge b-purple">' + esc(r.category || '实验') + '</span><span class="small muted">' + fmt(r.date || r.created_at) + '</span>' +
        (r.project_id ? '<span class="badge b-blue">' + esc(projectTitle(r.project_id)) + '</span>' : '') +
        (r.task_id ? '<span class="badge b-gray">' + esc((S.find('tasks', r.task_id) || {}).title || '关联任务') + '</span>' : '') +
        '</div><h3>' + esc(r.title) + '</h3><div class="small muted">记录人：' + esc(author.name || '成员') + '</div></div>' + rowActions('experiments', r) +
        '</div>' + (details.length ? '<div class="experiment-details">' + details.map(function (entry) {
          return '<section><h4>' + esc(entry[0]) + '</h4><p>' + esc(entry[1]) + '</p></section>';
        }).join('') + '</div>' : '<div class="small muted ms-empty">可继续补充实验目的、步骤、观察和结论。</div>') +
        '<div class="experiment-attachments"><div class="spread"><h4>附件</h4>' + (S.isOnline() && editable ? '<button type="button" class="btn btn-sm" data-action="pick-experiment-files" data-input-id="exp-files-' + esc(r.id) + '">' + icon('upload', 14) + '添加附件</button>' : '') + '</div>' +
        (attachments.length ? '<div class="attachment-list">' + attachments.map(function (a) {
          return '<div class="attachment-row"><span class="attachment-icon">' + icon('file', 14) + '</span><span class="attachment-name" title="' + esc(a.name) + '">' + esc(a.name) + '</span><span class="small muted">' + formatFileSize(a.size) + '</span>' +
            iconBtn('download', '下载', 'data-action="download-experiment-file" data-experiment-id="' + esc(r.id) + '" data-attachment-id="' + esc(a.id) + '" data-filename="' + esc(a.name) + '"') +
            (S.isOnline() && editable ? iconBtn('trash', '移除', 'data-action="delete-experiment-file" data-experiment-id="' + esc(r.id) + '" data-attachment-id="' + esc(a.id) + '"', 'danger') : '') + '</div>';
        }).join('') + '</div>' : '<div class="small muted">' + (S.isOnline() ? '暂无附件' + (editable ? '，可上传 PDF、图片、表格或文档（单个不超过 10 MB）' : '') : '附件上传需要联网工作台') + '</div>') +
        (S.isOnline() && editable ? '<input class="experiment-file-input" id="exp-files-' + esc(r.id) + '" data-experiment-id="' + esc(r.id) + '" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.csv,.tsv,.txt,.docx,.xlsx">' : '') +
        '</div></article>';
    }).join('') + '</div>';
    return html;
  }
  function formatFileSize(size) {
    const bytes = Number(size) || 0;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ---------- 视图：科研日历 ---------- */
  function viewCalendar() {
    const evs = S.list('events'), month = state.calMode === 'month';
    const days = [];
    let title, focusMonth = '';
    if (month) {
      const first = new Date(); first.setHours(0, 0, 0, 0); first.setDate(1); first.setMonth(first.getMonth() + state.calOffset);
      const gridStart = addDays(first, -((first.getDay() + 6) % 7));
      focusMonth = iso(first).slice(0, 7);
      for (let i = 0; i < 42; i++) days.push(iso(addDays(gridStart, i)));
      if (days[35].slice(0, 7) !== focusMonth) days.length = 35;
      title = first.getFullYear() + ' 年 ' + (first.getMonth() + 1) + ' 月';
    } else {
      const start = startOfWeek(state.calOffset);
      for (let i = 0; i < 7; i++) days.push(iso(addDays(start, i)));
      title = fmt(days[0]) + ' — ' + fmt(days[6]);
    }
    const inRange = evs.filter(function (e) { return month ? String(e.date || '').slice(0, 7) === focusMonth : days.indexOf(e.date) >= 0; })
      .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    const planned = inRange.length, done = inRange.filter(function (e) { return e.done; }).length;
    const unit = month ? '月' : '周', maxPerCell = month ? 3 : 20;
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    let html = sectionHead('科研日历', '安排文献阅读、实验、写作等日程，按周 / 月查看计划与实际完成情况', addBtn('events', '新建日程')) +
      '<div class="card"><div class="cal-bar"><div class="flex">' + iconBtn('left', '上一' + unit, 'data-action="cal-prev"') +
      '<button type="button" class="btn btn-sm" data-action="cal-today">' + (month ? '本月' : '本周') + '</button>' + iconBtn('right', '下一' + unit, 'data-action="cal-next"') +
      '<span class="cal-title">' + title + '</span></div>' +
      '<div class="flex"><span class="small muted">计划 ' + planned + ' 项 · 完成 ' + done + ' 项</span>' +
      chips('cal-mode', [{ label: '周', value: 'week' }, { label: '月', value: 'month' }], state.calMode) + '</div></div>' +
      '<div class="cal-grid ' + (month ? 'month' : 'week') + '">' + weekdays.map(function (w) { return '<div class="cal-head">周' + w + '</div>'; }).join('') +
      days.map(function (d, i) {
        const list = evs.filter(function (e) { return e.date === d; });
        const isToday = d === today(), outside = month && d.slice(0, 7) !== focusMonth;
        return '<div class="cal-cell ' + (isToday ? 'today ' : '') + (outside ? 'outside' : '') + '"><div class="cc-head"><span class="cc-num"><span class="cc-wd">周' + weekdays[i % 7] + ' </span>' + (+d.slice(8, 10)) + (isToday ? '<em>今天</em>' : '') + '</span>' +
          iconBtn('plus', fmt(d) + ' 新建日程', 'data-action="new" data-collection="events" data-date="' + d + '"', 'cc-add') + '</div>' +
          list.slice(0, maxPerCell).map(function (e) {
            const cls = 'cal-ev tone-' + eventTone(e.type) + (e.done ? ' done' : '');
            const label = (e.done ? '✓ ' : '') + esc(e.title);
            return canEdit('events', e) ? '<button type="button" class="' + cls + '" title="' + esc(e.type + ' · ' + e.title) + '" data-action="edit" data-collection="events" data-id="' + esc(e.id) + '">' + label + '</button>' :
              '<div class="' + cls + '" title="' + esc(e.type + ' · ' + e.title) + '">' + label + '</div>';
          }).join('') + (list.length > maxPerCell ? '<div class="cal-more">还有 ' + (list.length - maxPerCell) + ' 项</div>' : '') + '</div>';
      }).join('') + '</div></div>';

    const weeks = [-3, -2, -1, 0];
    const inWeek = function (offset, onlyDone) {
      const s = iso(startOfWeek(offset)), e = iso(startOfWeek(offset + 1));
      return evs.filter(function (x) { return x.date >= s && x.date < e && (!onlyDone || x.done); }).length;
    };
    html += '<div class="grid g2 block-top">' +
      '<div class="card"><div class="card-head"><h3>' + (month ? '本月' : '本周') + '计划清单</h3><span class="sub">' + planned + ' 项</span></div>' +
      (inRange.length ? inRange.map(function (e) {
        const editable = canEdit('events', e);
        return '<div class="list-row" data-row-id="' + esc(e.id) + '"><input type="checkbox" class="check" data-action="toggle-event" data-id="' + esc(e.id) + '" ' + (e.done ? 'checked' : '') + ' ' + (editable ? '' : 'disabled') + ' aria-label="标记完成">' +
          '<div class="lr-main"><div class="lr-title ' + (e.done ? 'struck' : '') + '">' + esc(e.title) + '</div>' +
          '<div class="lr-sub">' + fmt(e.date) + ' · ' + esc(projectTitle(e.project_id)) + '</div></div>' +
          '<span class="badge b-' + eventTone(e.type) + '">' + esc(e.type) + '</span>' + rowActions('events', e) + '</div>';
      }).join('') : empty((month ? '本月' : '本周') + '暂无安排', 'calendar')) + '</div>' +
      '<div class="card"><div class="card-head"><h3>计划与实际完成</h3><span class="sub">近 4 周 · 日程数</span></div>' +
      Charts.slot({ type: 'bar', label: '近 4 周计划与完成的日程数', labels: weeks.map(function (o) { return o === 0 ? '本周' : weekLabel(o) + ' 周'; }), series: [
        { name: '计划', color: 'var(--chart-2)', values: weeks.map(function (o) { return inWeek(o, false); }) },
        { name: '完成', color: 'var(--chart-1)', values: weeks.map(function (o) { return inWeek(o, true); }) }
      ] }) +
      '<div class="small muted chart-note">勾选清单中的完成项，统计会实时更新。</div></div></div>';
    return html;
  }

  /* ---------- 视图：数据分析 ---------- */
  function viewAnalyses() {
    const list = S.list('analyses');
    return sectionHead('数据分析', '记录数据清洗与预处理脚本、统计分析与关键结论，便于复现', addBtn('analyses', '新建分析记录')) +
      (list.length ? '<div class="grid g2">' + list.map(function (a) {
        return '<article class="card" data-row-id="' + esc(a.id) + '"><div class="card-top"><div class="ct-main">' +
          '<div class="badge-row"><span class="badge ' + (a.tool === 'Python' ? 'b-green' : a.tool === 'Stata' ? 'b-purple' : 'b-blue') + '">' + esc(a.tool) + '</span></div>' +
          '<h3>' + esc(a.title) + '</h3>' +
          '<div class="small muted">' + esc(projectTitle(a.project_id)) + ' · ' + fmt(a.created_at) + '</div></div>' + rowActions('analyses', a) + '</div>' +
          '<div class="hr"></div>' +
          '<dl class="kv-list"><dt>数据集</dt><dd><span class="mono">' + esc(a.dataset || '—') + '</span></dd><dt>脚本</dt><dd><span class="mono">' + esc(a.script || '—') + '</span></dd></dl>' +
          (a.result ? '<div class="note-box"><span class="strong">关键结论</span>　' + esc(a.result) + '</div>' : '') + '</article>';
      }).join('') + '</div>' : '<div class="card">' + empty('暂无分析记录', 'chart', addBtn('analyses', '新建分析记录')) + '</div>');
  }

  /* ---------- 视图：可视化复盘 ---------- */
  function viewReviews() {
    const logs = S.list('logs'), tasks = S.list('tasks'), projects = S.list('projects');
    const last14 = lastNDays(14), byDay = logsByDay(14);
    const hours = byDay.reduce(function (a, list) { return a + list.reduce(function (x, l) { return x + (Number(l.hours) || 0); }, 0); }, 0);
    const tagCount = {};
    logs.forEach(function (l) { arr(l.summary && l.summary.tags).forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
    const tagRank = Object.keys(tagCount).map(function (k) { return { label: k, value: tagCount[k] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    const weekOffsets = [-7, -6, -5, -4, -3, -2, -1, 0];
    const weekName = function (o) { return o === 0 ? '本周' : weekLabel(o); };
    const inWeek = function (dateStr, o) { const d = String(dateStr || '').slice(0, 10); return d >= iso(startOfWeek(o)) && d < iso(startOfWeek(o + 1)); };
    const weekly = weekOffsets.map(function (o) { return logs.filter(function (l) { return inWeek(l.date, o); }).length; });
    const doneWeekly = weekOffsets.map(function (o) { return tasks.filter(function (t) { return t.status === 'done' && t.completed_at && inWeek(iso(t.completed_at), o); }).length; });

    let html = '<div class="grid g4 block">' +
      metric('近 14 天上报', logs.filter(function (l) { return last14.indexOf(l.date) >= 0; }).length, '工作记录条数', 'edit', 'blue', 'daily') +
      metric('累计投入', Math.round(hours) + ' h', '近 14 天合计时长', 'calendar', 'green', 'daily') +
      metric('已完成任务', tasks.filter(function (t) { return t.status === 'done'; }).length, '共 ' + tasks.length + ' 项任务', 'check', 'amber', 'tasks') +
      metric('文献精读', S.list('papers').filter(function (p) { return p.read_state === '精读'; }).length, '文献库 ' + S.list('papers').length + ' 篇', 'book', 'purple', 'papers') +
      '</div>';

    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>近 8 周工作上报量</h3><span class="sub">每周条数</span></div>' +
      Charts.slot({ type: 'line', label: '近 8 周每周上报条数', values: weekly, labels: weekOffsets.map(weekName), tips: weekOffsets.map(function (o, i) { return (o === 0 ? '本周' : weekLabel(o) + ' 当周') + '：' + weekly[i] + ' 条上报'; }) }) + '</div>' +
      '<div class="card"><div class="card-head"><h3>任务完成量</h3><span class="sub">近 8 周 · 每周完成数</span></div>' +
      Charts.slot({ type: 'bar', label: '近 8 周每周完成任务数', labels: weekOffsets.map(weekName), series: [{ name: '完成任务', color: 'var(--st-done)', values: doneWeekly }] }) + '</div></div>';

    // 上报热力图：近 12 周，每列一周
    const heatStart = startOfWeek(-11), dayCount = {};
    logs.forEach(function (l) { dayCount[l.date] = (dayCount[l.date] || 0) + 1; });
    let heatMax = 1, heat = '';
    for (let i = 0; i < 84; i++) heatMax = Math.max(heatMax, dayCount[iso(addDays(heatStart, i))] || 0);
    for (let w = 0; w < 12; w++) {
      heat += '<div class="heat-col">';
      for (let d = 0; d < 7; d++) {
        const key = iso(addDays(heatStart, w * 7 + d)), n = dayCount[key] || 0;
        heat += key > today() ? '<i class="heat-cell future"></i>' : '<i class="heat-cell l' + (n ? Math.ceil(n / heatMax * 4) : 0) + '" data-tip="' + fmt(key) + '：' + n + ' 条上报"></i>';
      }
      heat += '</div>';
    }
    const tagMax = tagRank.length ? tagRank[0].value : 1;
    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>上报热力图</h3><span class="sub">近 12 周 · 每格一天</span></div>' +
      '<div class="heat"><div class="heat-days"><span>一</span><span></span><span>三</span><span></span><span>五</span><span></span><span>日</span></div><div class="heat-grid">' + heat + '</div></div>' +
      '<div class="heat-legend"><span>少</span><i class="heat-cell l0"></i><i class="heat-cell l1"></i><i class="heat-cell l2"></i><i class="heat-cell l3"></i><i class="heat-cell l4"></i><span>多</span></div></div>' +
      '<div class="card"><div class="card-head"><h3>工作类型分布</h3><span class="sub">按上报标签统计 · 次数</span></div>' +
      (tagRank.length ? '<div class="hbars">' + tagRank.map(function (s) {
        return '<div class="hbar" data-tip="' + esc(s.label) + '：' + s.value + ' 次"><span class="hbar-label">' + esc(s.label) + '</span><span class="hbar-track"><i style="width:' + Math.max(2, s.value / tagMax * 100).toFixed(1) + '%"></i></span><span class="hbar-value">' + s.value + '</span></div>';
      }).join('') + '</div>' : empty('经 AI 整理的上报会带上工作类型标签', 'pie')) + '</div></div>';

    html += '<div class="grid g2">' +
      '<div class="card"><div class="card-head"><h3>项目进度对比</h3><span class="sub">当前快照</span></div>' +
      (projects.length ? projects.map(function (p) {
        return '<div class="progress-row"><div class="pr-main"><div class="pr-title">' + esc(p.title) + '</div>' +
          '<div class="pr-sub">' + esc(p.kind) + ' · ' + esc(member(p.lead_id).name) + '</div></div>' +
          '<div class="pr-track">' + progressBar(p.progress) + '</div><div class="pr-num">' + (Number(p.progress) || 0) + '%</div></div>';
      }).join('') : empty('还没有项目', 'folder')) + '</div>' +
      '<div class="card">' + sectionHead('定期复盘记录', '量化进展，持续优化研究过程', addBtn('reviews', '新增复盘')) +
      (S.list('reviews').length ? S.list('reviews').map(function (r) {
        return '<div class="timeline-item" data-row-id="' + esc(r.id) + '"><span class="tl-dot"></span><div class="tl-main">' +
          '<div class="tl-head"><span class="strong">' + esc(r.period) + '</span><span class="small muted">' + fmt(r.created_at) + '</span><span class="tl-actions">' + rowActions('reviews', r) + '</span></div>' +
          '<div class="tl-body">' + esc(r.content) + '</div></div></div>';
      }).join('') : empty('暂无复盘记录', 'inbox')) + '</div></div>';
    return html;
  }

  /* ---------- 视图：成员与权限 ---------- */
  function viewMembers() {
    const workspace = S.workspace() || {}, me = AuthAdapter.current() || {};
    const invite = S.isOnline() ? '<div class="card invite block"><div><div class="strong">' + esc(workspace.name || '当前课题组') + '</div><div class="small muted">新成员注册时输入邀请码，就会进入同一个课题组。邀请码属于加入凭据，请通过可信渠道发送。</div></div>' +
      '<div class="invite-code"><span class="mono">' + esc(workspace.join_code || '—') + '</span><button type="button" class="btn btn-sm" data-action="copy-join-code">' + icon('copy', 14) + '复制</button>' +
      (S.can('manage') ? '<button type="button" class="btn btn-sm btn-ghost" data-action="rotate-join-code">更新邀请码</button>' : '') + '</div></div>' : '';
    const members = S.list('members');
    let html = sectionHead('成员与权限', S.isOnline() ? '成员通过邀请码加入课题组，PI 可停用或恢复成员账号' : '演示模式下可直接添加成员', S.isOnline() ? '' : addBtn('members', '添加成员')) + invite +
      '<div class="grid g2">' + members.map(function (m) {
        const own = S.list('projects').filter(function (p) { return p.lead_id === m.id; }).length;
        const doing = S.list('tasks').filter(function (t) { return t.assignee_id === m.id && t.status === 'doing'; }).length;
        const logs = S.list('logs').filter(function (l) { return l.author_id === m.id && diffDays(l.date) > -7 && diffDays(l.date) <= 0; }).length;
        const disabled = m.status === 'disabled', self = m.id === me.id;
        let action = '';
        if (!self && S.can('manage')) {
          action = S.isOnline() ? '<button type="button" class="btn btn-sm btn-ghost ' + (disabled ? '' : 'btn-danger') + '" data-action="member-status" data-id="' + esc(m.id) + '" data-status="' + (disabled ? 'active' : 'disabled') + '">' + (disabled ? '恢复' : '停用') + '</button>' :
            iconBtn('trash', '移除成员', 'data-action="del" data-collection="members" data-id="' + esc(m.id) + '"', 'danger');
        }
        return '<div class="card member-card ' + (disabled ? 'is-disabled' : '') + '"><div class="flex member-head">' + avatar(m, 44) +
          '<div class="lr-main"><div class="strong">' + esc(m.name) + (self ? '<span class="badge b-blue">我</span>' : '') + (m.role === 'pi' ? '<span class="badge b-purple">PI</span>' : '') + (disabled ? '<span class="badge b-gray">已停用</span>' : '') + '</div>' +
          '<div class="small muted">' + esc([m.academic_role || (m.role === 'pi' || m.role === 'member' ? '' : m.role), m.email].filter(Boolean).join(' · ')) + '</div></div>' + action + '</div>' +
          '<div class="member-stats">' +
          '<div><div class="stat-num">' + own + '</div><div class="small muted">负责项目</div></div>' +
          '<div><div class="stat-num">' + doing + '</div><div class="small muted">进行中任务</div></div>' +
          '<div><div class="stat-num">' + logs + '</div><div class="small muted">近 7 天上报</div></div></div></div>';
      }).join('') + '</div>';
    return html;
  }

  /* ---------- 视图：设置 ---------- */
  function viewSettings() {
    const cfg = S.aiConfig(), workspace = S.workspace() || {}, manage = S.can('manage');
    const N = window.LabNotifications, nStatus = N ? N.status() : 'unsupported', prefs = N ? N.prefs() : {};
    const nText = { unsupported: '当前浏览器不支持通知', denied: '浏览器已拒绝通知权限，请在地址栏的网站设置中重新允许', enabled: '已开启', off: '未开启' }[nStatus];
    const toggle = function (key, label, hint) {
      return '<label class="switch"><input type="checkbox" data-action="notif-pref" data-key="' + key + '" ' + (prefs[key] !== false ? 'checked' : '') + ' ' + (nStatus === 'enabled' ? '' : 'disabled') + '><span class="sw-track"></span>' +
        '<span class="sw-text"><strong>' + label + '</strong><small>' + hint + '</small></span></label>';
    };
    const providers = ['国模', 'DeepSeek', '通义千问', '智谱', '自定义'];
    return '<div class="grid g2">' +
      '<div class="stack">' +
      '<div class="card">' + sectionHead('课题组', '名称与校徽对课题组全体成员生效') +
        '<div class="form-grid"><label class="field full"><span>课题组名称</span><input type="text" id="ws-name" maxlength="80" value="' + esc(workspace.name || (S.isOnline() ? '' : '智能感知与分子设计实验室')) + '" ' + (manage ? '' : 'disabled') + '></label></div>' +
        '<div class="workspace-school">' + Branding.pickerHTML('ws', workspace, !manage) + '</div>' +
        '<div class="form-actions">' + (manage ? '<span class="grow"></span><button type="button" class="btn btn-primary" data-action="save-workspace">保存课题组信息</button>' : '<span class="small muted">仅 PI 可以修改课题组信息</span>') + '</div></div>' +
      '<div class="card">' + sectionHead('AI 服务', '配置用于整理日报和周报的模型接口') +
      '<div class="form-grid">' +
      '<label class="field"><span>服务商</span><select id="ai-provider" ' + (manage ? '' : 'disabled') + '>' + providers.concat(providers.indexOf(cfg.provider) < 0 && cfg.provider ? [cfg.provider] : []).map(function (p) {
        return '<option ' + (cfg.provider === p ? 'selected' : '') + '>' + esc(p) + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>模型名</span><input type="text" id="ai-model" value="' + esc(cfg.model) + '" ' + (manage ? '' : 'disabled') + '></label>' +
      '<label class="field full"><span>API 地址</span><input type="text" id="ai-base" placeholder="https://api.example.com/v1" value="' + esc(cfg.baseUrl) + '" ' + (manage ? '' : 'disabled') + '></label>' +
      '<label class="field full"><span>请求路径</span><input type="text" id="ai-chat-path" value="' + esc(cfg.chatPath || '/chat/completions') + '" ' + (manage ? '' : 'disabled') + '><small class="field-hint">OpenAI 兼容接口通常为 /chat/completions</small></label>' +
      '</div>' +
      '<div class="status-line">' + (S.isOnline() ? (cfg.configured ? '<span class="badge b-green">已配置</span>' : '<span class="badge b-amber">尚未配置完整</span>') + '<span class="small muted">API Key 由服务器管理员在 .env 中配置，不会通过网页传输。</span>' :
        '<span class="badge b-gray">演示模式</span><span class="small muted">当前使用本地演示生成器，不会调用任何模型。</span>') + '</div>' +
      '<div class="form-actions">' + (manage ? '<span class="grow"></span><button type="button" class="btn btn-primary" data-action="save-ai-config">保存 AI 配置</button>' : '<span class="small muted">仅 PI 可以修改 AI 配置</span>') + '</div></div>' +
      '<div class="card">' + sectionHead('AI 整理流程', '由成员确认后再更新项目数据') +
      '<ol class="steps"><li><strong>生成摘要</strong><span>根据工作内容整理日报或周报，并提出进度与任务建议。</span></li>' +
      '<li><strong>确认后保存</strong><span>成员检查 AI 建议后再保存，确认的进度和任务变化才会同步到工作台。</span></li>' +
      '<li><strong>复盘统计</strong><span>上报记录、标签与任务完成情况会进入「可视化复盘」。</span></li></ol></div>' +
      '</div>' +
      '<div class="stack">' +
      '<div class="card">' + sectionHead('外观', '深色模式适合夜间或暗光环境') +
      chips('set-theme', [{ label: '跟随系统', value: 'auto' }, { label: '浅色', value: 'light' }, { label: '深色', value: 'dark' }], Theme.mode()) + '</div>' +
      '<div class="card">' + sectionHead('电脑通知', '工作台页面打开时，由浏览器发出提醒',
        nStatus === 'enabled' ? '<button type="button" class="btn btn-sm" data-action="disable-notifications">关闭通知</button>' :
        '<button type="button" class="btn btn-sm btn-primary" data-action="enable-notifications" ' + (nStatus === 'unsupported' ? 'disabled' : '') + '>' + icon('bell', 14) + '开启通知</button>') +
      '<div class="status-line"><span class="badge ' + (nStatus === 'enabled' ? 'b-green' : nStatus === 'denied' ? 'b-red' : 'b-gray') + '">' + (nStatus === 'enabled' ? '已开启' : nStatus === 'denied' ? '权限被拒绝' : '未开启') + '</span>' +
      (nStatus === 'enabled' || nStatus === 'off' ? '' : '<span class="small muted">' + nText + '</span>') + '</div>' +
      '<div class="switch-list">' + toggle('evening_report', '晚间日报提醒', '20:00 后仍未上报时提醒') + toggle('morning_tasks', '早间任务提醒', '8:00–10:00 汇总当天待办') + toggle('overdue_tasks', '延期任务提醒', '有逾期未完成的任务时提醒') + '</div></div>' +
      '<div class="card">' + sectionHead('数据', S.isOnline() ? '导出当前账号可见的全部业务数据，用于留档或迁移' : '演示数据只保存在本机浏览器，可导出备份或导入恢复') +
      '<div class="form-actions wrap"><button type="button" class="btn" data-action="export-data">' + icon('download', 15) + '导出 JSON 备份</button>' +
      (!S.isOnline() ? '<button type="button" class="btn" data-action="import-data">' + icon('upload', 15) + '导入备份</button><input type="file" id="import-file" class="visually-hidden" accept=".json,application/json">' +
        '<span class="grow"></span><button type="button" class="btn btn-ghost btn-danger" data-action="reset-data">重置演示数据</button>' : '') + '</div></div>' +
      '</div></div>';
  }

  /* ---------- 表单 schema ---------- */
  const FORMS = {
    projects: { title: '论文 / 课题项目', fields: [
      { k: 'title', l: '项目名称', t: 'text', req: true },
      { k: 'kind', l: '类型', t: 'select', o: ['论文', '课题'], w: 'half' },
      { k: 'lead_id', l: '负责人', t: 'member', w: 'half' },
      { k: 'goal', l: '目标', t: 'text', ph: '例如：投 NeurIPS 2027' },
      { k: 'start_date', l: '开始日期', t: 'date', w: 'half' },
      { k: 'deadline', l: '关键节点', t: 'date', w: 'half', def: function () { return shift(90); } },
      { k: 'progress', l: '当前进度 (%)', t: 'number', min: 0, max: 100, w: 'half' },
      { k: 'notes', l: '关键成果与待办事项', t: 'textarea' }
    ] },
    tasks: { title: '科研任务', fields: [
      { k: 'title', l: '任务名称', t: 'text', req: true },
      { k: 'project_id', l: '关联项目', t: 'project' },
      { k: 'assignee_id', l: '负责人', t: 'member', w: 'half' },
      { k: 'due_date', l: '截止日期', t: 'date', w: 'half', def: function () { return shift(7); } },
      { k: 'priority', l: '优先级', t: 'select', o: ['高', '中', '低'], w: 'half', def: function () { return '中'; } },
      { k: 'status', l: '状态', t: 'select', o: ['todo', 'doing', 'done', 'delayed'], labels: ['待开始', '进行中', '已完成', '已延期'], w: 'half' }
    ] },
    experiments: { title: '实验记录', fields: [
      { k: 'title', l: '记录名称', t: 'text', req: true },
      { k: 'date', l: '实验日期', t: 'date', w: 'half' },
      { k: 'category', l: '实验类型', t: 'select', o: ['实验操作', '样品制备', '仪器表征', '数据验证', '方法开发', '其他'], w: 'half' },
      { k: 'project_id', l: '关联项目', t: 'project', w: 'half' },
      { k: 'task_id', l: '关联任务', t: 'task', w: 'half' },
      { k: 'hypothesis', l: '实验目的 / 假设', t: 'textarea' },
      { k: 'materials', l: '材料与设备', t: 'textarea' },
      { k: 'procedure', l: '实验步骤', t: 'textarea' },
      { k: 'observations', l: '观察记录', t: 'textarea' },
      { k: 'results', l: '实验结果', t: 'textarea' },
      { k: 'conclusion', l: '结论', t: 'textarea' },
      { k: 'next_steps', l: '后续计划', t: 'textarea' }
    ] },
    papers: { title: '文献', fields: [
      { k: 'title', l: '标题', t: 'text', req: true },
      { k: 'authors', l: '作者', t: 'text', w: 'half' },
      { k: 'year', l: '年份', t: 'number', min: 0, max: 2100, w: 'half', def: function () { return new Date().getFullYear(); } },
      { k: 'venue', l: '期刊 / 会议', t: 'text', w: 'half' },
      { k: 'read_state', l: '阅读状态', t: 'select', o: ['待读', '略读', '精读'], w: 'half' },
      { k: 'url', l: '链接或 DOI', t: 'text', ph: 'https://… 或 10.xxxx/…' },
      { k: 'tags', l: '标签（逗号分隔）', t: 'text' },
      { k: 'project_id', l: '关联项目', t: 'project', w: 'half' },
      { k: 'rating', l: '评分 0-5', t: 'number', min: 0, max: 5, w: 'half' },
      { k: 'note', l: '阅读笔记与摘要', t: 'textarea' }
    ] },
    events: { title: '日程', fields: [
      { k: 'title', l: '日程名称', t: 'text', req: true },
      { k: 'date', l: '日期', t: 'date', w: 'half' },
      { k: 'type', l: '类型', t: 'select', o: ['实验', '写作', '组会', '文献', '答辩'], w: 'half' },
      { k: 'project_id', l: '关联项目', t: 'project' }
    ] },
    analyses: { title: '分析记录', fields: [
      { k: 'title', l: '标题', t: 'text', req: true },
      { k: 'tool', l: '工具', t: 'select', o: ['Python', 'Stata', 'R'], w: 'half' },
      { k: 'project_id', l: '关联项目', t: 'project', w: 'half' },
      { k: 'dataset', l: '数据集', t: 'text', w: 'half' },
      { k: 'script', l: '脚本路径', t: 'text', w: 'half' },
      { k: 'result', l: '关键结论', t: 'textarea' }
    ] },
    reviews: { title: '复盘记录', fields: [
      { k: 'period', l: '周期', t: 'text', req: true, def: function () { return '第 ' + isoWeek(new Date()) + ' 周'; } },
      { k: 'content', l: '复盘内容', t: 'textarea' }
    ] },
    members: { title: '课题组成员', fields: [
      { k: 'name', l: '姓名', t: 'text', req: true },
      { k: 'role', l: '角色', t: 'text', w: 'half', ph: '例如：硕士生 · 一年级' },
      { k: 'email', l: '邮箱', t: 'text', w: 'half' }
    ] }
  };
  function openForm(collection, id, defaults) {
    const schema = FORMS[collection];
    if (!schema) return;
    const item = id ? S.find(collection, id) : (defaults || {});
    if (!item) return;
    const me = AuthAdapter.current() || {};
    const fields = schema.fields.map(function (f) {
      let v = item[f.k];
      if (v == null) v = f.def ? f.def() : (f.t === 'date' ? today() : (f.t === 'number' ? 0 : ''));
      if (Array.isArray(v)) v = v.join('，');
      let control = '';
      if (f.t === 'select') {
        control = '<select id="fld-' + f.k + '">' + f.o.map(function (o, i) {
          return '<option value="' + esc(o) + '" ' + (String(v) === String(o) ? 'selected' : '') + '>' + esc((f.labels && f.labels[i]) || o) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'member') {
        const chosen = v || me.id;
        control = '<select id="fld-' + f.k + '">' + S.list('members').filter(function (m) { return m.status !== 'disabled' || m.id === chosen; }).map(function (m) {
          return '<option value="' + esc(m.id) + '" ' + (chosen === m.id ? 'selected' : '') + '>' + esc(m.name) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'project') {
        control = '<select id="fld-' + f.k + '"><option value="">未关联</option>' + S.list('projects').map(function (p) {
          return '<option value="' + esc(p.id) + '" ' + (v === p.id ? 'selected' : '') + '>' + esc(p.title) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'task') {
        control = '<select id="fld-' + f.k + '"><option value="">未关联</option>' + S.list('tasks').map(function (t) {
          return '<option value="' + esc(t.id) + '" ' + (v === t.id ? 'selected' : '') + '>' + esc(t.title) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'textarea') {
        control = '<textarea id="fld-' + f.k + '" rows="3">' + esc(v) + '</textarea>';
      } else {
        control = '<input type="' + f.t + '" id="fld-' + f.k + '" value="' + esc(v) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') +
          (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.req ? ' required' : '') + '>';
      }
      return '<label class="field ' + (f.w === 'half' ? '' : 'full') + '"><span>' + esc(f.l) + (f.req ? '<i class="req">*</i>' : '') + '</span>' + control + '</label>';
    }).join('');
    showModal('<form class="modal-form" id="modal-form" data-collection="' + collection + '" data-id="' + esc(id || '') + '" novalidate>' +
      '<div class="modal-head"><h3>' + (id ? '编辑' : '新建') + schema.title + '</h3>' + iconBtn('close', '关闭', 'data-action="close-modal"') + '</div>' +
      '<div class="modal-body"><div class="form-grid">' + fields + '</div></div>' +
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">取消</button>' +
      '<button type="submit" class="btn btn-primary">保存</button></div></form>');
  }
  async function submitForm(form) {
    const collection = form.dataset.collection, id = form.dataset.id || null;
    const schema = FORMS[collection], obj = {};
    for (const f of schema.fields) {
      const el = form.querySelector('#fld-' + f.k);
      if (!el) continue;
      let v = el.value;
      if (f.t === 'text' || f.t === 'textarea') v = String(v).trim();
      if (f.req && !v) { toast('请填写「' + f.l + '」', 'error'); el.focus(); return; }
      if (f.t === 'number') { v = Number(v) || 0; if (f.min != null) v = Math.max(f.min, v); if (f.max != null) v = Math.min(f.max, v); }
      if (f.k === 'tags') v = String(v).split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean);
      obj[f.k] = v;
    }
    if (collection === 'projects' && !id) obj.milestones = [];
    if (collection === 'tasks' && !id) obj.completed_at = obj.status === 'done' ? new Date().toISOString() : null;
    if (collection === 'events' && !id) { obj.reminder = true; obj.done = false; }
    if (collection === 'analyses' && !id) obj.created_at = new Date().toISOString();
    if (collection === 'reviews' && !id) obj.created_at = new Date().toISOString();
    if (collection === 'members' && !id) { obj.color = paletteColor(); }
    if (collection === 'tasks' && id) {
      const prev = S.find('tasks', id);
      if (obj.status === 'done' && prev.status !== 'done') obj.completed_at = new Date().toISOString();
      if (obj.status !== 'done') obj.completed_at = null;
    }
    const button = form.querySelector('[type="submit"]');
    if (button) { button.disabled = true; button.textContent = '保存中…'; }
    let saved;
    try {
      saved = id ? await S.updateAsync(collection, id, obj) : await S.createAsync(collection, obj);
    } catch (err) {
      if (button) { button.disabled = false; button.textContent = '保存'; }
      toast('保存失败：' + (err && err.message ? err.message : '请重试'), 'error');
      return;
    }
    state.flashId = saved && saved.id;
    closeModal(); toast(id ? '已更新' : '已创建', 'success'); render();
  }
  function paletteColor() {
    const c = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#0EA5E9'];
    return c[S.list('members').length % c.length];
  }
  let modalReturnFocus = null;
  function showModal(inner) {
    modalReturnFocus = document.activeElement;
    document.getElementById('modal-root').innerHTML = '<div class="modal-mask" data-action="mask"><div class="modal" role="dialog" aria-modal="true">' + inner + '</div></div>';
    const first = document.querySelector('#modal-root input:not([type=hidden]), #modal-root textarea, #modal-root select');
    if (first) { first.focus(); if (first.select && first.type === 'text') first.select(); }
  }
  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
    modalReturnFocus = null;
  }
  function modalOpen() { return Boolean(document.getElementById('modal-root').firstChild); }

  /* ---------- 阶段任务 ---------- */
  function openMilestoneForm(projectId) {
    const p = project(projectId);
    if (!p) return;
    showModal('<form class="modal-form" id="milestone-form" data-id="' + esc(projectId) + '" novalidate>' +
      '<div class="modal-head"><h3>添加阶段任务</h3>' + iconBtn('close', '关闭', 'data-action="close-modal"') + '</div>' +
      '<div class="modal-body"><div class="small muted form-lead">' + esc(p.title) + '</div><div class="form-grid">' +
      '<label class="field full"><span>阶段名称<i class="req">*</i></span><input type="text" id="ms-title" maxlength="120" placeholder="例如：完成基线复现"></label>' +
      '<label class="field full"><span>计划完成日期</span><input type="date" id="ms-due" value="' + shift(14) + '"></label></div></div>' +
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">添加</button></div></form>');
  }
  function saveMilestones(projectId, change) {
    const p = project(projectId);
    if (!p) return;
    const list = arr(p.milestones).map(function (m) { return Object.assign({}, m); });
    change(list);
    list.sort(function (a, b) { return String(a.due || '9999').localeCompare(String(b.due || '9999')); });
    S.update('projects', projectId, { milestones: list });
    render();
  }

  /* ---------- 搜索与跳转 ---------- */
  const palette = { open: false, items: [], index: 0 };
  function jumpTo(view, id) {
    if (view === 'tasks') { state.taskQuery = ''; state.taskProject = ''; state.taskAssignee = ''; }
    if (view === 'papers') { state.paperQuery = ''; state.paperFilter = '全部'; }
    if (view === 'experiments') state.experimentQuery = '';
    if (view === 'projects') state.projectFilter = '全部';
    if (view === 'calendar') {
      const e = S.find('events', id);
      if (e && e.date) {
        const target = new Date(e.date + 'T00:00:00'); target.setDate(target.getDate() - (target.getDay() + 6) % 7);
        state.calMode = 'week'; state.calOffset = Math.round((target - startOfWeek(0)) / (7 * 86400000));
      }
    }
    state.flashId = id;
    setView(view);
  }
  function paletteItems(query) {
    const q = query.trim().toLowerCase(), out = [];
    const hit = function (text) { return String(text || '').toLowerCase().indexOf(q) >= 0; };
    const push = function (item) { out.push(item); };
    NAV.forEach(function (g) {
      g.items.forEach(function (it) {
        if (!q || hit(it.label) || hit(g.group)) push({ icon: it.icon, label: it.label, hint: '前往', run: function () { setView(it.id); } });
      });
    });
    [
      { label: '今日上报', icon: 'edit', run: goReport },
      { label: '新建任务', icon: 'plus', run: function () { setView('tasks'); openForm('tasks'); } },
      { label: '新建项目', icon: 'plus', run: function () { setView('projects'); openForm('projects'); } },
      { label: '添加文献', icon: 'plus', run: function () { setView('papers'); openForm('papers'); } },
      { label: '新建日程', icon: 'plus', run: function () { setView('calendar'); openForm('events'); } },
      { label: '新建实验记录', icon: 'plus', run: function () { setView('experiments'); openForm('experiments'); } },
      { label: Theme.isDark() ? '切换到浅色模式' : '切换到深色模式', icon: Theme.isDark() ? 'sun' : 'moon', run: function () { Theme.toggle(); } }
    ].forEach(function (a) { if (!q || hit(a.label)) push({ icon: a.icon, label: a.label, hint: '操作', run: a.run }); });
    if (!q) return out;
    const sources = [
      ['projects', 'projects', 'folder', '项目', function (p) { return [p.title, p.goal, p.notes]; }, function (p) { return p.kind + ' · 进度 ' + (Number(p.progress) || 0) + '%'; }],
      ['tasks', 'tasks', 'check', '任务', function (t) { return [t.title]; }, function (t) { return statusText(t.status) + ' · ' + member(t.assignee_id).name; }],
      ['papers', 'papers', 'book', '文献', function (p) { return [p.title, p.authors, arr(p.tags).join(' '), p.venue]; }, function (p) { return [p.authors, p.year].filter(Boolean).join(' · '); }],
      ['experiments', 'experiments', 'flask', '实验', function (r) { return [r.title, r.conclusion, r.results]; }, function (r) { return fmt(r.date || r.created_at); }],
      ['events', 'calendar', 'calendar', '日程', function (e) { return [e.title]; }, function (e) { return fmt(e.date) + ' · ' + e.type; }],
      ['analyses', 'analyses', 'chart', '分析', function (a) { return [a.title, a.dataset, a.script, a.result]; }, function (a) { return a.tool; }]
    ];
    sources.forEach(function (src) {
      S.list(src[0]).filter(function (row) { return src[4](row).some(hit); }).slice(0, 5).forEach(function (row) {
        push({ icon: src[2], label: row.title, sub: src[5](row), hint: src[3], run: function () { jumpTo(src[1], row.id); } });
      });
    });
    return out;
  }
  function renderPaletteList() {
    const list = document.getElementById('pal-list');
    if (!list) return;
    palette.items = paletteItems(val('pal-q'));
    palette.index = Math.min(palette.index, Math.max(0, palette.items.length - 1));
    list.innerHTML = palette.items.length ? palette.items.map(function (it, i) {
      return '<button type="button" class="pal-item ' + (i === palette.index ? 'active' : '') + '" role="option" aria-selected="' + (i === palette.index) + '" data-action="pal-run" data-index="' + i + '">' +
        '<span class="pal-icon">' + icon(it.icon, 16) + '</span><span class="pal-text"><span class="pal-label">' + esc(it.label) + '</span>' + (it.sub ? '<span class="pal-sub">' + esc(it.sub) + '</span>' : '') + '</span>' +
        '<span class="pal-hint">' + it.hint + '</span></button>';
    }).join('') : '<div class="empty">没有找到匹配的内容</div>';
    const active = list.querySelector('.pal-item.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() {
    closeSidebar();
    palette.open = true; palette.index = 0;
    document.getElementById('palette-root').innerHTML = '<div class="palette-mask" data-action="close-palette"><div class="palette" role="dialog" aria-modal="true" aria-label="搜索与跳转">' +
      '<div class="pal-input">' + icon('search', 18) + '<input type="text" id="pal-q" autocomplete="off" spellcheck="false" placeholder="搜索项目、任务、文献、实验记录，或输入页面名称" aria-label="搜索"><kbd>Esc</kbd></div>' +
      '<div class="pal-list" id="pal-list" role="listbox"></div>' +
      '<div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span></div></div></div>';
    renderPaletteList();
    document.getElementById('pal-q').focus();
  }
  function closePalette() { palette.open = false; document.getElementById('palette-root').innerHTML = ''; }
  function runPalette(index) {
    const item = palette.items[index];
    if (!item) return;
    closePalette();
    item.run();
  }

  /* ---------- AI 流程 ---------- */
  function readReport() {
    state.reportForm = { date: val('rf-date'), projectId: val('rf-project'), hours: val('rf-hours'), content: val('rf-content') };
    return state.reportForm;
  }
  function resetReport(projectId) {
    state.reportForm = { date: today(), projectId: projectId, hours: 6, content: '' };
  }
  function goReport() {
    setView('daily');
    const box = document.getElementById('rf-content');
    if (box) box.focus();
  }
  function validReport(f) {
    if (!f.content || f.content.trim().length < 8) { toast('请先填写今天做了什么（至少 8 个字）', 'error'); return false; }
    return true;
  }
  function generateAI() {
    const f = readReport();
    if (!validReport(f)) return;
    state.aiLoading = true; state.aiDraft = null; render();
    const payload = {
      date: f.date, member: AuthAdapter.current(), content: f.content.trim(), hours: Number(f.hours) || 0, projectId: f.projectId,
      context: { projects: S.list('projects'), tasks: S.list('tasks') }
    };
    const job = window.LabAI.summarize(payload);
    setTimeout(function () {
      Promise.resolve(job).then(function (res) {
        state.aiDraft = { payload: payload, res: res };
        state.aiLoading = false;
        render();
      }).catch(function (err) {
        state.aiLoading = false;
        render();
        toast('AI 汇总失败：' + (err && err.message ? err.message : '请检查服务端配置'), 'error');
      });
    }, 420);
  }
  function saveLogDirect() {
    const f = readReport(), me = AuthAdapter.current();
    if (!validReport(f) || !me) return;
    state.savingLog = true; render();
    Promise.resolve(S.createAsync('logs', {
      date: f.date || today(), author_id: me.id, project_id: f.projectId, content: f.content.trim(), hours: Number(f.hours) || 0,
      summary: null, applied: false, created_at: new Date().toISOString()
    })).then(function () {
      state.savingLog = false; state.aiDraft = null; resetReport(f.projectId);
      toast('已保存上报', 'success'); render();
    }).catch(function (err) {
      state.savingLog = false; render(); toast('保存上报失败：' + (err && err.message ? err.message : '请重试'), 'error');
    });
  }
  function localWeekly() {
    const logs = recentLogs().filter(function (l) { return diffDays(l.date) > -7 && diffDays(l.date) <= 0; });
    const hours = logs.reduce(function (n, l) { return n + (Number(l.hours) || 0); }, 0);
    return {
      summary: '本周共记录 ' + logs.length + ' 条日报，累计投入 ' + hours + ' 小时。', highlights: logs.slice(0, 5).map(function (l) { return l.content; }),
      blockers: [], nextSteps: ['继续按项目补充可量化结果，并在周报中确认下周目标。'], source: 'demo'
    };
  }
  function generateWeekly() {
    if (state.weeklyLoading) return;
    if (!S.isOnline()) { state.weeklyDraft = localWeekly(); render(); return; }
    state.weeklyLoading = true; state.weeklyDraft = null; render();
    S.weeklySummary({ period: today() }).then(function (result) {
      state.weeklyDraft = result; state.weeklyLoading = false; render();
    }).catch(function (err) {
      state.weeklyLoading = false; render(); toast('周报生成失败：' + (err && err.message ? err.message : '请重试'), 'error');
    });
  }
  function weeklyText(w) {
    const part = function (title, items) { return arr(items).length ? '\n\n' + title + '\n' + arr(items).map(function (x) { return '- ' + x; }).join('\n') : ''; };
    return weekPeriodLabel() + '\n\n' + (w.summary || '') + part('本周亮点', w.highlights) + part('阻塞点', w.blockers) + part('下周建议', w.nextSteps);
  }
  function saveWeekly() {
    const w = state.weeklyDraft;
    if (!w) return;
    const me = AuthAdapter.current() || {};
    Promise.resolve(S.createAsync('weekly_reports', { period: weekPeriodLabel(), content: w.summary || '', summary: w, created_by: me.id, created_at: new Date().toISOString() })).then(function () {
      state.weeklyDraft = null; toast('周报已存档', 'success'); render();
    }).catch(function (err) { toast('存档失败：' + (err && err.message ? err.message : '请重试'), 'error'); });
  }
  function applyAI() {
    const d = state.aiDraft;
    if (!d) return;
    if (S.isOnline()) {
      state.aiLoading = true; render();
      S.applyDailySummary(d.payload, d.res).then(function () {
        state.aiDraft = null; state.aiLoading = false;
        resetReport(d.payload.projectId);
        toast('已保存上报，并由服务器回写项目进度与任务状态', 'success'); render();
      }).catch(function (err) {
        state.aiLoading = false; render(); toast('保存上报失败：' + (err && err.message ? err.message : '请重试'), 'error');
      });
      return;
    }
    arr(d.res.taskUpdates).forEach(function (u) {
      S.update('tasks', u.taskId, { status: u.to, completed_at: u.to === 'done' ? new Date().toISOString() : null });
    });
    arr(d.res.progress).forEach(function (p) {
      const pr = S.find('projects', p.projectId);
      if (pr) S.update('projects', pr.id, { progress: Math.min(100, Math.max(0, Number(pr.progress) + Number(p.delta))) });
    });
    S.create('logs', {
      date: d.payload.date, author_id: d.payload.member.id, project_id: d.payload.projectId,
      content: d.payload.content, hours: d.payload.hours, summary: d.res, applied: true, created_at: new Date().toISOString()
    });
    state.aiDraft = null;
    resetReport(d.payload.projectId);
    toast('已保存上报，并回写项目进度与任务状态', 'success');
    render();
  }

  /* ---------- 渲染 ---------- */
  const VIEWS = {
    overview: viewOverview, daily: viewDaily, projects: viewProjects, tasks: viewTasks,
    experiments: viewExperiments, papers: viewPapers, calendar: viewCalendar, analyses: viewAnalyses, reviews: viewReviews,
    members: viewMembers, settings: viewSettings
  };
  function render() {
    const root = document.getElementById('view');
    // 重绘会替换输入框：记住焦点与光标位置，搜索时才能连续输入
    const active = document.activeElement;
    const keep = active && active.id && root.contains(active) ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
    Charts.reset();
    renderBrand(); renderNav(); renderMemberSwitch(); renderTopbar();
    root.innerHTML = (VIEWS[state.view] || viewOverview)();
    if (state.view === 'settings') Branding.mount(root, S.workspace());
    root.dataset.view = state.view;
    if (state.renderedView !== state.view) {
      root.classList.remove('view-enter'); void root.offsetWidth; root.classList.add('view-enter');
      state.renderedView = state.view;
    }
    Charts.mount(root);
    if (keep) {
      const el = document.getElementById(keep.id);
      if (el) { el.focus(); try { el.setSelectionRange(keep.start, keep.end); } catch (_) { /* date、number 等输入框不支持选区 */ } }
    }
    if (state.flashId) {
      const target = Array.prototype.find.call(root.querySelectorAll('[data-row-id]'), function (el) { return el.dataset.rowId === state.flashId; });
      state.flashId = null;
      if (target) { target.classList.add('flash'); if (target.scrollIntoView) target.scrollIntoView({ block: 'center' }); }
    }
  }
  function openSidebar() { document.getElementById('app').classList.add('nav-open'); }
  function closeSidebar() { document.getElementById('app').classList.remove('nav-open'); }
  function setView(v) {
    if (!TITLES[v]) return;
    closeSidebar();
    const changed = state.view !== v;
    state.view = v;
    if (location.hash !== '#/' + v) location.hash = '#/' + v;
    render();
    if (changed && !state.flashId) window.scrollTo(0, 0);
  }
  async function uploadExperimentFiles(input) {
    const experimentId = input.dataset.experimentId;
    const files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!files.length) return;
    let uploaded = 0, failed = [];
    toast('正在上传 ' + files.length + ' 个附件…');
    for (const file of files) {
      try { await S.uploadAttachment(experimentId, file); uploaded++; }
      catch (err) { failed.push(file.name + '：' + err.message); }
    }
    try { await S.refresh(); } catch (_) {}
    render();
    if (failed.length) toast(uploaded ? '已上传 ' + uploaded + ' 个，失败 ' + failed.length + ' 个' : failed[0], 'error');
    else toast('已上传 ' + uploaded + ' 个附件', 'success');
  }
  async function downloadExperimentFile(button) {
    try {
      const blob = await S.downloadAttachment(button.dataset.experimentId, button.dataset.attachmentId);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = button.dataset.filename || '实验附件';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (err) { toast('下载失败：' + err.message, 'error'); }
  }
  function moveTask(id, status) {
    const t = S.find('tasks', id);
    if (!t || t.status === status) return;
    if (!canEdit('tasks', t)) { toast('只能调整自己负责或创建的任务', 'error'); return; }
    S.update('tasks', t.id, { status: status, completed_at: status === 'done' ? new Date().toISOString() : null });
    state.flashId = t.id;
    toast('已移到「' + statusText(status) + '」', 'success'); render();
  }
  const RECORD_NAMES = { projects: '项目', tasks: '任务', papers: '文献', events: '日程', analyses: '分析记录', experiments: '实验记录', reviews: '复盘记录', logs: '上报记录', weekly_reports: '周报存档', members: '成员' };
  function removeRecord(c, id) {
    const row = S.find(c, id);
    if (!row) return;
    if (c === 'members' && id === (AuthAdapter.current() || {}).id) { toast('不能移除当前登录成员', 'error'); return; }
    const name = String(row.title || row.period || row.name || '').slice(0, 30);
    let body = '此操作不可撤销。';
    if (c === 'projects') {
      const linked = S.list('tasks').filter(function (t) { return t.project_id === id; }).length;
      if (linked) body = '该项目下还有 ' + linked + ' 项任务，删除后它们会显示为「未关联项目」。此操作不可撤销。';
    }
    if (c === 'logs') body = '删除上报记录不会撤回已经回写的项目进度与任务状态。此操作不可撤销。';
    if (c === 'experiments' && arr(row.attachments).length) body = '这条记录的 ' + row.attachments.length + ' 个附件会一并删除。此操作不可撤销。';
    confirmDialog({ title: '删除' + RECORD_NAMES[c] + (name ? '「' + name + '」' : '') + '？', body: body, okText: '删除', danger: true }).then(function (ok) {
      if (!ok) return;
      if (c === 'experiments') {
        S.removeAsync(c, id).then(function () { return S.refresh(); }).then(function () { toast('已删除', 'success'); render(); }).catch(function (err) { toast('删除失败：' + err.message, 'error'); });
      } else { S.remove(c, id); toast('已删除', 'success'); render(); }
    });
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'mask') { if (e.target === el) closeModal(); return; }
    if (a === 'close-modal') { closeModal(); return; }
    if (a === 'close-palette') { if (e.target === el) closePalette(); return; }
    if (a === 'open-palette') { openPalette(); return; }
    if (a === 'pal-run') { runPalette(Number(el.dataset.index)); return; }
    if (a === 'open-sidebar') { openSidebar(); return; }
    if (a === 'close-sidebar') { closeSidebar(); return; }
    if (a === 'toggle-theme') { Theme.toggle(); return; }
    if (a === 'set-theme') { Theme.set(el.dataset.value); render(); return; }
    if (a === 'nav') { setView(el.dataset.view); return; }
    if (a === 'go-report') { goReport(); return; }
    if (a === 'new') {
      const defaults = {};
      if (el.dataset.date) defaults.date = el.dataset.date;
      if (el.dataset.status) defaults.status = el.dataset.status;
      if (el.dataset.collection === 'tasks' && state.taskProject) defaults.project_id = state.taskProject;
      openForm(el.dataset.collection, null, defaults); return;
    }
    if (a === 'edit') { openForm(el.dataset.collection, el.dataset.id); return; }
    if (a === 'pick-experiment-files') { const input = document.getElementById(el.dataset.inputId); if (input) input.click(); return; }
    if (a === 'download-experiment-file') { downloadExperimentFile(el); return; }
    if (a === 'delete-experiment-file') {
      confirmDialog({ title: '移除这个附件？', body: '附件文件会从服务器删除，此操作不可撤销。', okText: '移除', danger: true }).then(function (ok) {
        if (!ok) return;
        S.removeAttachment(el.dataset.experimentId, el.dataset.attachmentId).then(function () {
          return S.refresh();
        }).then(function () { render(); toast('附件已移除', 'success'); }).catch(function (err) { toast('移除失败：' + err.message, 'error'); });
      });
      return;
    }
    if (a === 'del') { removeRecord(el.dataset.collection, el.dataset.id); return; }
    if (a === 'advance-task') {
      const t = S.find('tasks', el.dataset.id);
      if (!t) return;
      const next = { todo: 'doing', doing: 'done', delayed: 'doing', done: 'done' }[t.status];
      if (next === t.status) { toast('任务已完成'); return; }
      S.update('tasks', t.id, { status: next, completed_at: next === 'done' ? new Date().toISOString() : null });
      toast('已推进为「' + statusText(next) + '」', 'success'); render(); return;
    }
    if (a === 'task-clear') { state.taskQuery = ''; state.taskProject = ''; state.taskAssignee = ''; render(); return; }
    if (a === 'project-filter') { state.projectFilter = el.dataset.value; render(); return; }
    if (a === 'project-tasks') { state.taskQuery = ''; state.taskAssignee = ''; state.taskProject = el.dataset.id; setView('tasks'); return; }
    if (a === 'add-milestone') { openMilestoneForm(el.dataset.id); return; }
    if (a === 'del-milestone') {
      const index = Number(el.dataset.index), p = project(el.dataset.id);
      const m = p && arr(p.milestones)[index];
      if (!m) return;
      confirmDialog({ title: '移除阶段「' + String(m.title || '').slice(0, 30) + '」？', okText: '移除', danger: true }).then(function (ok) {
        if (ok) saveMilestones(el.dataset.id, function (list) { list.splice(index, 1); });
      });
      return;
    }
    if (a === 'paper-filter') { state.paperFilter = el.dataset.value; render(); return; }
    if (a === 'rate-paper') {
      const p = S.find('papers', el.dataset.id), value = Number(el.dataset.value);
      if (p) { S.update('papers', p.id, { rating: Number(p.rating) === value ? 0 : value }); render(); }
      return;
    }
    if (a === 'export-papers') { exportPapersCsv(); toast('已导出文献库', 'success'); return; }
    if (a === 'cal-prev') { state.calOffset--; render(); return; }
    if (a === 'cal-next') { state.calOffset++; render(); return; }
    if (a === 'cal-today') { state.calOffset = 0; render(); return; }
    if (a === 'cal-mode') { if (state.calMode !== el.dataset.value) { state.calMode = el.dataset.value; state.calOffset = 0; render(); } return; }
    if (a === 'log-scope') { state.logScope = el.dataset.value; state.logLimit = 8; readReport(); render(); return; }
    if (a === 'more-logs') { state.logLimit += 10; readReport(); render(); return; }
    if (a === 'insert-template') {
      const box = document.getElementById('rf-content');
      if (!box) return;
      const template = '完成内容：\n关键结果：\n遇到的问题：\n明日计划：';
      box.value = box.value.trim() ? box.value.replace(/\s+$/, '') + '\n\n' + template : template;
      readReport(); box.focus(); return;
    }
    if (a === 'generate-ai') { generateAI(); return; }
    if (a === 'save-log') { saveLogDirect(); return; }
    if (a === 'weekly-summary') { readReport(); generateWeekly(); return; }
    if (a === 'weekly-copy') {
      if (state.weeklyDraft) copyText(weeklyText(state.weeklyDraft)).then(function () { toast('周报已复制到剪贴板', 'success'); }).catch(function (err) { toast(err.message, 'error'); });
      return;
    }
    if (a === 'weekly-save') { readReport(); saveWeekly(); return; }
    if (a === 'weekly-close') { readReport(); state.weeklyDraft = null; render(); return; }
    if (a === 'apply-ai') { applyAI(); return; }
    if (a === 'discard-ai') { state.aiDraft = null; render(); return; }
    if (a === 'save-ai-config') {
      Promise.resolve(S.setAiConfig({ provider: val('ai-provider'), baseUrl: val('ai-base').trim(), chatPath: val('ai-chat-path').trim(), model: val('ai-model').trim() })).then(function () {
        toast('AI 配置已保存', 'success'); render();
      }).catch(function (err) { toast('设置保存失败：' + err.message, 'error'); });
      return;
    }
    if (a === 'save-workspace') {
      const name = val('ws-name').trim();
      if (name.length < 2) { toast('课题组名称至少需要 2 个字符', 'error'); return; }
      let school;
      try { school = Branding.readPicker(document.getElementById('view')); }
      catch (err) { toast(err.message, 'error'); return; }
      const previousSchool = JSON.stringify(Branding.schoolFields(S.workspace()));
      el.disabled = true;
      S.setWorkspace(Object.assign({ name: name }, school)).then(function (workspace) {
        if (S.isOnline() && previousSchool !== JSON.stringify(Branding.schoolFields(workspace))) {
          window.location.reload(); return;
        }
        toast('课题组信息已更新', 'success'); render();
      }).catch(function (err) { el.disabled = false; toast('保存失败：' + err.message, 'error'); });
      return;
    }
    if (a === 'copy-join-code') {
      copyText(String((S.workspace() || {}).join_code || '')).then(function () { toast('邀请码已复制', 'success'); }).catch(function (err) { toast(err.message, 'error'); });
      return;
    }
    if (a === 'rotate-join-code') {
      if (!S.can('manage')) return;
      confirmDialog({ title: '更新邀请码？', body: '更新后旧邀请码立即失效，尚未注册的成员需要使用新邀请码。', okText: '更新' }).then(function (ok) {
        if (!ok) return;
        S.request('/api/workspace/join-code/rotate', { method: 'POST' }).then(function (out) {
          const current = S.getState();
          current.workspace = out.workspace;
          toast('邀请码已更新', 'success'); render();
        }).catch(function (err) { toast('更新失败：' + err.message, 'error'); });
      });
      return;
    }
    if (a === 'member-status') {
      const m = S.member(el.dataset.id), next = el.dataset.status;
      if (!m || !S.can('manage')) return;
      const apply = function () {
        S.updateAsync('members', m.id, { status: next }).then(function () { toast(next === 'disabled' ? '已停用 ' + m.name : '已恢复 ' + m.name, 'success'); render(); })
          .catch(function (err) { toast('操作失败：' + err.message, 'error'); });
      };
      if (next !== 'disabled') { apply(); return; }
      confirmDialog({ title: '停用成员「' + m.name + '」？', body: '停用后该成员无法登录，已有的项目、任务和上报记录会保留，之后可以随时恢复。', okText: '停用', danger: true }).then(function (ok) { if (ok) apply(); });
      return;
    }
    if (a === 'enable-notifications') {
      if (!window.LabNotifications) return;
      window.LabNotifications.enable().then(function () { toast('电脑通知已开启', 'success'); render(); }).catch(function (err) { toast(err.message || '通知开启失败', 'error'); render(); });
      return;
    }
    if (a === 'disable-notifications') {
      if (window.LabNotifications) { window.LabNotifications.disable(); toast('已关闭电脑通知'); render(); }
      return;
    }
    if (a === 'export-data') {
      downloadText('课题组工作台备份-' + today() + '.json', JSON.stringify(S.exportData(), null, 2), 'application/json');
      toast('备份文件已导出', 'success'); return;
    }
    if (a === 'import-data') { const input = document.getElementById('import-file'); if (input) input.click(); return; }
    if (a === 'logout') {
      confirmDialog({ title: '退出登录？', okText: '退出' }).then(function (ok) {
        if (ok) AuthAdapter.signOut().then(function () { window.location.reload(); }).catch(function () { toast('退出登录失败', 'error'); });
      });
      return;
    }
    if (a === 'reset-data') {
      confirmDialog({ title: '重置演示数据？', body: '会清空本机所有新增与修改的数据，恢复初始演示数据。', okText: '重置', danger: true }).then(function (ok) {
        if (!ok) return;
        S.reset(); state.aiDraft = null; state.reportForm = null; state.weeklyDraft = null; toast('已重置演示数据', 'success'); render();
      });
      return;
    }
  });
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (form.id === 'modal-form') { e.preventDefault(); submitForm(form); return; }
    if (form.id === 'milestone-form') {
      e.preventDefault();
      const title = val('ms-title').trim(), due = val('ms-due');
      if (!title) { toast('请填写阶段名称', 'error'); document.getElementById('ms-title').focus(); return; }
      closeModal();
      saveMilestones(form.dataset.id, function (list) { list.push({ title: title, due: due, done: false }); });
      toast('已添加阶段任务', 'success');
    }
  });
  document.addEventListener('change', function (e) {
    const t = e.target;
    if (t.classList.contains('experiment-file-input')) { uploadExperimentFiles(t); return; }
    if (t.id === 'user-select') { AuthAdapter.switchTo(t.value); toast('已切换为 ' + AuthAdapter.current().name); render(); return; }
    if (t.id === 'import-file') {
      const file = t.files && t.files[0];
      if (!file) return;
      file.text().then(function (text) {
        S.importData(JSON.parse(text));
        state.aiDraft = null; state.reportForm = null; state.weeklyDraft = null;
        toast('已导入备份数据', 'success'); render();
      }).catch(function (err) { toast('导入失败：' + (err instanceof SyntaxError ? '不是有效的 JSON 文件' : err.message), 'error'); });
      return;
    }
    if (t.classList.contains('paper-state')) { S.update('papers', t.dataset.id, { read_state: t.value }); toast('阅读状态已更新', 'success'); render(); return; }
    if (t.dataset.action === 'toggle-event') { S.update('events', t.dataset.id, { done: t.checked }); render(); return; }
    if (t.dataset.action === 'toggle-milestone') {
      const index = Number(t.dataset.index), checked = t.checked;
      saveMilestones(t.dataset.id, function (list) { if (list[index]) list[index].done = checked; });
      return;
    }
    if (t.dataset.action === 'notif-pref') { if (window.LabNotifications) window.LabNotifications.setPref(t.dataset.key, t.checked); return; }
    if (t.dataset.state && t.tagName === 'SELECT') { state[t.dataset.state] = t.value; render(); return; }
  });
  /* 搜索框：输入法组词期间不重绘，否则拼音会被打断 */
  function onSearchInput(e) {
    const t = e.target;
    if (t.id === 'pal-q') { if (!e.isComposing) { palette.index = 0; renderPaletteList(); } return true; }
    if (t.dataset && t.dataset.state && t.tagName === 'INPUT') {
      if (!e.isComposing) { state[t.dataset.state] = t.value; render(); }
      return true;
    }
    return false;
  }
  document.addEventListener('input', function (e) {
    if (onSearchInput(e)) return;
    if (e.target.id === 'rf-content' || e.target.id === 'rf-date' || e.target.id === 'rf-hours' || e.target.id === 'rf-project') readReport();
  });
  document.addEventListener('compositionend', function (e) { onSearchInput({ target: e.target, isComposing: false }); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key || '').toLowerCase() === 'k') { e.preventDefault(); if (palette.open) closePalette(); else openPalette(); return; }
    if (palette.open) {
      if (e.isComposing) return;
      if (e.key === 'Escape') { closePalette(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = palette.items.length;
        if (n) { palette.index = (palette.index + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; renderPaletteList(); }
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); runPalette(palette.index); }
      return;
    }
    if (e.key === 'Escape') { if (modalOpen()) closeModal(); else closeSidebar(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '/' && !typing && !modalOpen() && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openPalette(); }
  });

  /* 看板拖拽 */
  let dragId = null;
  function clearDrop() { document.querySelectorAll('.board-col.drop').forEach(function (c) { c.classList.remove('drop'); }); }
  document.addEventListener('dragstart', function (e) {
    const card = e.target.closest ? e.target.closest('.board-card[draggable]') : null;
    if (!card) return;
    dragId = card.dataset.rowId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
    setTimeout(function () { card.classList.add('dragging'); }, 0);
  });
  document.addEventListener('dragover', function (e) {
    if (!dragId) return;
    const col = e.target.closest ? e.target.closest('.board-col') : null;
    if (!col) { clearDrop(); return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!col.classList.contains('drop')) { clearDrop(); col.classList.add('drop'); }
  });
  document.addEventListener('drop', function (e) {
    if (!dragId) return;
    const col = e.target.closest ? e.target.closest('.board-col') : null;
    if (!col) return;
    e.preventDefault();
    const id = dragId;
    dragId = null; clearDrop();
    moveTask(id, col.dataset.status);
  });
  document.addEventListener('dragend', function () {
    dragId = null; clearDrop();
    document.querySelectorAll('.board-card.dragging').forEach(function (c) { c.classList.remove('dragging'); });
  });

  window.addEventListener('hashchange', function () {
    const v = viewFromHash();
    if (v === state.view) return;
    state.view = v; closeSidebar(); closePalette(); render(); window.scrollTo(0, 0);
  });
  document.getElementById('quick-report').addEventListener('click', goReport);
  Theme.onChange(renderChrome);
  S.onError(function (err) {
    toast('同步失败：' + (err && err.message ? err.message : '请检查网络后重试'), 'error');
    render();
  });

  renderChrome();
  render();
  if (window.LabNotifications) window.LabNotifications.check();
  }
  S.init().then(boot).catch(function (err) {
    const root = document.getElementById('view');
    if (root) { root.textContent = '工作台加载失败：' + (err && err.message ? err.message : '请刷新重试'); root.className = 'view empty'; }
  });
})();
