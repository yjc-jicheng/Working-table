/* Real account sign-in/register screen for the online adapter. */
(function () {
  'use strict';
  const root = document.getElementById('auth-root');
  if (!root) return;
  let mode = 'login';
  let busy = false;
  let workspaceMode = 'join';

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function render(error) {
    if (!window.LabStore || !window.LabStore.isOnline() || window.LabStore.isAuthenticated()) { root.innerHTML = ''; root.classList.remove('visible'); return; }
    root.classList.add('visible');
    root.innerHTML = '<div class="auth-card">' +
      '<div class="auth-mark">研</div><div class="auth-title">课题组工作台</div>' +
      '<div class="auth-sub">联网版 · 成员账号独立登录</div>' +
      '<div class="auth-tabs"><button class="auth-tab ' + (mode === 'login' ? 'active' : '') + '" data-auth-mode="login">登录</button><button class="auth-tab ' + (mode === 'register' ? 'active' : '') + '" data-auth-mode="register">注册账号</button></div>' +
      (error ? '<div class="auth-error">' + esc(error) + '</div>' : '') +
      '<form id="auth-form" class="auth-form">' +
      (mode === 'register' ? '<label>姓名<input name="name" required maxlength="80" autocomplete="name" placeholder="你的姓名"></label>' : '') +
      '<label>邮箱<input name="email" type="email" required autocomplete="email" placeholder="name@example.com"></label>' +
      (mode === 'register' ? '<label>手机号（可选）<input name="phone" autocomplete="tel" placeholder="用于通知和找回账号"></label>' : '') +
      (mode === 'register' ? '<label>加入方式<select id="workspace-mode" name="workspace_mode"><option value="join" ' + (workspaceMode === 'join' ? 'selected' : '') + '>加入已有课题组</option><option value="create" ' + (workspaceMode === 'create' ? 'selected' : '') + '>创建新课题组（我是 PI）</option></select></label>' : '') +
      (mode === 'register' && workspaceMode === 'join' ? '<label>课题组邀请码<input name="join_code" required maxlength="40" autocomplete="off" placeholder="向 PI 获取 10 位邀请码"></label>' : '') +
      (mode === 'register' && workspaceMode === 'create' ? '<label>课题组名称<input name="workspace_name" required maxlength="80" autocomplete="organization" placeholder="例如：智能感知与分子设计实验室"></label>' : '') +
      (mode === 'register' ? '<label>角色 / 学术身份<select name="academic_role"><option value="博士生">博士生</option><option value="硕士生">硕士生</option><option value="博士后">博士后</option><option value="研究助理">研究助理</option><option value="PI / 导师">PI / 导师</option></select></label>' : '') +
      '<label>密码<input name="password" type="password" required minlength="8" autocomplete="' + (mode === 'login' ? 'current-password' : 'new-password') + '" placeholder="至少 8 位"></label>' +
      '<button class="btn btn-primary auth-submit" type="submit" ' + (busy ? 'disabled' : '') + '>' + (busy ? '处理中…' : (mode === 'login' ? '登录工作台' : '创建账号并进入')) + '</button>' +
      (mode === 'register' ? '<div class="auth-hint">创建新组会自动成为 PI；加入已有组后，成员只能进入对应邀请码的课题组。</div>' : '<div class="auth-hint">账号数据保存在课题组服务器，浏览器不会保存密码。</div>') +
      '</form></div>';
  }
  root.addEventListener('click', function (event) {
    const button = event.target.closest('[data-auth-mode]');
    if (!button) return;
    mode = button.dataset.authMode; render();
  });
  root.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'workspace-mode') {
      workspaceMode = event.target.value === 'create' ? 'create' : 'join';
      render();
    }
  });
  root.addEventListener('submit', function (event) {
    if (!event.target || event.target.id !== 'auth-form') return;
    event.preventDefault(); if (busy) return;
    busy = true; render();
    const form = new FormData(event.target); const payload = {};
    form.forEach(function (value, key) { payload[key] = value; });
    const job = mode === 'login' ? window.LabStore.signIn(payload) : window.LabStore.register(payload);
    Promise.resolve(job).then(function () { window.location.reload(); }).catch(function (err) { busy = false; render(err.message || '操作失败，请稍后重试'); });
  });
  window.LabAuthUI = { render: render };
})();
