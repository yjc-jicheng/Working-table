/* 课题组工作台主界面 */
(function () {
  'use strict';
  const S = window.LabStore;
  function boot() {
    if (S.isOnline() && !S.isAuthenticated()) {
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
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>'
  };
  function icon(n, size) {
    return '<svg class="ni-icon" width="' + (size || 17) + '" height="' + (size || 17) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || ICONS.home) + '</svg>';
  }

  /* ---------- 通用工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function iso(d) {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function today() { return iso(new Date()); }
  function shift(n) { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function fmt(s) { if (!s) return '—'; const p = String(s).slice(0, 10).split('-'); return p.length < 3 ? s : (+p[1]) + '月' + (+p[2]) + '日'; }
  function diffDays(s) { if (!s) return 999; return Math.round((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000); }
  function member(id) { return S.member(id) || { name: '未指派', color: '#B8BFCC' }; }
  function project(id) { return S.find('projects', id); }
  function projectTitle(id) { const p = project(id); return p ? p.title : '未关联项目'; }
  function avatar(m, size) {
    const sz = size || 26;
    return '<span class="avatar" style="width:' + sz + 'px;height:' + sz + 'px;flex:0 0 ' + sz + 'px;background:' + m.color + '">' + esc(String(m.name || '?').slice(0, 1)) + '</span>';
  }
  function val(id) { const e = document.getElementById(id); return e ? e.value : ''; }
  function statusText(s) { return { todo: '待开始', doing: '进行中', done: '已完成', delayed: '已延期' }[s] || s; }
  function statusBadge(s) {
    const map = { todo: 'b-gray', doing: 'b-blue', done: 'b-green', delayed: 'b-red' };
    return '<span class="badge ' + map[s] + '">' + statusText(s) + '</span>';
  }
  function priorityBadge(p) {
    const map = { '高': 'b-red', '中': 'b-amber', '低': 'b-gray' };
    return '<span class="badge ' + (map[p] || 'b-gray') + '">' + esc(p) + '</span>';
  }
  function toast(msg) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  /* ---------- 图表（原生 SVG，零依赖） ---------- */
  function lineChart(values, labels, color, height) {
    const w = 560, h = height || 150, pl = 28, pr = 12, pt = 14, pb = 24;
    const max = Math.max.apply(null, values.concat([1]));
    const iw = w - pl - pr, ih = h - pt - pb;
    const pts = values.map(function (v, i) {
      return [pl + (values.length === 1 ? iw / 2 : i * iw / (values.length - 1)), pt + ih - (v / max) * ih];
    });
    const line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pt + ih) + ' L' + pts[0][0].toFixed(1) + ' ' + (pt + ih) + ' Z';
    let grid = '';
    for (let g = 0; g <= 2; g++) {
      const y = pt + ih * g / 2;
      grid += '<line x1="' + pl + '" y1="' + y + '" x2="' + (w - pr) + '" y2="' + y + '" stroke="#EDF0F6" stroke-width="1"/>';
      grid += '<text x="' + (pl - 7) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#A0A8B8">' + Math.round(max * (1 - g / 2)) + '</text>';
    }
    const dots = pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#fff" stroke="' + color + '" stroke-width="1.6"/>'; }).join('');
    const xl = labels.map(function (l, i) {
      if (i % Math.ceil(labels.length / 7) !== 0 && i !== labels.length - 1) return '';
      return '<text x="' + pts[i][0].toFixed(1) + '" y="' + (h - 5) + '" text-anchor="middle" font-size="10" fill="#A0A8B8">' + esc(l) + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" role="img" aria-label="趋势折线图">' + grid +
      '<path d="' + area + '" fill="' + color + '" opacity="0.09"/><path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots + xl + '</svg>';
  }
  function barChart(values, labels, color, height) {
    const w = 560, h = height || 150, pl = 28, pr = 12, pt = 14, pb = 24;
    const max = Math.max.apply(null, values.concat([1]));
    const iw = w - pl - pr, ih = h - pt - pb;
    const bw = Math.min(30, iw / values.length * 0.55);
    let out = '';
    for (let g = 0; g <= 2; g++) {
      const y = pt + ih * g / 2;
      out += '<line x1="' + pl + '" y1="' + y + '" x2="' + (w - pr) + '" y2="' + y + '" stroke="#EDF0F6"/>' +
        '<text x="' + (pl - 7) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#A0A8B8">' + Math.round(max * (1 - g / 2)) + '</text>';
    }
    values.forEach(function (v, i) {
      const x = pl + iw * (i + 0.5) / values.length;
      const bh = (v / max) * ih;
      out += '<rect x="' + (x - bw / 2).toFixed(1) + '" y="' + (pt + ih - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, bh).toFixed(1) + '" rx="4" fill="' + color + '" opacity="0.85"/>';
      out += '<text x="' + x.toFixed(1) + '" y="' + (h - 5) + '" text-anchor="middle" font-size="10" fill="#A0A8B8">' + esc(labels[i]) + '</text>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" role="img" aria-label="柱状图">' + out + '</svg>';
  }
  function donutChart(segments, centerLabel) {
    const size = 150, r = 54, cx = 75, cy = 75, sw = 17;
    const total = segments.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    let angle = -Math.PI / 2, out = '';
    segments.forEach(function (s) {
      const a2 = angle + (s.value / total) * Math.PI * 2;
      const large = (a2 - angle) > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      if (s.value > 0) out += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" fill="none" stroke="' + s.color + '" stroke-width="' + sw + '" stroke-linecap="butt"/>';
      angle = a2;
    });
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - sw / 2) + '" fill="#fff"/>';
    out += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="21" font-weight="600" fill="#1C2333">' + esc(centerLabel) + '</text>';
    out += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="10" fill="#818BA1">总计</text>';
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="150" height="150" role="img" aria-label="占比环形图">' + out + '</svg>';
  }
  function legend(segments) {
    return '<div class="flex" style="flex-wrap:wrap;gap:12px;margin-top:8px">' + segments.map(function (s) {
      return '<span class="flex small muted"><span style="width:9px;height:9px;border-radius:2px;background:' + s.color + '"></span>' + esc(s.label) + ' ' + s.value + '</span>';
    }).join('') + '</div>';
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
  function weekLabel(offset) {
    const d = new Date(); d.setDate(d.getDate() + offset * 7);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }
  function startOfWeek(offset) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const wd = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - wd + offset * 7);
    return d;
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
      { id: 'settings', label: 'AI 设置', icon: 'settings' }
    ] }
  ];
  const TITLES = {
    overview: ['工作区', '总览'], daily: ['工作区', '每日上报'],
    projects: ['研究管理', '论文项目管理'], tasks: ['研究管理', '科研任务看板'],
    experiments: ['研究管理', '实验记录'],
    papers: ['研究管理', '文献管理'], calendar: ['研究管理', '科研日历'],
    analyses: ['数据与复盘', '数据分析'], reviews: ['数据与复盘', '可视化复盘'],
    members: ['课题组', '成员与权限'], settings: ['课题组', 'AI 设置']
  };

  const state = {
    view: (location.hash || '').replace('#/', '') || 'overview',
    calOffset: 0,
    paperFilter: '全部',
    paperQuery: '',
    experimentQuery: '',
    reportForm: null,
    aiDraft: null,
    aiLoading: false,
    weeklyDraft: null,
    weeklyLoading: false
  };
  if (!TITLES[state.view]) state.view = 'overview';

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
          const c = navCount(it.id);
          return '<button class="nav-item ' + (state.view === it.id ? 'active' : '') + '" data-action="nav" data-view="' + it.id + '">' + icon(it.icon) + '<span>' + it.label + '</span>' +
            (c !== null ? '<span class="ni-count">' + c + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    }).join('');
  }
  function renderMemberSwitch() {
    const me = AuthAdapter.current();
    if (!me) { document.getElementById('member-switch').innerHTML = ''; return; }
    const online = S.isOnline();
    document.getElementById('member-switch').innerHTML =
      '<div class="ms-label">' + (online ? '当前账号' : '当前身份（演示）') + '</div>' +
      (online ? '<div class="ms-account"><span class="avatar" style="background:' + esc(me.color || '#6366F1') + '">' + esc(String(me.name || '?').slice(0, 1)) + '</span><span><strong>' + esc(me.name) + '</strong><small>' + esc(me.academic_role || me.role || '') + '</small></span></div><button class="btn btn-sm btn-ghost ms-logout" data-action="logout">退出登录</button>' :
        '<select id="user-select">' + AuthAdapter.members().map(function (m) {
          return '<option value="' + m.id + '" ' + (m.id === me.id ? 'selected' : '') + '>' + esc(m.name) + ' · ' + esc(m.role) + '</option>';
        }).join('') + '</select><div class="ms-hint">服务器上由登录会话决定身份</div>');
  }
  function renderBrand() {
    const el = document.getElementById('brand-sub');
    const workspace = S.workspace();
    if (el && workspace && workspace.name) el.textContent = workspace.name;
  }
  function renderTopbar() {
    const t = TITLES[state.view];
    document.getElementById('crumb').textContent = t[0] + ' / ' + t[1];
    document.getElementById('page-title').textContent = t[1];
    const wd = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()];
    document.getElementById('today').textContent = fmt(today()) + ' 星期' + wd;
  }
  function sectionHead(title, note, actionHtml) {
    return '<div class="section-head"><div><div class="section-title">' + title + '</div>' +
      (note ? '<div class="section-note">' + note + '</div>' : '') + '</div>' + (actionHtml || '') + '</div>';
  }
  function addBtn(collection, label) {
    return '<button class="btn btn-primary btn-sm" data-action="new" data-collection="' + collection + '">+ ' + (label || '新建') + '</button>';
  }

  /* ---------- 视图：总览 ---------- */
  function viewOverview() {
    const tasks = S.list('tasks'), logs = S.list('logs'), events = S.list('events');
    const days = lastNDays(14), byDay = logsByDay(14);
    const weekEvents = events.filter(function (e) { return diffDays(e.date) >= 0 && diffDays(e.date) <= 7; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    const recent = logs.slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); }).slice(0, 4);
    const doing = tasks.filter(function (t) { return t.status === 'doing'; }).length;
    const delayed = tasks.filter(function (t) { return t.status === 'delayed'; }).length;
    const weekLogs = logs.filter(function (l) { return diffDays(l.date) > -7 && diffDays(l.date) <= 0; }).length;

    let html = '<div class="grid g4 block">' +
      metric('在研项目', S.list('projects').length, '论文 / 课题共 ' + S.list('projects').length + ' 项', 'folder', '#EAF2FE', '#3B82F6') +
      metric('未完成任务', tasks.filter(function (t) { return t.status !== 'done'; }).length, '进行中 ' + doing + ' · 已延期 <b style="color:#C43434">' + delayed + '</b>', 'check', '#E6F6FD', '#38BDF8') +
      metric('文献库', S.list('papers').length, '待读 ' + S.list('papers').filter(function (p) { return p.read_state === '待读'; }).length + ' 篇', 'book', '#FEF4E4', '#F59E0B') +
      metric('近 7 天上报', weekLogs, '全组累计 ' + logs.length + ' 条', 'edit', '#E9F8EF', '#22C55E') +
      '</div>';

    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>项目整体进度</h3><span class="sub">成员确认后更新</span></div>' +
      S.list('projects').map(function (p) {
        const color = p.progress >= 70 ? '#22C55E' : (p.progress >= 40 ? '#3B82F6' : '#F59E0B');
        return '<div class="progress-row"><div class="pr-main"><div class="pr-title">' + esc(p.title) + '</div>' +
          '<div class="pr-sub">' + esc(p.kind) + ' · 负责人 ' + esc(member(p.lead_id).name) + ' · 节点 ' + fmt(p.deadline) + '</div></div>' +
          '<div class="pr-track"><div class="progress-track"><div class="progress-fill" style="width:' + p.progress + '%;background:' + color + '"></div></div></div>' +
          '<div class="pr-num">' + p.progress + '%</div></div>';
      }).join('') + '</div>' +
      '<div class="card"><div class="card-head"><h3>未来一周安排</h3><span class="sub">' + weekEvents.length + ' 项</span></div>' +
      (weekEvents.length ? weekEvents.slice(0, 6).map(function (e) {
        return '<div class="list-row"><span class="badge ' + ({ '组会': 'b-purple', '实验': 'b-blue', '写作': 'b-amber', '文献': 'b-cyan', '答辩': 'b-red' }[e.type] || 'b-gray') + '">' + esc(e.type) + '</span>' +
          '<div class="lr-main"><div class="lr-title">' + esc(e.title) + '</div><div class="lr-sub">' + fmt(e.date) + ' · ' + esc(projectTitle(e.project_id)) + '</div></div>' +
          '<span class="small muted">' + (diffDays(e.date) === 0 ? '今天' : diffDays(e.date) + ' 天后') + '</span></div>';
      }).join('') : '<div class="empty">未来一周暂无安排</div>') + '</div></div>';

    const statusSeg = [
      { label: '待开始', value: tasks.filter(function (t) { return t.status === 'todo'; }).length, color: '#B7C0D2' },
      { label: '进行中', value: doing, color: '#3B82F6' },
      { label: '已完成', value: tasks.filter(function (t) { return t.status === 'done'; }).length, color: '#22C55E' },
      { label: '已延期', value: delayed, color: '#EF4444' }
    ];
    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>近 14 天工作上报活跃度</h3><span class="sub">全组 / 条</span></div>' +
      lineChart(byDay.map(function (a) { return a.length; }), days.map(function (d) { return (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)); }), '#3B82F6') + '</div>' +
      '<div class="card"><div class="card-head"><h3>任务状态分布</h3><span class="sub">共 ' + tasks.length + ' 项</span></div>' +
      '<div class="flex" style="gap:26px;align-items:center">' + donutChart(statusSeg, String(tasks.length)) +
      '<div style="flex:1">' + statusSeg.map(function (s) {
        return '<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="flex small"><span style="width:9px;height:9px;border-radius:2px;background:' + s.color + '"></span>' + s.label + '</span><span class="strong small">' + s.value + '</span></div>';
      }).join('') + '</div></div></div></div>';

    html += '<div class="card">' + sectionHead('组内最新动态', '每日上报后由 AI 自动生成的进度摘要') +
      recent.map(function (l) {
        const m = member(l.author_id);
        return '<div class="timeline-item"><span class="tl-dot" style="background:' + m.color + '"></span><div class="tl-main">' +
          '<div class="tl-head"><span class="strong small">' + esc(m.name) + '</span><span class="small muted">' + fmt(l.date) + '</span><span class="badge b-blue">' + esc(projectTitle(l.project_id)) + '</span><span class="small muted">' + (l.hours || '—') + ' 小时</span></div>' +
          '<div class="tl-body">' + esc(l.content) + '</div>' +
          (l.summary && l.summary.summary ? '<div class="tl-ai">' + icon('spark', 13) + ' <span>' + esc(l.summary.summary) + '</span></div>' : '') +
          '</div></div>';
      }).join('') + '</div>';
    return html;
  }
  function metric(label, value, hint, ic, bg, fg) {
    return '<div class="card metric"><div class="m-label"><span class="m-icon" style="background:' + bg + ';color:' + fg + '">' + icon(ic, 15) + '</span>' + label + '</div>' +
      '<div class="m-value">' + value + '</div><div class="m-hint">' + hint + '</div></div>';
  }

  /* ---------- 视图：每日上报 ---------- */
  function viewDaily() {
    const f = state.reportForm || {};
    const aiReady = !S.isOnline() || Boolean(S.aiConfig().configured);
    const reportNote = aiReady ? '填写工作内容，生成日报摘要与进度建议' : 'AI 服务尚未配置完整，请联系管理员完成设置。';
    let html = '<div class="card">' + sectionHead('今日工作上报', reportNote,
      S.isOnline() ? '<button class="btn btn-sm btn-ghost" data-action="weekly-summary" ' + (!aiReady || state.weeklyLoading ? 'disabled' : '') + '>' + (state.weeklyLoading ? '生成中…' : '生成本周周报') + '</button>' : '') +
      '<div class="report-form">' +
      '<div class="form-inline">' +
      '<div class="form-row"><label>日期</label><div><input type="date" id="rf-date" value="' + esc(f.date || today()) + '"></div></div>' +
      '<div class="form-row"><label>投入时长</label><div><input type="number" id="rf-hours" min="0" step="0.5" value="' + esc(f.hours || 6) + '"><div class="field-hint">单位：小时</div></div></div>' +
      '</div>' +
      '<div class="form-row"><label>关联项目</label><div><select id="rf-project">' + S.list('projects').map(function (p) {
        return '<option value="' + p.id + '" ' + (f.projectId === p.id ? 'selected' : '') + '>' + esc(p.title) + '</option>';
      }).join('') + '</select></div></div>' +
      '<div class="form-row"><label>今天做了什么</label><div><textarea id="rf-content" placeholder="例如：完成消息传递层的边特征改造，跑了三组超参，验证集 MAE 从 0.142 降到 0.128，整理了消融实验表格。">' + esc(f.content || '') + '</textarea>' +
      '<div class="field-hint" style="margin-top:8px">写清完成内容、结果和遇到的问题，摘要会更准确。</div></div></div>' +
      '<div class="flex" style="gap:10px;justify-content:flex-end">' +
      '<button class="btn" data-action="generate-ai" ' + (state.aiLoading || !aiReady ? 'disabled' : '') + '>' + icon('spark', 15) + ' ' + (state.aiLoading ? '正在生成…' : (!aiReady ? 'AI 尚未配置' : '生成进度摘要')) + '</button>' +
      '</div></div>' +
      (state.aiDraft ? aiResultHtml(state.aiDraft.res) : '') +
      '</div>';

    if (state.weeklyDraft) {
      html += '<div class="card" style="margin-top:18px"><div class="card-head"><h3>本周周报</h3></div>' +
        '<div class="ai-summary">' + esc(state.weeklyDraft.summary || '') + '</div>' +
        '<div class="grid g3" style="margin-top:14px"><div><div class="small strong">本周亮点</div>' + (state.weeklyDraft.highlights || []).map(function (x) { return '<div class="ai-bullet">' + esc(x) + '</div>'; }).join('') + '</div><div><div class="small strong">阻塞点</div>' + (state.weeklyDraft.blockers || []).map(function (x) { return '<div class="ai-bullet">' + esc(x) + '</div>'; }).join('') + '</div><div><div class="small strong">下周建议</div>' + (state.weeklyDraft.nextSteps || []).map(function (x) { return '<div class="ai-bullet">' + esc(x) + '</div>'; }).join('') + '</div></div></div>';
    }

    const recent = S.list('logs').slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); }).slice(0, 8);
    html += '<div class="card" style="margin-top:18px">' + sectionHead('最近上报记录', '全组 ' + S.list('logs').length + ' 条') +
      recent.map(function (l) {
        const m = member(l.author_id);
        return '<div class="timeline-item"><span class="tl-dot" style="background:' + m.color + '"></span><div class="tl-main">' +
          '<div class="tl-head">' + avatar(m, 22) + '<span class="strong small">' + esc(m.name) + '</span><span class="small muted">' + fmt(l.date) + '</span>' +
          '<span class="badge b-blue">' + esc(projectTitle(l.project_id)) + '</span>' + (l.applied ? '<span class="badge b-green">已回写</span>' : '<span class="badge b-gray">未应用</span>') + '</div>' +
          '<div class="tl-body">' + esc(l.content) + '</div>' +
          (l.summary && l.summary.tags ? '<div style="margin-top:7px">' + l.summary.tags.map(function (t) { return '<span class="tag" style="margin-right:5px">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '</div></div>';
      }).join('') + '</div>';
    return html;
  }
  function aiResultHtml(r) {
    return '<div class="ai-result"><div class="ai-result-head"><div class="arh-title">' + icon('spark', 15) + ' 整理结果</div></div>' +
      '<div class="ai-result-body"><div class="ai-summary">' + esc(r.summary) + '</div>' +
      '<div class="grid g2" style="margin-top:16px">' +
      '<div class="ai-section"><h4>项目进度建议</h4>' + (r.progress.length ? r.progress.map(function (p) {
        return '<div class="ai-chip"><span class="strong" style="color:#17864A">+' + p.delta + '%</span> ' + esc(p.title) + '</div>';
      }).join('') : '<div class="small muted">无</div>') + '</div>' +
      '<div class="ai-section"><h4>任务状态整理</h4>' + (r.taskUpdates.length ? r.taskUpdates.map(function (u) {
        return '<div class="ai-chip">' + esc(u.title.slice(0, 18)) + ' · ' + statusText(u.from) + ' → <span class="strong">' + statusText(u.to) + '</span></div>';
      }).join('') : '<div class="small muted">本次无需调整任务状态</div>') + '</div></div>' +
      '<div class="grid g2" style="margin-top:6px">' +
      '<div class="ai-section"><h4>下一步建议</h4>' + r.suggestions.map(function (s) { return '<div class="ai-bullet">' + esc(s) + '</div>'; }).join('') + '</div>' +
      '<div class="ai-section"><h4>工作类型标签</h4><div>' + r.tags.map(function (t) { return '<span class="tag" style="margin:0 6px 6px 0;display:inline-block">' + esc(t) + '</span>'; }).join('') + '</div></div>' +
      '</div><div class="ai-actions">' +
      '<button class="btn btn-primary" data-action="apply-ai">应用并保存</button>' +
      '<button class="btn" data-action="discard-ai">放弃</button>' +
      '<span class="ai-warn">应用后将回写项目进度与任务状态，并计入复盘统计</span></div></div></div>';
  }

  /* ---------- 视图：论文项目 ---------- */
  function viewProjects() {
    const html = sectionHead('论文与课题项目', '管理研究项目、拆解阶段任务、记录关键成果与待办事项', addBtn('projects', '新建项目')) +
      '<div class="grid g2">' + S.list('projects').map(function (p) {
        const ms = p.milestones || [];
        const done = ms.filter(function (m) { return m.done; }).length;
        const dleft = diffDays(p.deadline);
        return '<div class="card"><div class="spread" style="align-items:flex-start">' +
          '<div><span class="badge ' + (p.kind === '论文' ? 'b-blue' : 'b-purple') + '">' + esc(p.kind) + '</span>' +
          '<h3 style="margin:9px 0 3px;font-size:15px;font-weight:600">' + esc(p.title) + '</h3>' +
          '<div class="small muted">目标：' + esc(p.goal || '—') + '</div></div>' +
          '<div class="flex">' + '<button class="btn btn-sm btn-ghost" data-action="edit" data-collection="projects" data-id="' + p.id + '">编辑</button>' +
          '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="projects" data-id="' + p.id + '">删除</button></div></div>' +
          '<div class="spread" style="margin:16px 0 7px"><span class="small muted">整体进度</span><span class="strong">' + p.progress + '%</span></div>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + p.progress + '%"></div></div>' +
          '<div class="flex small muted" style="margin:12px 0;gap:16px"><span>负责人 ' + esc(member(p.lead_id).name) + '</span><span>节点 ' + fmt(p.deadline) + '</span>' +
          '<span style="color:' + (dleft < 14 ? '#C43434' : '#818BA1') + '">' + (dleft >= 0 ? '剩 ' + dleft + ' 天' : '已逾期') + '</span></div>' +
          '<div class="hr"></div><div class="small strong" style="margin-bottom:8px">阶段任务 ' + done + '/' + ms.length + '</div>' +
          ms.map(function (m) {
            return '<div class="flex small" style="padding:4px 0;color:' + (m.done ? '#818BA1' : '#4A5468') + '">' +
              '<span style="width:15px;height:15px;border-radius:4px;border:1.5px solid ' + (m.done ? '#22C55E' : '#D9DEE9') + ';background:' + (m.done ? '#22C55E' : '#fff') + ';display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;flex:0 0 15px">' + (m.done ? '✓' : '') + '</span>' +
              '<span style="' + (m.done ? 'text-decoration:line-through' : '') + '">' + esc(m.title) + '</span><span style="margin-left:auto" class="muted">' + fmt(m.due) + '</span></div>';
          }).join('') +
          (p.notes ? '<div class="tl-ai" style="margin-top:12px">关键成果与待办：' + esc(p.notes) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    return html || '<div class="empty">暂无项目</div>';
  }

  /* ---------- 视图：任务看板 ---------- */
  function viewTasks() {
    const tasks = S.list('tasks');
    const cols = [
      { key: 'todo', label: '待开始', color: '#8B95AA' },
      { key: 'doing', label: '进行中', color: '#3B82F6' },
      { key: 'done', label: '已完成', color: '#22C55E' },
      { key: 'delayed', label: '已延期', color: '#EF4444' }
    ];
    const overdue = tasks.filter(function (t) { return t.status === 'delayed'; }).length;
    const weekDue = tasks.filter(function (t) { return t.status !== 'done' && diffDays(t.due_date) >= 0 && diffDays(t.due_date) <= 7; }).length;
    let html = sectionHead('科研任务看板', '按优先级管理每日 / 每周任务，快速查看本周重点与完成情况', addBtn('tasks', '新建任务')) +
      '<div class="grid g3 block">' +
      '<div class="card tight"><div class="small muted">本周到期任务</div><div style="font-size:24px;font-weight:600;margin-top:4px">' + weekDue + '</div></div>' +
      '<div class="card tight"><div class="small muted">已延期需关注</div><div style="font-size:24px;font-weight:600;margin-top:4px;color:#C43434">' + overdue + '</div></div>' +
      '<div class="card tight"><div class="small muted">任务完成率</div><div style="font-size:24px;font-weight:600;margin-top:4px;color:#17864A">' +
      (tasks.length ? Math.round(tasks.filter(function (t) { return t.status === 'done'; }).length / tasks.length * 100) : 0) + '%</div></div></div>' +
      '<div class="board">' + cols.map(function (col) {
        const list = tasks.filter(function (t) { return t.status === col.key; });
        return '<div class="board-col"><div class="board-col-head"><span class="flex"><span style="width:8px;height:8px;border-radius:50%;background:' + col.color + '"></span>' + col.label + '</span><span class="cnt">' + list.length + '</span></div>' +
          (list.length ? list.map(function (t) {
            const m = member(t.assignee_id), dl = diffDays(t.due_date);
            return '<div class="board-card"><div class="bc-title">' + esc(t.title) + '</div>' +
              '<div class="bc-meta">' + priorityBadge(t.priority) + '<span class="badge b-blue">' + esc(projectTitle(t.project_id).slice(0, 12)) + '</span></div>' +
              '<div class="bc-foot">' + avatar(m, 20) + '<span class="small muted">' + esc(m.name) + '</span>' +
              '<span class="small" style="margin-left:auto;color:' + (dl < 0 && t.status !== 'done' ? '#C43434' : '#818BA1') + '">' + fmt(t.due_date) + '</span></div>' +
              '<div class="flex" style="margin-top:9px;gap:6px">' +
              (t.status !== 'done' ? '<button class="btn btn-sm" style="flex:1" data-action="advance-task" data-id="' + t.id + '">推进 →</button>' : '') +
              '<button class="btn btn-sm btn-ghost" data-action="edit" data-collection="tasks" data-id="' + t.id + '">编辑</button>' +
              '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="tasks" data-id="' + t.id + '">删</button></div></div>';
          }).join('') : '<div class="empty small">暂无任务</div>') + '</div>';
      }).join('') + '</div>';
    return html;
  }

  /* ---------- 视图：文献管理 ---------- */
  function viewPapers() {
    const all = S.list('papers');
    const q = state.paperQuery.trim().toLowerCase();
    const list = all.filter(function (p) {
      const okFilter = state.paperFilter === '全部' || p.read_state === state.paperFilter;
      const okQuery = !q || (p.title + p.authors + (p.tags || []).join('') + p.venue).toLowerCase().indexOf(q) >= 0;
      return okFilter && okQuery;
    });
    let html = sectionHead('文献管理', '分类管理文献、记录阅读笔记、关联项目与任务形成知识积累', addBtn('papers', '添加文献')) +
      '<div class="card" style="margin-bottom:16px"><div class="flex" style="flex-wrap:wrap;gap:8px">' +
      ['全部', '待读', '略读', '精读'].map(function (f) {
        return '<button class="btn btn-sm ' + (state.paperFilter === f ? 'btn-primary' : '') + '" data-action="paper-filter" data-value="' + f + '">' + f + '</button>';
      }).join('') + '<input type="text" id="paper-search" placeholder="搜索标题 / 作者 / 标签…" value="' + esc(state.paperQuery) + '" style="margin-left:auto;max-width:250px">' +
      '</div></div>' +
      '<div class="card"><table class="table"><thead><tr><th style="width:32%">文献</th><th>标签</th><th>关联项目</th><th>阅读状态</th><th>评分</th><th>笔记与操作</th></tr></thead><tbody>' +
      (list.length ? list.map(function (p) {
        return '<tr><td><div class="td-title">' + esc(p.title) + '</div><div class="td-sub">' + esc(p.authors) + ' · ' + p.year + ' · ' + esc(p.venue || '') + '</div></td>' +
          '<td>' + (p.tags || []).map(function (t) { return '<span class="tag" style="margin:0 4px 4px 0;display:inline-block">' + esc(t) + '</span>'; }).join('') + '</td>' +
          '<td class="small">' + esc(projectTitle(p.project_id)) + '</td>' +
          '<td><select class="paper-state" data-id="' + p.id + '" style="font-size:11.5px;padding:4px 6px">' + ['待读', '略读', '精读'].map(function (s) {
            return '<option ' + (p.read_state === s ? 'selected' : '') + '>' + s + '</option>';
          }).join('') + '</select></td>' +
          '<td class="small">' + (p.rating ? '★'.repeat(p.rating) : '—') + '</td>' +
          '<td><div class="small muted" style="max-width:230px;line-height:1.5">' + esc((p.note || '').slice(0, 60)) + ((p.note || '').length > 60 ? '…' : '') + '</div>' +
          '<div class="flex" style="margin-top:6px"><button class="btn btn-sm btn-ghost" data-action="edit" data-collection="papers" data-id="' + p.id + '">编辑</button>' +
          '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="papers" data-id="' + p.id + '">删除</button></div></td></tr>';
      }).join('') : '<tr><td colspan="6"><div class="empty">没有匹配的文献</div></td></tr>') + '</tbody></table></div>';
    return html;
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
      '<div class="card experiment-toolbar"><input type="text" id="experiment-search" placeholder="搜索实验记录、项目或结论" value="' + esc(state.experimentQuery) + '"><span class="small muted">' + records.length + ' 条记录</span></div>';
    if (!records.length) return html + '<div class="card empty">' + (all.length ? '没有匹配的实验记录' : '还没有实验记录，创建一条记录来整理实验过程与结果。') + '</div>';
    html += '<div class="experiment-list">' + records.map(function (r) {
      const author = member(r.created_by);
      const editable = !S.isOnline() || S.can('manage') || (S.currentUser() && r.created_by === S.currentUser().id);
      const details = [
        ['实验假设 / 目的', r.hypothesis], ['材料与设备', r.materials], ['实验步骤', r.procedure],
        ['观察记录', r.observations], ['结果', r.results], ['结论', r.conclusion], ['后续计划', r.next_steps]
      ].filter(function (entry) { return entry[1]; });
      const attachments = r.attachments || [];
      return '<article class="card experiment-card"><div class="experiment-head"><div><div class="flex" style="flex-wrap:wrap">' +
        '<span class="badge b-purple">' + esc(r.category || '实验') + '</span><span class="small muted">' + fmt(r.date || r.created_at) + '</span>' +
        (r.project_id ? '<span class="badge b-blue">' + esc(projectTitle(r.project_id)) + '</span>' : '') +
        (r.task_id ? '<span class="badge b-gray">' + esc((S.find('tasks', r.task_id) || {}).title || '关联任务') + '</span>' : '') +
        '</div><h2>' + esc(r.title) + '</h2><div class="small muted">记录人：' + esc(author.name || '成员') + '</div></div>' +
        (editable ? '<div class="flex"><button class="btn btn-sm btn-ghost" data-action="edit" data-collection="experiments" data-id="' + esc(r.id) + '">编辑</button><button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="experiments" data-id="' + esc(r.id) + '">删除</button></div>' : '') +
        '</div>' + (details.length ? '<div class="experiment-details">' + details.map(function (entry) {
          return '<section><h3>' + esc(entry[0]) + '</h3><p>' + esc(entry[1]) + '</p></section>';
        }).join('') + '</div>' : '<div class="small muted" style="margin-top:12px">可继续补充实验目的、步骤、观察和结论。</div>') +
        '<div class="experiment-attachments"><div class="spread"><h3>附件</h3>' + (S.isOnline() && editable ? '<button class="btn btn-sm" data-action="pick-experiment-files" data-input-id="exp-files-' + esc(r.id) + '">添加附件</button>' : '') + '</div>' +
        (attachments.length ? '<div class="attachment-list">' + attachments.map(function (a) {
          return '<div class="attachment-row"><span class="attachment-icon">↳</span><span class="attachment-name" title="' + esc(a.name) + '">' + esc(a.name) + '</span><span class="small muted">' + formatFileSize(a.size) + '</span>' +
            '<button class="btn btn-sm btn-ghost" data-action="download-experiment-file" data-experiment-id="' + esc(r.id) + '" data-attachment-id="' + esc(a.id) + '" data-filename="' + esc(a.name) + '">下载</button>' +
            (S.isOnline() && editable ? '<button class="btn btn-sm btn-ghost btn-danger" data-action="delete-experiment-file" data-experiment-id="' + esc(r.id) + '" data-attachment-id="' + esc(a.id) + '">移除</button>' : '') + '</div>';
        }).join('') + '</div>' : '<div class="small muted">暂无附件' + (S.isOnline() && editable ? '，可上传 PDF、图片、表格或文档' : '') + '</div>') +
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
    const start = startOfWeek(state.calOffset);
    const days = [];
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); days.push(iso(d)); }
    const evs = S.list('events');
    const inWeek = evs.filter(function (e) { return days.indexOf(e.date) >= 0; });
    const planned = inWeek.length, done = inWeek.filter(function (e) { return e.done; }).length;
    const colorMap = { '组会': ['#F2ECFE', '#6D43C4'], '实验': ['#EAF2FE', '#2563B8'], '写作': ['#FEF4E4', '#A5680A'], '文献': ['#E6F6FD', '#0B7CA8'], '答辩': ['#FDECEC', '#C43434'] };
    let html = sectionHead('科研日历', '安排文献阅读、实验、写作等日程，按周 / 月查看计划与实际完成情况', addBtn('events', '新建日程')) +
      '<div class="card"><div class="card-head"><div class="flex"><button class="btn btn-sm" data-action="cal-prev">← 上一周</button>' +
      '<button class="btn btn-sm" data-action="cal-today">本周</button><button class="btn btn-sm" data-action="cal-next">下一周 →</button></div>' +
      '<span class="sub">' + fmt(days[0]) + ' — ' + fmt(days[6]) + ' · 计划 ' + planned + ' 项 / 完成 ' + done + ' 项</span></div>' +
      '<div class="cal-grid">' + ['一', '二', '三', '四', '五', '六', '日'].map(function (w) { return '<div class="cal-head">周' + w + '</div>'; }).join('') +
      days.map(function (d) {
        const list = evs.filter(function (e) { return e.date === d; });
        return '<div class="cal-cell ' + (d === today() ? 'today' : '') + '"><div class="cc-num">' + (+d.slice(8, 10)) + (d === today() ? ' · 今天' : '') + '</div>' +
          (list.length ? list.map(function (e) {
            const c = colorMap[e.type] || ['#F0F2F6', '#69738A'];
            return '<div class="cal-ev" style="background:' + c[0] + ';color:' + c[1] + '">' + (e.done ? '✓ ' : '') + esc(e.title) + '</div>';
          }).join('') : '<div class="small muted" style="font-size:10px">—</div>') + '</div>';
      }).join('') + '</div></div>';

    html += '<div class="grid g2" style="margin-top:16px">' +
      '<div class="card"><div class="card-head"><h3>本周计划清单</h3><span class="sub">' + planned + ' 项</span></div>' +
      (inWeek.length ? inWeek.map(function (e) {
        return '<div class="list-row"><input type="checkbox" data-action="toggle-event" data-id="' + e.id + '" ' + (e.done ? 'checked' : '') + ' style="width:15px;height:15px">' +
          '<div class="lr-main"><div class="lr-title" style="' + (e.done ? 'text-decoration:line-through;color:#818BA1' : '') + '">' + esc(e.title) + '</div>' +
          '<div class="lr-sub">' + fmt(e.date) + ' · ' + esc(e.type) + ' · ' + esc(projectTitle(e.project_id)) + '</div></div>' +
          '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="events" data-id="' + e.id + '">删除</button></div>';
      }).join('') : '<div class="empty">本周暂无安排</div>') + '</div>' +
      '<div class="card"><div class="card-head"><h3>计划与实际完成</h3><span class="sub">近 4 周</span></div>' +
      barChart([0, 1, 2, 3].map(function (i) {
        const s = startOfWeek(i - 3), e = new Date(s); e.setDate(e.getDate() + 7);
        return evs.filter(function (x) { return x.date >= iso(s) && x.date < iso(e) && x.done; }).length;
      }), [weekLabel(-3), weekLabel(-2), weekLabel(-1), weekLabel(0)].concat(['', '', '', '']).slice(0, 4), '#8B5CF6') +
      '<div class="small muted" style="margin-top:8px">提示：勾选上方清单中的完成项，统计会实时更新。服务器版本可自动同步实验记录与任务完成时间。</div></div></div>';
    return html;
  }

  /* ---------- 视图：数据分析 ---------- */
  function viewAnalyses() {
    return sectionHead('数据分析', '记录数据清洗与预处理脚本、统计分析与关键结论，便于复现', addBtn('analyses', '新建分析记录')) +
      '<div class="grid g2">' + (S.list('analyses').length ? S.list('analyses').map(function (a) {
        return '<div class="card"><div class="spread" style="align-items:flex-start"><div>' +
          '<span class="badge ' + (a.tool === 'Python' ? 'b-green' : a.tool === 'Stata' ? 'b-purple' : 'b-blue') + '">' + esc(a.tool) + '</span>' +
          '<h3 style="font-size:14px;font-weight:600;margin:9px 0 4px">' + esc(a.title) + '</h3>' +
          '<div class="small muted">' + esc(projectTitle(a.project_id)) + ' · ' + fmt(a.created_at) + '</div></div>' +
          '<div class="flex"><button class="btn btn-sm btn-ghost" data-action="edit" data-collection="analyses" data-id="' + a.id + '">编辑</button>' +
          '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="analyses" data-id="' + a.id + '">删除</button></div></div>' +
          '<div class="hr"></div>' +
          '<div class="small" style="margin-bottom:6px">数据集：<span class="mono">' + esc(a.dataset) + '</span></div>' +
          '<div class="small" style="margin-bottom:10px">脚本：<span class="mono">' + esc(a.script) + '</span></div>' +
          '<div class="tl-ai">关键结论：' + esc(a.result) + '</div></div>';
      }).join('') : '<div class="empty">暂无分析记录</div>') + '</div>';
  }

  /* ---------- 视图：可视化复盘 ---------- */
  function viewReviews() {
    const logs = S.list('logs'), tasks = S.list('tasks');
    const last14 = lastNDays(14), byDay = logsByDay(14);
    const hours = byDay.reduce(function (a, arr) { return a + arr.reduce(function (x, l) { return x + (Number(l.hours) || 0); }, 0); }, 0);
    const tagCount = {};
    logs.forEach(function (l) { ((l.summary && l.summary.tags) || []).forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
    const palette = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#38BDF8'];
    const tagSeg = Object.keys(tagCount).slice(0, 5).map(function (k, i) { return { label: k, value: tagCount[k], color: palette[i % palette.length] }; });
    const weekly = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
      return logs.filter(function (l) { const d = diffDays(l.date); return d < -(i * 7) && d >= -((i + 1) * 7); }).length;
    }).reverse();
    const doneWeekly = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
      return tasks.filter(function (t) { return t.status === 'done' && t.completed_at && diffDays(String(t.completed_at).slice(0, 10)) < -(i * 7) && diffDays(String(t.completed_at).slice(0, 10)) >= -((i + 1) * 7); }).length;
    }).reverse();

    let html = '<div class="grid g4 block">' +
      metric('近 14 天上报', logs.filter(function (l) { return last14.indexOf(l.date) >= 0; }).length, '全组工作记录', 'edit', '#EAF2FE', '#3B82F6') +
      metric('累计投入', Math.round(hours) + ' h', '近 14 天合计时长', 'calendar', '#E9F8EF', '#22C55E') +
      metric('已完成任务', tasks.filter(function (t) { return t.status === 'done'; }).length, '共 ' + tasks.length + ' 项任务', 'check', '#FEF4E4', '#F59E0B') +
      metric('文献精读', S.list('papers').filter(function (p) { return p.read_state === '精读'; }).length, '文献库 ' + S.list('papers').length + ' 篇', 'book', '#F2ECFE', '#8B5CF6') +
      '</div>';

    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>近 8 周工作上报量</h3><span class="sub">趋势</span></div>' +
      lineChart(weekly, ['8 周前', '', '', '', '', '', '', '本周'], '#3B82F6') + '</div>' +
      '<div class="card"><div class="card-head"><h3>任务完成量</h3><span class="sub">近 8 周</span></div>' +
      barChart(doneWeekly, ['8 周前', '', '', '', '', '', '', '本周'], '#22C55E') + '</div></div>';

    html += '<div class="grid g2 block">' +
      '<div class="card"><div class="card-head"><h3>工作时间分布</h3><span class="sub">按 AI 标签统计</span></div>' +
      '<div class="flex" style="gap:24px;align-items:center">' + donutChart(tagSeg.length ? tagSeg : [{ label: '暂无', value: 1, color: '#E8EBF2' }], String(logs.length)) +
      '<div style="flex:1">' + (tagSeg.length ? tagSeg.map(function (s) {
        return '<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="flex small"><span style="width:9px;height:9px;border-radius:2px;background:' + s.color + '"></span>' + esc(s.label) + '</span><span class="strong small">' + s.value + '</span></div>';
      }).join('') : '<div class="small muted">暂无标签数据</div>') + '</div></div></div>' +
      '<div class="card"><div class="card-head"><h3>项目进度对比</h3><span class="sub">当前快照</span></div>' +
      S.list('projects').map(function (p) {
        return '<div class="progress-row"><div class="pr-main"><div class="pr-title">' + esc(p.title.slice(0, 22)) + '</div>' +
          '<div class="pr-sub">' + esc(p.kind) + ' · ' + esc(member(p.lead_id).name) + '</div></div>' +
          '<div class="pr-track"><div class="progress-track"><div class="progress-fill" style="width:' + p.progress + '%;background:#8B5CF6"></div></div></div>' +
          '<div class="pr-num">' + p.progress + '%</div></div>';
      }).join('') + '</div></div>';

    html += '<div class="card">' + sectionHead('定期复盘记录', '量化进展，持续优化研究过程', addBtn('reviews', '新增复盘')) +
      (S.list('reviews').length ? S.list('reviews').map(function (r) {
        return '<div class="timeline-item"><span class="tl-dot" style="background:#8B5CF6"></span><div class="tl-main">' +
          '<div class="tl-head"><span class="strong small">' + esc(r.period) + '</span><span class="small muted">' + fmt(r.created_at) + '</span></div>' +
          '<div class="tl-body">' + esc(r.content) + '</div></div></div>';
      }).join('') : '<div class="empty">暂无复盘记录</div>') + '</div>';
    return html;
  }

  /* ---------- 视图：成员与权限 ---------- */
  function viewMembers() {
    const workspace = S.workspace() || {};
    const invite = S.isOnline() ? '<div class="card" style="margin-bottom:18px;background:#F7FAFF;border-color:#DDE8FB"><div class="spread"><div><div class="strong">' + esc(workspace.name || '当前课题组') + '</div><div class="small muted" style="margin-top:4px">新成员注册时输入这个邀请码，就会进入同一个课题组</div></div><div class="flex" style="gap:8px"><span class="mono" style="font-size:15px;letter-spacing:1px">' + esc(workspace.join_code || '—') + '</span>' + (S.can('manage') ? '<button class="btn btn-sm btn-ghost" data-action="rotate-join-code">更新邀请码</button>' : '') + '</div></div></div>' : '';
    let html = sectionHead('成员与权限', '成员通过邀请码加入课题组，PI 可管理成员状态', S.isOnline() ? '' : addBtn('members', '添加成员')) + invite +
      '<div class="grid g2">' + S.list('members').map(function (m) {
        const own = S.list('projects').filter(function (p) { return p.lead_id === m.id; }).length;
        const doing = S.list('tasks').filter(function (t) { return t.assignee_id === m.id && t.status === 'doing'; }).length;
        const logs = S.list('logs').filter(function (l) { return l.author_id === m.id; }).length;
        return '<div class="card"><div class="flex" style="gap:12px">' + avatar(m, 42) +
          '<div style="flex:1"><div class="strong">' + esc(m.name) + ' ' + (m.id === AuthAdapter.current().id ? '<span class="badge b-blue">当前身份</span>' : '') + '</div>' +
          '<div class="small muted">' + esc(m.academic_role || m.role || '') + ' · ' + esc(m.email) + '</div></div>' +
          (S.can('manage') && m.id !== AuthAdapter.current().id ? '<button class="btn btn-sm btn-ghost btn-danger" data-action="del" data-collection="members" data-id="' + m.id + '">停用</button>' : '') + '</div>' +
          '<div class="hr"></div><div class="grid g3" style="text-align:center">' +
          '<div><div class="strong" style="font-size:18px">' + own + '</div><div class="small muted">负责项目</div></div>' +
          '<div><div class="strong" style="font-size:18px">' + doing + '</div><div class="small muted">进行中任务</div></div>' +
          '<div><div class="strong" style="font-size:18px">' + logs + '</div><div class="small muted">累计上报</div></div></div></div>';
      }).join('') + '</div>';
    return html;
  }

  /* ---------- 视图：AI 与设置 ---------- */
  function viewSettings() {
    const cfg = S.aiConfig();
    return '<div class="grid g2">' +
      '<div class="card">' + sectionHead('AI 服务', '配置用于整理日报和周报的模型接口') +
      '<div class="form-row"><label>服务商</label><div><select id="ai-provider"><option ' + (cfg.provider === '国模' ? 'selected' : '') + '>国模</option><option ' + (cfg.provider === 'DeepSeek' ? 'selected' : '') + '>DeepSeek</option><option ' + (cfg.provider === '通义千问' ? 'selected' : '') + '>通义千问</option><option ' + (cfg.provider === '智谱' ? 'selected' : '') + '>智谱</option><option ' + (cfg.provider === '自定义' ? 'selected' : '') + '>自定义</option></select></div></div>' +
      '<div class="form-row" style="margin-top:10px"><label>API 地址</label><div><input type="text" id="ai-base" value="' + esc(cfg.baseUrl) + '"></div></div>' +
      '<div class="form-row" style="margin-top:10px"><label>请求路径</label><div><input type="text" id="ai-chat-path" value="' + esc(cfg.chatPath || '/chat/completions') + '"><div class="field-hint">OpenAI 兼容接口通常为 /chat/completions</div></div></div>' +
      '<div class="form-row" style="margin-top:10px"><label>模型名</label><div><input type="text" id="ai-model" value="' + esc(cfg.model) + '"></div></div>' +
      '<div class="field-hint" style="margin-top:10px">API Key 由服务器管理员配置，不会通过网页传输。状态：<strong>' + (cfg.configured ? '已配置' : '尚未配置完整') + '</strong></div>' +
      '<div class="flex" style="justify-content:flex-end;margin-top:18px">' + (S.can('manage') ? '<button class="btn btn-primary" data-action="save-ai-config">保存 AI 配置</button>' : '<span class="small muted">仅 PI 可以修改 AI 配置</span>') + '</div></div>' +
      '<div class="card">' + sectionHead('AI 整理流程', '由成员确认后再更新项目数据') +
      '<div class="timeline-item"><span class="tl-dot"></span><div class="tl-main"><div class="tl-head"><span class="strong small">生成摘要</span></div><div class="tl-body">根据工作内容整理日报或周报，并提出进度与任务建议。</div></div></div>' +
      '<div class="timeline-item"><span class="tl-dot" style="background:#F59E0B"></span><div class="tl-main"><div class="tl-head"><span class="strong small">确认后保存</span></div><div class="tl-body">成员检查 AI 建议后再保存，确认的进度和任务变化会同步到工作台。</div></div></div>' +
      '<div class="hr"></div>' + sectionHead('电脑通知', '日报、早间任务和延期任务提醒') +
      '<div class="small muted" style="margin-bottom:12px">开启后，浏览器会在晚上提醒日报，早上提醒任务；需要允许浏览器通知权限。</div>' +
      '<button class="btn btn-primary" data-action="enable-notifications">开启电脑通知</button>' +
      (!S.isOnline() ? '<div class="hr"></div>' + sectionHead('本地数据') + '<div class="small muted" style="margin-bottom:12px">重置会清空本机新增与修改的数据。</div><button class="btn" data-action="reset-data">重置数据</button>' : '') + '</div></div>';
  }

  /* ---------- 表单 schema ---------- */
  const FORMS = {
    projects: { title: '论文 / 课题项目', fields: [
      { k: 'title', l: '项目名称', t: 'text', req: true },
      { k: 'kind', l: '类型', t: 'select', o: ['论文', '课题'] },
      { k: 'goal', l: '目标', t: 'text' },
      { k: 'start_date', l: '开始日期', t: 'date' },
      { k: 'deadline', l: '关键节点', t: 'date' },
      { k: 'lead_id', l: '负责人', t: 'member' },
      { k: 'progress', l: '当前进度 (%)', t: 'number' },
      { k: 'notes', l: '关键成果与待办事项', t: 'textarea' }
    ] },
    tasks: { title: '科研任务', fields: [
      { k: 'title', l: '任务名称', t: 'text', req: true },
      { k: 'project_id', l: '关联项目', t: 'project' },
      { k: 'assignee_id', l: '负责人', t: 'member' },
      { k: 'priority', l: '优先级', t: 'select', o: ['高', '中', '低'] },
      { k: 'status', l: '状态', t: 'select', o: ['todo', 'doing', 'done', 'delayed'], labels: ['待开始', '进行中', '已完成', '已延期'] },
      { k: 'due_date', l: '截止日期', t: 'date' }
    ] },
    experiments: { title: '实验记录', fields: [
      { k: 'title', l: '记录名称', t: 'text', req: true },
      { k: 'date', l: '实验日期', t: 'date' },
      { k: 'category', l: '实验类型', t: 'select', o: ['实验操作', '样品制备', '仪器表征', '数据验证', '方法开发', '其他'] },
      { k: 'project_id', l: '关联项目', t: 'project' },
      { k: 'task_id', l: '关联任务', t: 'task' },
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
      { k: 'authors', l: '作者', t: 'text' },
      { k: 'year', l: '年份', t: 'number' },
      { k: 'venue', l: '期刊 / 会议', t: 'text' },
      { k: 'tags', l: '标签（逗号分隔）', t: 'text' },
      { k: 'project_id', l: '关联项目', t: 'project' },
      { k: 'read_state', l: '阅读状态', t: 'select', o: ['待读', '略读', '精读'] },
      { k: 'rating', l: '评分 1-5', t: 'number' },
      { k: 'note', l: '阅读笔记与摘要', t: 'textarea' }
    ] },
    events: { title: '日程', fields: [
      { k: 'title', l: '日程名称', t: 'text', req: true },
      { k: 'date', l: '日期', t: 'date' },
      { k: 'type', l: '类型', t: 'select', o: ['实验', '写作', '组会', '文献', '答辩'] },
      { k: 'project_id', l: '关联项目', t: 'project' }
    ] },
    analyses: { title: '分析记录', fields: [
      { k: 'title', l: '标题', t: 'text', req: true },
      { k: 'tool', l: '工具', t: 'select', o: ['Python', 'Stata', 'R'] },
      { k: 'dataset', l: '数据集', t: 'text' },
      { k: 'script', l: '脚本路径', t: 'text' },
      { k: 'project_id', l: '关联项目', t: 'project' },
      { k: 'result', l: '关键结论', t: 'textarea' }
    ] },
    reviews: { title: '复盘记录', fields: [
      { k: 'period', l: '周期', t: 'text', req: true },
      { k: 'content', l: '复盘内容', t: 'textarea' }
    ] },
    members: { title: '课题组成员', fields: [
      { k: 'name', l: '姓名', t: 'text', req: true },
      { k: 'role', l: '角色', t: 'text' },
      { k: 'email', l: '邮箱', t: 'text' }
    ] }
  };
  function openForm(collection, id) {
    const schema = FORMS[collection];
    if (!schema) return;
    const item = id ? S.find(collection, id) : {};
    const fields = schema.fields.map(function (f) {
      let v = item[f.k];
      if (v == null) v = f.t === 'date' ? today() : (f.t === 'number' ? 0 : '');
      let control = '';
      if (f.t === 'select') {
        control = '<select id="fld-' + f.k + '">' + f.o.map(function (o, i) {
          return '<option value="' + esc(o) + '" ' + (String(v) === String(o) ? 'selected' : '') + '>' + esc((f.labels && f.labels[i]) || o) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'member') {
        control = '<select id="fld-' + f.k + '">' + S.list('members').map(function (m) {
          return '<option value="' + m.id + '" ' + (v === m.id ? 'selected' : '') + '>' + esc(m.name) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'project') {
        control = '<select id="fld-' + f.k + '"><option value="">未关联</option>' + S.list('projects').map(function (p) {
          return '<option value="' + p.id + '" ' + (v === p.id ? 'selected' : '') + '>' + esc(p.title) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'task') {
        control = '<select id="fld-' + f.k + '"><option value="">未关联</option>' + S.list('tasks').map(function (t) {
          return '<option value="' + t.id + '" ' + (v === t.id ? 'selected' : '') + '>' + esc(t.title) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'textarea') {
        control = '<textarea id="fld-' + f.k + '">' + esc(v) + '</textarea>';
      } else {
        const type = f.t === 'number' ? 'number' : f.t;
        control = '<input type="' + type + '" id="fld-' + f.k + '" value="' + esc(v) + '">';
      }
      return '<div class="form-row"><label>' + esc(f.l) + (f.req ? ' *' : '') + '</label><div>' + control + '</div></div>';
    }).join('');
    showModal('<div class="modal-head"><h3>' + (id ? '编辑' : '新建') + schema.title + '</h3><button class="close-x" data-action="close-modal">×</button></div>' +
      '<div class="modal-body" style="display:grid;gap:11px">' + fields + '</div>' +
      '<div class="modal-foot"><button class="btn" data-action="close-modal">取消</button>' +
      '<button class="btn btn-primary" data-action="submit-form" data-collection="' + collection + '" data-id="' + esc(id || '') + '">保存</button></div>');
  }
  async function submitForm(collection, id) {
    const schema = FORMS[collection], obj = {};
    for (const f of schema.fields) {
      const el = document.getElementById('fld-' + f.k);
      if (!el) continue;
      let v = el.value;
      if (f.req && !String(v).trim()) { toast('请填写「' + f.l + '」'); return; }
      if (f.t === 'number') v = Number(v) || 0;
      if (f.k === 'tags') v = String(v).split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean);
      obj[f.k] = v;
    }
    if (collection === 'projects' && !id) obj.milestones = [];
    if (collection === 'tasks' && !id) obj.completed_at = null;
    if (collection === 'events' && !id) { obj.reminder = true; obj.done = false; }
    if (collection === 'analyses' && !id) obj.created_at = new Date().toISOString();
    if (collection === 'reviews' && !id) obj.created_at = new Date().toISOString();
    if (collection === 'members' && !id) { obj.color = paletteColor(); }
    if (collection === 'tasks' && id) {
      const prev = S.find('tasks', id);
      if (obj.status === 'done' && prev.status !== 'done') obj.completed_at = new Date().toISOString();
      if (obj.status !== 'done') obj.completed_at = null;
    }
    if (id && collection === 'experiments') await S.updateAsync(collection, id, obj);
    else if (id) S.update(collection, id, obj);
    else if (collection === 'experiments') await S.createAsync(collection, obj);
    else S.create(collection, obj);
    closeModal(); toast(id ? '已更新' : '已创建'); render();
  }
  function paletteColor() {
    const c = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#0EA5E9'];
    return c[S.list('members').length % c.length];
  }
  function showModal(inner) {
    document.getElementById('modal-root').innerHTML = '<div class="modal-mask" data-action="mask"><div class="modal" onclick="event.stopPropagation()">' + inner + '</div></div>';
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

  /* ---------- AI 流程 ---------- */
  function readReport() {
    state.reportForm = { date: val('rf-date'), projectId: val('rf-project'), hours: val('rf-hours'), content: val('rf-content') };
    return state.reportForm;
  }
  function generateAI() {
    const f = readReport();
    if (!f.content || f.content.trim().length < 8) { toast('请先填写今天做了什么（至少 8 个字）'); return; }
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
        toast('AI 汇总失败：' + (err && err.message ? err.message : '请检查服务端配置'));
      });
    }, 420);
  }
  function generateWeekly() {
    if (!S.isOnline() || state.weeklyLoading) return;
    state.weeklyLoading = true; state.weeklyDraft = null; render();
    S.weeklySummary({ period: today() }).then(function (result) {
      state.weeklyDraft = result; state.weeklyLoading = false; render();
    }).catch(function (err) {
      state.weeklyLoading = false; render(); toast('周报生成失败：' + (err && err.message ? err.message : '请重试'));
    });
  }
  function applyAI() {
    const d = state.aiDraft;
    if (!d) return;
    if (S.isOnline()) {
      state.aiLoading = true; render();
      S.applyDailySummary(d.payload, d.res).then(function () {
        state.aiDraft = null; state.aiLoading = false;
        state.reportForm = { date: today(), projectId: d.payload.projectId, hours: 6, content: '' };
        toast('已保存上报，并由服务器回写项目进度与任务状态'); render();
      }).catch(function (err) {
        state.aiLoading = false; render(); toast('保存上报失败：' + (err && err.message ? err.message : '请重试'));
      });
      return;
    }
    (d.res.taskUpdates || []).forEach(function (u) {
      S.update('tasks', u.taskId, { status: u.to, completed_at: u.to === 'done' ? new Date().toISOString() : null });
    });
    (d.res.progress || []).forEach(function (p) {
      const pr = S.find('projects', p.projectId);
      if (pr) S.update('projects', pr.id, { progress: Math.min(100, Math.max(0, Number(pr.progress) + Number(p.delta))) });
    });
    S.create('logs', {
      date: d.payload.date, author_id: d.payload.member.id, project_id: d.payload.projectId,
      content: d.payload.content, hours: d.payload.hours, summary: d.res, applied: true, created_at: new Date().toISOString()
    });
    state.aiDraft = null;
    state.reportForm = { date: today(), projectId: d.payload.projectId, hours: 6, content: '' };
    toast('已保存上报，并回写项目进度与任务状态');
    render();
  }

  /* ---------- 渲染 ---------- */
  const VIEWS = {
    overview: viewOverview, daily: viewDaily, projects: viewProjects, tasks: viewTasks,
    experiments: viewExperiments, papers: viewPapers, calendar: viewCalendar, analyses: viewAnalyses, reviews: viewReviews,
    members: viewMembers, settings: viewSettings
  };
  function render() {
    renderBrand(); renderNav(); renderMemberSwitch(); renderTopbar();
    document.getElementById('view').innerHTML = (VIEWS[state.view] || viewOverview)();
  }
  function setView(v) {
    if (!TITLES[v]) return;
    state.view = v;
    history.replaceState(null, '', '#/' + v);
    render();
    document.querySelector('.main').scrollTop = 0;
    window.scrollTo(0, 0);
  }
  async function uploadExperimentFiles(input) {
    const experimentId = input.dataset.experimentId;
    const files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!files.length) return;
    let uploaded = 0, failed = [];
    for (const file of files) {
      try { await S.uploadAttachment(experimentId, file); uploaded++; }
      catch (err) { failed.push(file.name + '：' + err.message); }
    }
    try { await S.refresh(); } catch (_) {}
    render();
    if (failed.length) toast(uploaded ? '已上传 ' + uploaded + ' 个，失败 ' + failed.length + ' 个' : failed[0]);
    else toast('已上传 ' + uploaded + ' 个附件');
  }
  async function downloadExperimentFile(button) {
    try {
      const blob = await S.downloadAttachment(button.dataset.experimentId, button.dataset.attachmentId);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = button.dataset.filename || '实验附件';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (err) { toast('下载失败：' + err.message); }
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'mask') { if (e.target === el) closeModal(); return; }
    if (a === 'close-modal') { closeModal(); return; }
    if (a === 'nav') { setView(el.dataset.view); return; }
    if (a === 'new') { openForm(el.dataset.collection); return; }
    if (a === 'edit') { openForm(el.dataset.collection, el.dataset.id); return; }
    if (a === 'pick-experiment-files') { const input = document.getElementById(el.dataset.inputId); if (input) input.click(); return; }
    if (a === 'download-experiment-file') { downloadExperimentFile(el); return; }
    if (a === 'delete-experiment-file') {
      if (!confirm('确定移除这个附件吗？')) return;
      S.removeAttachment(el.dataset.experimentId, el.dataset.attachmentId).then(function () {
        return S.refresh();
      }).then(function () { render(); toast('附件已移除'); }).catch(function (err) { toast('移除失败：' + err.message); });
      return;
    }
    if (a === 'del') {
      const c = el.dataset.collection, id = el.dataset.id;
      if (c === 'members' && id === AuthAdapter.current().id) { toast('不能移除当前登录成员'); return; }
      if (confirm('确定删除这条记录吗？此操作不可撤销。')) {
        if (c === 'experiments') {
          S.removeAsync(c, id).then(function () { return S.refresh(); }).then(function () { toast('已删除'); render(); }).catch(function (err) { toast('删除失败：' + err.message); });
        } else { S.remove(c, id); toast('已删除'); render(); }
      }
      return;
    }
    if (a === 'submit-form') { submitForm(el.dataset.collection, el.dataset.id || null).catch(function (err) { toast('保存失败：' + err.message); }); return; }
    if (a === 'advance-task') {
      const t = S.find('tasks', el.dataset.id);
      if (!t) return;
      const next = { todo: 'doing', doing: 'done', delayed: 'doing', done: 'done' }[t.status];
      if (next === t.status) { toast('任务已完成'); return; }
      S.update('tasks', t.id, { status: next, completed_at: next === 'done' ? new Date().toISOString() : null });
      toast('已推进为「' + statusText(next) + '」'); render(); return;
    }
    if (a === 'paper-filter') { state.paperFilter = el.dataset.value; render(); return; }
    if (a === 'cal-prev') { state.calOffset--; render(); return; }
    if (a === 'cal-next') { state.calOffset++; render(); return; }
    if (a === 'cal-today') { state.calOffset = 0; render(); return; }
    if (a === 'generate-ai') { generateAI(); return; }
    if (a === 'weekly-summary') { generateWeekly(); return; }
    if (a === 'apply-ai') { applyAI(); return; }
    if (a === 'discard-ai') { state.aiDraft = null; render(); return; }
    if (a === 'save-ai-config') {
      Promise.resolve(S.setAiConfig({ provider: val('ai-provider'), baseUrl: val('ai-base'), chatPath: val('ai-chat-path'), model: val('ai-model') })).then(function () {
        toast('AI 配置已保存'); render();
      }).catch(function (err) { toast('设置保存失败：' + err.message); });
      return;
    }
    if (a === 'rotate-join-code') {
      if (!S.can('manage')) return;
      if (!confirm('更新后旧邀请码立即失效，确定继续吗？')) return;
      S.request('/api/workspace/join-code/rotate', { method: 'POST' }).then(function (out) {
        const current = S.getState();
        current.workspace = out.workspace;
        toast('邀请码已更新'); render();
      }).catch(function (err) { toast('更新失败：' + err.message); });
      return;
    }
    if (a === 'enable-notifications') {
      if (!window.LabNotifications) return;
      window.LabNotifications.enable().then(function () { toast('电脑通知已开启'); }).catch(function (err) { toast(err.message || '通知开启失败'); });
      return;
    }
    if (a === 'logout') {
      AuthAdapter.signOut().then(function () { window.location.reload(); }).catch(function () { toast('退出登录失败'); });
      return;
    }
    if (a === 'reset-data') {
      if (confirm('重置会清空本机所有新增与修改的数据，恢复初始演示数据。确定继续？')) { S.reset(); state.aiDraft = null; state.reportForm = null; toast('已重置演示数据'); render(); }
      return;
    }
  });
  document.addEventListener('change', function (e) {
    const t = e.target;
    if (t.classList.contains('experiment-file-input')) { uploadExperimentFiles(t); return; }
    if (t.id === 'user-select') { AuthAdapter.switchTo(t.value); toast('已切换为 ' + AuthAdapter.current().name); render(); return; }
    if (t.classList.contains('paper-state')) { S.update('papers', t.dataset.id, { read_state: t.value }); toast('阅读状态已更新'); render(); return; }
    if (t.dataset.action === 'toggle-event') { S.update('events', t.dataset.id, { done: t.checked }); render(); return; }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'paper-search') {
      state.paperQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const box = document.getElementById('paper-search');
      if (box) { box.focus(); box.setSelectionRange(pos, pos); }
      return;
    }
    if (e.target.id === 'experiment-search') {
      state.experimentQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const box = document.getElementById('experiment-search');
      if (box) { box.focus(); box.setSelectionRange(pos, pos); }
      return;
    }
    if (e.target.id === 'rf-content' || e.target.id === 'rf-date' || e.target.id === 'rf-hours' || e.target.id === 'rf-project') readReport();
  });
  document.getElementById('quick-report').addEventListener('click', function () {
    setView('daily');
    const box = document.getElementById('rf-content');
    if (box) box.focus();
  });

  render();
  if (window.LabNotifications) window.LabNotifications.check();
  }
  S.init().then(boot).catch(function (err) {
    const root = document.getElementById('view');
    if (root) { root.textContent = '工作台加载失败：' + (err && err.message ? err.message : '请刷新重试'); root.className = 'empty'; }
  });
})();
