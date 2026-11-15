'use strict';

// Exercise real HTTP routes against a disposable app copy. Never uses a live DB.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');

const sourceRoot = path.resolve(__dirname, '..');
const schools = require('../js/schools.js');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII=', 'base64');
const customLogo = 'data:image/png;base64,' + png.toString('base64');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let tempRoot, appRoot, child, baseUrl, serverOutput = '', checks = 0;

async function check(name, fn) {
  await fn();
  checks++;
  console.log('ok ' + checks + ' - ' + name);
}

async function availablePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close(err => err ? reject(err) : resolve()));
  return port;
}

async function request(route, { method = 'GET', cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(baseUrl + route, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual', signal: AbortSignal.timeout(5000)
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || '';
  return {
    status: response.status, headers: response.headers, bytes,
    data: bytes.length && contentType.includes('application/json') ? JSON.parse(bytes.toString('utf8')) : null,
    cookie: (response.headers.get('set-cookie') || '').split(';')[0]
  };
}

function status(response, expected) {
  assert.equal(response.status, expected, response.data && response.data.message);
  return response;
}

async function start() {
  const port = await availablePort();
  baseUrl = 'http://127.0.0.1:' + port;
  serverOutput = '';
  child = spawn(process.execPath, ['server/server.js'], {
    cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', COOKIE_SECURE: 'false', AI_API_KEY: '', AI_BASE_URL: '', AI_MODEL: '' }
  });
  child.on('error', err => { serverOutput += err.message; });
  const collect = chunk => { serverOutput = (serverOutput + chunk).slice(-4000); };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Test server exited: ' + serverOutput);
    try { if ((await request('/api/health')).status === 200) return; } catch (_) {}
    await delay(100);
  }
  throw new Error('Test server failed to start: ' + serverOutput);
}

async function stop() {
  if (!child || !child.pid || child.exitCode !== null || child.signalCode !== null) { child = null; return; }
  const running = child;
  const exited = new Promise(resolve => running.once('exit', resolve));
  let killTimer;
  running.kill('SIGTERM');
  await Promise.race([exited, new Promise(resolve => { killTimer = setTimeout(resolve, 3000); })]);
  clearTimeout(killTimer);
  if (running.exitCode === null && running.signalCode === null) { running.kill('SIGKILL'); await exited; }
  child = null;
}

async function register(email, workspaceMode, extra = {}) {
  return request('/api/auth/register', {
    method: 'POST', body: {
      name: '测试成员', email, password: 'Isolated-test-password-123',
      workspace_mode: workspaceMode, ...extra
    }
  });
}

async function workspace(cookie) {
  return status(await request('/api/workspace', { cookie }), 200).data.workspace;
}

function branding(value) {
  return { name: value.name, timezone: value.timezone, school_id: value.school_id, school_name: value.school_name, school_logo: value.school_logo };
}

async function main() {
  assert(schools.list.length >= 2, 'At least two school presets are needed for isolation checks');
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-school-branding-'));
  appRoot = path.join(tempRoot, 'app');
  await fs.cp(sourceRoot, appRoot, {
    recursive: true,
    filter: file => {
      const relative = path.relative(sourceRoot, file).split(path.sep).join('/');
      return relative !== '.env' && !relative.split('/').includes('.git') && relative !== 'server/data' && !relative.startsWith('server/data/');
    }
  });
  await fs.writeFile(path.join(appRoot, '.env'), 'ISOLATED_TEST_SENTINEL=private\n');
  await start();

  const first = schools.list[0], second = schools.list[1];
  let piCookie, memberCookie, otherCookie, originalWorkspaceId, otherWorkspace, taskId;

  await check('registration canonicalizes presets and rejects unknown schools without reserving the account', async () => {
    status(await register('pi-one@example.test', 'create', { workspace_name: '校徽测试课题组甲', school_id: 'unknown-university' }), 400);
    const registered = status(await register('pi-one@example.test', 'create', {
      workspace_name: '校徽测试课题组甲', school_id: first.id, school_name: '伪造学校', school_logo: 'https://invalid.example/logo.svg'
    }), 201);
    piCookie = registered.cookie;
    originalWorkspaceId = registered.data.workspace.id;
    assert(piCookie.startsWith('lab_session='));
    assert.equal(registered.data.user.role, 'pi');
    assert.equal(registered.data.workspace.school_name, first.name);
    assert.equal(registered.data.workspace.school_logo, first.logo);
  });

  await check('joining inherits the group brand and cannot request PI privileges', async () => {
    const own = await workspace(piCookie);
    const joined = status(await register('member@example.test', 'join', {
      join_code: own.join_code, role: 'pi', school_id: 'unknown-university', school_name: '伪造学校', school_logo: 'javascript:alert(1)'
    }), 201);
    memberCookie = joined.cookie;
    assert.equal(joined.data.user.role, 'member');
    assert.equal(joined.data.workspace.id, own.id);
    assert.equal(joined.data.workspace.school_id, first.id);
    assert.equal((await workspace(memberCookie)).school_logo, first.logo);
  });

  await check('only the PI can change branding and each PI only changes their current group', async () => {
    const registered = status(await register('pi-two@example.test', 'create', { workspace_name: '校徽测试课题组乙', school_id: second.id }), 201);
    otherCookie = registered.cookie;
    otherWorkspace = registered.data.workspace;
    status(await request('/api/workspace', { method: 'PATCH', cookie: memberCookie, body: { role: 'pi', school_id: second.id, workspace_id: otherWorkspace.id } }), 403);
    status(await request('/api/workspace/' + otherWorkspace.id, { method: 'PATCH', cookie: piCookie, body: { school_id: first.id } }), 404);
    const updated = status(await request('/api/workspace', {
      method: 'PATCH', cookie: piCookie,
      body: { workspace_id: otherWorkspace.id, school_id: 'custom', school_name: '自定义测试大学', school_logo: customLogo }
    }), 200).data.workspace;
    assert.equal(updated.id, originalWorkspaceId);
    assert.equal(updated.school_logo, customLogo);
    assert.deepEqual(branding(await workspace(otherCookie)), branding(otherWorkspace));
    assert.equal(status(await request('/api/auth/me', { cookie: memberCookie }), 200).data.user.role, 'member');
  });

  await check('invalid school settings leave the group name and brand unchanged', async () => {
    const oversized = Buffer.alloc(200 * 1024 + 1);
    png.copy(oversized, 0, 0, 8);
    const badSettings = [
      { school_id: 'unknown-university' },
      { school_id: null },
      { school_id: 'custom', school_name: '短' },
      { school_id: 'custom', school_name: null },
      { school_id: 'custom', school_name: '长'.repeat(81) },
      { school_id: 'custom', school_logo: 'https://invalid.example/logo.png' },
      { school_id: 'custom', school_logo: 'data:image/svg+xml;base64,PHN2Zz4=' },
      { school_id: 'custom', school_logo: null },
      { school_id: 'custom', school_logo: 'data:image/png;base64,YQ=' },
      { school_id: 'custom', school_logo: 'data:image/png;base64,YQ==' },
      { school_id: 'custom', school_logo: 'data:image/jpeg;base64,' + png.toString('base64') },
      { school_id: 'custom', school_logo: 'data:image/png;base64,' + oversized.toString('base64') }
    ];
    const before = branding(await workspace(piCookie));
    for (const bad of badSettings) {
      status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { name: '不应保存的名称', timezone: 'UTC', school_name: '自定义测试大学', ...bad } }), 400);
      assert.deepEqual(branding(await workspace(piCookie)), before);
    }
  });

  await check('custom PNG roundtrips, survives name-only updates, and can be cleared', async () => {
    const renamed = status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_name: '更名测试大学' } }), 200).data.workspace;
    assert.equal(renamed.school_name, '更名测试大学');
    assert.equal(renamed.school_logo, customLogo);
    assert.equal((await workspace(memberCookie)).school_logo, customLogo);
    const cleared = status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_id: '' } }), 200).data.workspace;
    assert.equal(cleared.school_id, ''); assert.equal(cleared.school_name, ''); assert.equal(cleared.school_logo, '');
    const withoutLogo = status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_id: 'custom', school_name: '暂未上传校徽大学' } }), 200).data.workspace;
    assert.equal(withoutLogo.school_logo, '');
    assert.equal(status(await request('/favicon.ico', { cookie: piCookie }), 200).headers.get('content-type'), 'image/svg+xml');
    status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_id: 'custom', school_name: '自定义测试大学', school_logo: customLogo } }), 200);
  });

  await check('favicon serves the logged-in group privately, supports HEAD, and exposes no anonymous brand', async () => {
    status(await request('/api/workspace'), 401);
    const neutral = status(await request('/favicon.svg'), 200);
    const anonymous = status(await request('/favicon.ico'), 200);
    assert.deepEqual(anonymous.bytes, neutral.bytes);
    const own = status(await request('/favicon.ico', { cookie: piCookie }), 200);
    assert.equal(own.headers.get('content-type'), 'image/png');
    assert.deepEqual(own.bytes, png);
    assert.equal(own.headers.get('cache-control'), 'private, no-store');
    assert.equal(own.headers.get('vary'), 'Cookie');
    assert.equal(own.headers.get('x-content-type-options'), 'nosniff');
    const head = status(await request('/favicon.ico', { method: 'HEAD', cookie: piCookie }), 200);
    assert.equal(head.bytes.length, 0);
    assert.equal(Number(head.headers.get('content-length')), png.length);
    const other = status(await request('/favicon.ico', { cookie: otherCookie }), 200);
    assert.deepEqual(other.bytes, status(await request(second.logo), 200).bytes);
    assert.deepEqual(status(await request('/favicon.ico', { cookie: 'lab_session=invalid' }), 200).bytes, neutral.bytes);
  });

  await check('every bundled school logo has a PNG response and unknown/private paths remain inaccessible', async () => {
    for (const school of schools.list) {
      const image = status(await request(school.logo), 200);
      assert.equal(image.headers.get('content-type'), 'image/png', school.id);
      assert.deepEqual(image.bytes.subarray(0, 8), png.subarray(0, 8), school.id);
    }
    for (const route of [
      '/.env', '/server/server.js', '/server/data/lab-workbench.json', '/assets/schools/',
      '/assets/schools/nonexistent.png', '/assets/schools/SOURCES.md',
      '/assets/schools/%2e%2e%2f%2e%2e%2fserver/server.js', '/%2eenv', '/.git/config'
    ]) status(await request(route), 404);
  });

  await check('business records remain isolated while school settings change', async () => {
    const created = status(await request('/api/tasks', { method: 'POST', cookie: piCookie, body: { title: '重启持久化测试任务', status: 'doing' } }), 201);
    taskId = created.data.item.id;
    assert.equal(status(await request('/api/tasks', { cookie: otherCookie }), 200).data.items.length, 0);
    status(await request('/api/tasks/' + taskId, { method: 'PATCH', cookie: otherCookie, body: { title: '不得修改外组任务' } }), 404);
  });

  await check('legacy workspaces without school fields still preserve sessions and business records', async () => {
    await stop();
    const databaseFile = path.join(appRoot, 'server/data/lab-workbench.json');
    const fixture = JSON.parse(await fs.readFile(databaseFile, 'utf8'));
    for (const current of [...fixture.workspaces, fixture.workspace]) {
      for (const field of ['school_id', 'school_name', 'school_logo']) delete current[field];
    }
    await fs.writeFile(databaseFile, JSON.stringify(fixture));
    await start();
    const legacy = await workspace(piCookie);
    assert.equal(legacy.id, originalWorkspaceId);
    assert.equal(legacy.school_id, ''); assert.equal(legacy.school_name, ''); assert.equal(legacy.school_logo, '');
    assert(status(await request('/api/tasks', { cookie: piCookie }), 200).data.items.some(task => task.id === taskId && task.title === '重启持久化测试任务'));
    assert.equal((await workspace(memberCookie)).id, originalWorkspaceId);
  });

  await check('school branding and existing sessions survive an ordinary server restart', async () => {
    status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_id: first.id } }), 200);
    await stop(); await start();
    const persisted = await workspace(piCookie);
    assert.equal(persisted.school_id, first.id);
    assert.equal(persisted.school_name, first.name);
    assert.equal(persisted.school_logo, first.logo);
    assert.equal((await workspace(memberCookie)).school_id, first.id);
    assert(status(await request('/api/tasks', { cookie: piCookie }), 200).data.items.some(task => task.id === taskId));
    assert.deepEqual(status(await request('/favicon.ico', { cookie: piCookie }), 200).bytes, status(await request(first.logo), 200).bytes);
  });
}

main().then(() => console.log('Passed ' + checks + ' isolated HTTP regression checks.')).catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
}).finally(async () => {
  await stop();
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
});
