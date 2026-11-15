/* Real account sign-in/register screen for the online adapter. */
(function () {
  'use strict';
  const root = document.getElementById('auth-root');
  if (!root) return;
  let mode = 'login';
  let busy = false;
  let workspaceMode = 'join';
  let showPassword = false;
  // 切换页签或提交失败会重绘表单，已填写的内容保存在这里，避免让用户重填。
  const values = {};

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function v(name) { return esc(values[name] || ''); }
  function option(name, value, label) { return '<option value="' + esc(value) + '" ' + (values[name] === value ? 'selected' : '') + '>' + esc(label || value) + '</option>'; }
  function feature(title, text) {
    return '<li><span class="auth-check" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span><div><strong>' + title + '</strong><span>' + text + '</span></div></li>';
  }
  function render(error) {
    if (!window.LabStore || !window.LabStore.isOnline() || window.LabStore.isAuthenticated()) { root.innerHTML = ''; root.classList.remove('visible'); return; }
    const register = mode === 'register';
    root.classList.add('visible');
    root.innerHTML = '<div class="auth-shell">' +
      '<section class="auth-aside"><div class="auth-brand"><div class="auth-mark">研</div><span>课题组工作台</span></div>' +
      '<h1>把课题组的每一天，<br>整理成看得见的进展。</h1>' +
      '<ul class="auth-features">' +
      feature('每日上报与 AI 摘要', '成员写下当天工作，AI 整理成日报与周报，确认后才回写进度。') +
      feature('项目、任务与实验记录', '看板、阶段任务、实验过程和附件集中归档，随时可查。') +
      feature('按课题组隔离', '邀请码加入，数据保存在课题组自己的服务器上。') +
      '</ul></section>' +
      '<section class="auth-card">' +
      '<div class="auth-title">' + (register ? '创建账号' : '欢迎回来') + '</div>' +
      '<div class="auth-sub">' + (register ? '创建新课题组，或用邀请码加入已有课题组' : '登录后进入你的课题组工作台') + '</div>' +
      '<div class="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + !register + '" class="auth-tab ' + (!register ? 'active' : '') + '" data-auth-mode="login">登录</button><button type="button" role="tab" aria-selected="' + register + '" class="auth-tab ' + (register ? 'active' : '') + '" data-auth-mode="register">注册账号</button></div>' +
      (error ? '<div class="auth-error" role="alert">' + esc(error) + '</div>' : '') +
      '<form id="auth-form" class="auth-form">' +
      (register ? '<label>姓名<input name="name" required maxlength="80" autocomplete="name" placeholder="你的姓名" value="' + v('name') + '"></label>' : '') +
      '<label>邮箱<input name="email" type="email" required autocomplete="email" placeholder="name@example.com" value="' + v('email') + '"></label>' +
      (register ? '<label>手机号（可选）<input name="phone" autocomplete="tel" placeholder="用于通知和找回账号" value="' + v('phone') + '"></label>' : '') +
      (register ? '<label>加入方式<select id="workspace-mode" name="workspace_mode"><option value="join" ' + (workspaceMode === 'join' ? 'selected' : '') + '>加入已有课题组</option><option value="create" ' + (workspaceMode === 'create' ? 'selected' : '') + '>创建新课题组（我是 PI）</option></select></label>' : '') +
      (register && workspaceMode === 'join' ? '<label>课题组邀请码<input name="join_code" required maxlength="40" autocomplete="off" placeholder="向 PI 获取 10 位邀请码" value="' + v('join_code') + '"></label>' : '') +
      (register && workspaceMode === 'create' ? '<label>课题组名称<input name="workspace_name" required maxlength="80" autocomplete="organization" placeholder="例如：智能感知与分子设计实验室" value="' + v('workspace_name') + '"></label>' : '') +
      (register ? '<label>角色 / 学术身份<select name="academic_role">' + ['博士生', '硕士生', '博士后', '研究助理', 'PI / 导师'].map(function (role) { return option('academic_role', role); }).join('') + '</select></label>' : '') +
      '<label>密码<span class="auth-password"><input name="password" type="' + (showPassword ? 'text' : 'password') + '" required minlength="8" autocomplete="' + (register ? 'new-password' : 'current-password') + '" placeholder="至少 8 位" value="' + v('password') + '">' +
      '<button type="button" class="auth-eye" data-auth-eye aria-label="' + (showPassword ? '隐藏密码' : '显示密码') + '">' + (showPassword ? '隐藏' : '显示') + '</button></span></label>' +
      '<button class="btn btn-primary auth-submit" type="submit" ' + (busy ? 'disabled' : '') + '>' + (busy ? '处理中…' : (register ? '创建账号并进入' : '登录工作台')) + '</button>' +
      (register ? '<div class="auth-hint">创建新组会自动成为 PI；加入已有组后，成员只能进入对应邀请码的课题组。</div>' : '<div class="auth-hint">账号数据保存在课题组服务器，浏览器不会保存密码。</div>') +
      '</form></section></div>';
  }
  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-auth-eye]')) { showPassword = !showPassword; render(); const box = root.querySelector('input[name="password"]'); if (box) box.focus(); return; }
    const button = event.target.closest('[data-auth-mode]');
    if (!button || button.dataset.authMode === mode) return;
    mode = button.dataset.authMode; render();
  });
  root.addEventListener('input', function (event) {
    if (event.target && event.target.name) values[event.target.name] = event.target.value;
  });
  root.addEventListener('change', function (event) {
    if (event.target && event.target.name) values[event.target.name] = event.target.value;
    if (event.target && event.target.id === 'workspace-mode') {
      workspaceMode = event.target.value === 'create' ? 'create' : 'join';
      render();
    }
  });
  root.addEventListener('submit', function (event) {
    if (!event.target || event.target.id !== 'auth-form') return;
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.target); const payload = {};
    form.forEach(function (value, key) { payload[key] = value; values[key] = value; });
    busy = true; render();
    const job = mode === 'login' ? window.LabStore.signIn(payload) : window.LabStore.register(payload);
    Promise.resolve(job).then(function () { window.location.reload(); }).catch(function (err) {
      busy = false;
      if (mode === 'login') values.password = '';
      render(err.message || '操作失败，请稍后重试');
    });
  });
  window.LabAuthUI = { render: render };
})();
