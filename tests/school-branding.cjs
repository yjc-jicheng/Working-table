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

function faviconLinks(response) {
  const html = response.bytes.toString('utf8');
  const links = {};
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
    if (id && /^app-(?:favicon(?:-ico)?|apple-icon)$/.test(id)) {
      assert(!links[id], 'Duplicate icon link: ' + id);
      links[id] = { href: (tag.match(/\bhref="([^"]+)"/) || [])[1], type: (tag.match(/\btype="([^"]+)"/) || [])[1] };
      assert(html.indexOf(tag) < html.indexOf('<script'), 'Icon URL must exist in initial HTML before scripts');
    }
  }
  return links;
}

function assertIco(response) {
  assert.equal(response.headers.get('content-type'), 'image/x-icon');
  assert(response.bytes.length > 22, 'ICO must include image payload');
  assert.equal(response.bytes.readUInt16LE(0), 0);
  assert.equal(response.bytes.readUInt16LE(2), 1);
  const count = response.bytes.readUInt16LE(4);
  assert(count > 0);
  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    assert(entry + 16 <= response.bytes.length);
    const size = response.bytes.readUInt32LE(entry + 8), offset = response.bytes.readUInt32LE(entry + 12);
    assert(size && offset >= 6 + count * 16 && offset + size <= response.bytes.length, 'ICO directory must point to a complete image');
  }
}

function icoPng(response) {
  assertIco(response);
  assert.equal(response.bytes.readUInt16LE(4), 1);
  const size = response.bytes.readUInt32LE(14), offset = response.bytes.readUInt32LE(18);
  return response.bytes.subarray(offset, offset + size);
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
  let piCookie, memberCookie, otherCookie, originalWorkspaceId, otherWorkspace, taskId, stableCustomUrl;

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
    assert.equal(registered.data.workspace.school_favicon, first.logo + '?v=2');
    assert.equal(registered.data.workspace.school_favicon_ico, first.logo.replace(/\.png$/, '.ico') + '?v=2');
  });

  await check('initial HTML contains selected raster and true ICO URLs before JavaScript without exposing group metadata', async () => {
    const own = await workspace(piCookie);
    for (const route of ['/', '/index.html']) {
      const response = status(await request(route, { cookie: piCookie }), 200);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal(response.headers.get('vary'), 'Cookie');
      const links = faviconLinks(response);
      assert.equal(links['app-favicon'].href, first.logo + '?v=2');
      assert.equal(links['app-favicon'].type, 'image/png');
      assert.equal(links['app-favicon-ico'].href, first.logo.replace(/\.png$/, '.ico') + '?v=2');
      assert.equal(links['app-apple-icon'].href, first.logo + '?v=2');
      assertIco(status(await request(links['app-favicon-ico'].href), 200));
      assert.equal(status(await request(links['app-favicon'].href), 200).headers.get('content-type'), 'image/png');
      const text = response.bytes.toString('utf8');
      for (const sensitive of [own.id, own.name, own.join_code]) assert(!text.includes(sensitive));
      const anonymous = status(await request(route), 200);
      const anonymousLinks = faviconLinks(anonymous);
      assert.equal(anonymousLinks['app-favicon'].href, '/favicon.png?v=2');
      assert.equal(anonymousLinks['app-favicon-ico'].href, '/favicon.ico?v=2');
      assert(!anonymous.bytes.toString('utf8').includes(first.logo));
    }
    const head = status(await request('/', { method: 'HEAD', cookie: piCookie }), 200);
    assert.equal(head.bytes.length, 0);
    assert(Number(head.headers.get('content-length')) > 0);
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
    assertIco(status(await request('/favicon.ico', { cookie: piCookie }), 200));
    status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_id: 'custom', school_name: '自定义测试大学', school_logo: customLogo } }), 200);
  });

  await check('favicon serves the logged-in group privately, supports HEAD, and exposes no anonymous brand', async () => {
    status(await request('/api/workspace'), 401);
    const anonymous = status(await request('/favicon.ico'), 200);
    assertIco(anonymous);
    assert.deepEqual(anonymous.bytes, await fs.readFile(path.join(appRoot, 'favicon.ico')));
    const own = status(await request('/favicon.ico', { cookie: piCookie }), 200);
    assert.deepEqual(icoPng(own), png);
    assert.equal(own.headers.get('cache-control'), 'private, no-store');
    assert.equal(own.headers.get('vary'), 'Cookie');
    assert.equal(own.headers.get('x-content-type-options'), 'nosniff');
    const head = status(await request('/favicon.ico', { method: 'HEAD', cookie: piCookie }), 200);
    assert.equal(head.bytes.length, 0);
    assert.equal(Number(head.headers.get('content-length')), own.bytes.length);
    const other = status(await request('/favicon.ico', { cookie: otherCookie }), 200);
    assertIco(other);
    assert.deepEqual(other.bytes, status(await request(second.logo.replace(/\.png$/, '.ico')), 200).bytes);
    assert.deepEqual(status(await request('/favicon.ico', { cookie: 'lab_session=invalid' }), 200).bytes, anonymous.bytes);
    const neutralPng = status(await request('/favicon.png'), 200);
    assert.equal(neutralPng.headers.get('content-type'), 'image/png');
    assert.deepEqual(neutralPng.bytes, await fs.readFile(path.join(appRoot, 'favicon.png')));
    for (const route of ['/favicon.png', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png']) {
      assert.deepEqual(status(await request(route, { cookie: piCookie }), 200).bytes, png);
    }
  });

  await check('custom icon capabilities work without cookies, keep metadata private, and reject outdated or forged URLs', async () => {
    const own = await workspace(piCookie);
    stableCustomUrl = own.school_favicon;
    assert.match(stableCustomUrl, /^\/school-icons\/[a-f0-9]{64}\.png\?v=2$/);
    assert.match(own.school_favicon_ico, /^\/school-icons\/[a-f0-9]{64}\.ico\?v=2$/);
    assert(!stableCustomUrl.includes(own.id));
    const image = status(await request(stableCustomUrl), 200);
    assert.deepEqual(image.bytes, png);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual(status(await request(stableCustomUrl, { cookie: otherCookie }), 200).bytes, png);
    assert.deepEqual(icoPng(status(await request(own.school_favicon_ico), 200)), png);
    const head = status(await request(stableCustomUrl, { method: 'HEAD' }), 200);
    assert.equal(head.bytes.length, 0);
    assert.equal(Number(head.headers.get('content-length')), png.length);
    const links = faviconLinks(status(await request('/', { cookie: piCookie }), 200));
    assert.equal(links['app-favicon'].href, stableCustomUrl);
    assert.equal(links['app-favicon-ico'].href, own.school_favicon_ico);
    assert(!status(await request('/'), 200).bytes.toString('utf8').includes(stableCustomUrl));
    for (const route of [stableCustomUrl.replace('.png', '.jpg'), '/school-icons/' + '0'.repeat(64) + '.png', '/school-icons/' + own.id + '.png']) status(await request(route), 404);
    const endpoints = ['/api/auth/me', '/api/bootstrap', '/api/workspace'];
    for (const endpoint of endpoints) assert.equal(status(await request(endpoint, { cookie: piCookie }), 200).data.workspace.school_favicon, stableCustomUrl);
    const login = status(await request('/api/auth/login', { method: 'POST', body: { email: 'pi-one@example.test', password: 'Isolated-test-password-123' } }), 200);
    assert.equal(login.data.workspace.school_favicon, stableCustomUrl);
    assert.equal(status(await request('/api/workspace/join-code/rotate', { method: 'POST', cookie: piCookie, body: {} }), 200).data.workspace.school_favicon, stableCustomUrl);
    assert.equal((await workspace(otherCookie)).school_favicon, second.logo + '?v=2');

    const keyPath = path.join(appRoot, 'server/data/school-icon-key');
    const beforeKey = await fs.readFile(keyPath);
    assert.equal(beforeKey.length, 32);
    assert.equal((await fs.stat(keyPath)).mode & 0o777, 0o600);
    await stop(); await start();
    assert.equal((await workspace(piCookie)).school_favicon, stableCustomUrl);
    assert.deepEqual(await fs.readFile(keyPath), beforeKey);
    assert.deepEqual(status(await request(stableCustomUrl), 200).bytes, png);

    const changedPng = await fs.readFile(path.join(appRoot, first.logo));
    const changed = status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_logo: 'data:image/png;base64,' + changedPng.toString('base64') } }), 200).data.workspace;
    assert.notEqual(changed.school_favicon, stableCustomUrl);
    status(await request(stableCustomUrl), 404);
    assert.deepEqual(status(await request(changed.school_favicon), 200).bytes, changedPng);
    stableCustomUrl = changed.school_favicon;
    const disk = JSON.parse(await fs.readFile(path.join(appRoot, 'server/data/lab-workbench.json'), 'utf8'));
    assert(disk.workspaces.every(current => !Object.hasOwn(current, 'school_favicon') && !Object.hasOwn(current, 'school_favicon_ico')));
  });

  await check('non-PNG custom icons keep their true MIME and do not produce a fake ICO link', async () => {
    const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
    const updated = status(await request('/api/workspace', { method: 'PATCH', cookie: piCookie, body: { school_logo: 'data:image/webp;base64,' + webp.toString('base64') } }), 200).data.workspace;
    assert.match(updated.school_favicon, /^\/school-icons\/[a-f0-9]{64}\.webp\?v=2$/);
    assert.equal(updated.school_favicon_ico, '');
    const image = status(await request(updated.school_favicon), 200);
    assert.equal(image.headers.get('content-type'), 'image/webp');
    assert.deepEqual(image.bytes, webp);
    const links = faviconLinks(status(await request('/', { cookie: piCookie }), 200));
    assert.equal(links['app-favicon'].href, updated.school_favicon);
    assert.equal(links['app-favicon'].type, 'image/webp');
    assert.equal(links['app-favicon-ico'], undefined);
    status(await request(updated.school_favicon.replace('.webp', '.ico')), 404);
    assert.deepEqual(status(await request('/favicon.ico', { cookie: piCookie }), 200).bytes, status(await request('/favicon.ico'), 200).bytes);
    assertIco(status(await request('/favicon.ico', { cookie: piCookie }), 200));
    status(await request(stableCustomUrl), 404);
  });

  await check('every bundled school logo has real PNG and ICO responses and unknown/private paths remain inaccessible', async () => {
    for (const school of schools.list) {
      const image = status(await request(school.logo), 200);
      assert.equal(image.headers.get('content-type'), 'image/png', school.id);
      assert.deepEqual(image.bytes.subarray(0, 8), png.subarray(0, 8), school.id);
      assertIco(status(await request(school.logo.replace(/\.png$/, '.ico')), 200));
    }
    for (const route of [
      '/.env', '/server/server.js', '/server/data/lab-workbench.json', '/server/data/school-icon-key', '/assets/schools/',
      '/assets/schools/nonexistent.png', '/assets/schools/nonexistent.ico', '/assets/schools/SOURCES.md',
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
    assert.deepEqual(status(await request('/favicon.ico', { cookie: piCookie }), 200).bytes, status(await request(first.logo.replace(/\.png$/, '.ico')), 200).bytes);
  });
}

main().then(() => console.log('Passed ' + checks + ' isolated HTTP regression checks.')).catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
}).finally(async () => {
  await stop();
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
});
