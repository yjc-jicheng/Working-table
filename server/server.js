/*
 * Lab Workbench MVP server.
 *
 * The MVP intentionally uses a JSON document store so it can run on bdyy
 * without a database service. Every record carries workspace_id and the
 * route layer enforces membership permissions; the storage module can later
 * be replaced with PostgreSQL without changing the HTTP contract.
 */
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const schools = require('../js/schools.js');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'lab-workbench.json');
const ATTACHMENT_DIR = path.join(DATA_DIR, 'attachments');
const SCHOOL_ICON_KEY_FILE = path.join(DATA_DIR, 'school-icon-key');
const PORT = Number(process.env.PORT || 9013);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const MAX_BODY = 1024 * 1024 * 2;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_SCHOOL_LOGO_BYTES = 200 * 1024;
const SCHOOL_LOGO_PATHS = new Set(schools.list.map(school => school.logo).filter(logo => /^\/assets\/schools\/[a-z0-9_-]+\.png$/.test(logo)));
const SCHOOL_ICO_PATHS = new Set([...SCHOOL_LOGO_PATHS].map(logo => logo.replace(/\.png$/, '.ico')));
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const ENV_AI_BASE_URL = String(process.env.AI_BASE_URL || '').replace(/\/$/, '');
const ENV_AI_API_KEY = String(process.env.AI_API_KEY || '');
const ENV_AI_MODEL = process.env.AI_MODEL || '';
const ENV_AI_PROVIDER = process.env.AI_PROVIDER || '国模';
const ENV_AI_CHAT_PATH = process.env.AI_CHAT_PATH || '/chat/completions';

const COLLECTIONS = new Set([
  'projects', 'tasks', 'papers', 'events', 'analyses', 'experiments', 'reviews',
  'daily_logs', 'weekly_reports'
]);
const COLLECTION_ALIASES = { logs: 'daily_logs' };
const ROLES = new Set(['pi', 'member']);
const COLORS = ['#6366F1', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];
const ATTACHMENT_TYPES = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.csv': 'text/csv; charset=utf-8', '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

let db = null;
let writeChain = Promise.resolve();
let schoolIconKey = null;

function now() { return new Date().toISOString(); }
function id(prefix) { return prefix + '_' + crypto.randomBytes(9).toString('hex'); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function email(value) { return String(value || '').trim().toLowerCase(); }
function safeText(value, max = 10000) { return String(value == null ? '' : value).trim().slice(0, max); }
function bool(value) { return value === true || value === 'true' || value === 1 || value === '1'; }
function roleIsPI(user) { return user && user.role === 'pi'; }
function effectiveAIConfig() {
  const stored = db && db.settings && db.settings.ai || {};
  return {
    provider: safeText(stored.provider || ENV_AI_PROVIDER, 80) || ENV_AI_PROVIDER,
    baseUrl: String(stored.baseUrl || ENV_AI_BASE_URL || '').trim().replace(/\/$/, ''),
    model: safeText(stored.model || ENV_AI_MODEL, 200),
    chatPath: safeText(stored.chatPath || ENV_AI_CHAT_PATH, 300) || '/chat/completions',
    apiKey: ENV_AI_API_KEY
  };
}
function publicAIConfig() {
  const config = effectiveAIConfig();
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    chatPath: config.chatPath,
    configured: Boolean(config.baseUrl && config.apiKey && config.model)
  };
}
function slug(value) {
  const text = safeText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return text || 'workspace';
}
function joinCode() { return crypto.randomBytes(5).toString('hex').toUpperCase(); }
function newWorkspace(name, ownerId) {
  return {
    id: id('ws'), name: safeText(name, 80) || '我的课题组', slug: slug(name),
    join_code: joinCode(), owner_id: ownerId || null,
    timezone: process.env.TIMEZONE || 'Asia/Shanghai', plan: 'free',
    school_id: '', school_name: '', school_logo: '',
    subscription_status: 'active', created_at: now()
  };
}
function workspaceForUser(user) {
  if (!user) return null;
  return (db.workspaces || []).find(w => w.id === user.workspace_id) || null;
}
function workspaceByJoinCode(code) {
  const normalized = safeText(code, 40).replace(/\s+/g, '').toUpperCase();
  return (db.workspaces || []).find(w => String(w.join_code || '').toUpperCase() === normalized) || null;
}
function activeWorkspace(user) { return workspaceForUser(user) || (db.workspaces || [])[0] || null; }
function decodeSchoolLogo(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_SCHOOL_LOGO_BYTES / 3) * 4 + 40) return null;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) return null;
  const data = Buffer.from(match[2], 'base64');
  if (!data.length || data.length > MAX_SCHOOL_LOGO_BYTES || data.toString('base64') !== match[2]) return null;
  const valid = match[1] === 'png' ? data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) :
    match[1] === 'jpeg' ? data.subarray(0, 3).equals(Buffer.from([255, 216, 255])) :
      data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
  return valid ? { data, type: 'image/' + match[1] } : null;
}
function pngIco(data) {
  if (data.length < 33 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      data.readUInt32BE(8) !== 13 || data.toString('ascii', 12, 16) !== 'IHDR') return null;
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (!width || !height || width > 256 || height > 256) return null;
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = width === 256 ? 0 : width; header[7] = height === 256 ? 0 : height;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(data.length, 14); header.writeUInt32LE(22, 18);
  return Buffer.concat([header, data]);
}
async function ensureSchoolIconKey() {
  try {
    const handle = await fsp.open(SCHOOL_ICON_KEY_FILE, 'wx', 0o600);
    try { await handle.writeFile(crypto.randomBytes(32)); } finally { await handle.close(); }
  } catch (err) { if (err.code !== 'EEXIST') throw err; }
  schoolIconKey = await fsp.readFile(SCHOOL_ICON_KEY_FILE);
  if (schoolIconKey.length !== 32) throw new Error('校徽访问密钥文件格式不正确');
  await fsp.chmod(SCHOOL_ICON_KEY_FILE, 0o600);
}
function schoolIconToken(workspace) {
  return crypto.createHmac('sha256', schoolIconKey).update('school-icon-v2\0').update(String(workspace.id)).update('\0').update(workspace.school_logo).digest('hex');
}
function schoolIcons(workspace) {
  const fallback = { raster: '/favicon.png?v=2', ico: '/favicon.ico?v=2', type: 'image/png' };
  if (!workspace) return fallback;
  const school = schools.find(workspace.school_id);
  if (school && SCHOOL_LOGO_PATHS.has(school.logo)) return { raster: school.logo + '?v=2', ico: school.logo.replace(/\.png$/, '.ico') + '?v=2', type: 'image/png' };
  if (workspace.school_id !== 'custom') return fallback;
  const image = decodeSchoolLogo(workspace.school_logo);
  if (!image) return fallback;
  const base = '/school-icons/' + schoolIconToken(workspace);
  return {
    raster: base + '.' + (image.type === 'image/jpeg' ? 'jpg' : image.type.slice(6)) + '?v=2',
    ico: image.type === 'image/png' && pngIco(image.data) ? base + '.ico?v=2' : '', type: image.type
  };
}
function schoolPage(workspace) {
  const icons = schoolIcons(workspace);
  const revision = crypto.createHmac('sha256', schoolIconKey).update('school-page-v3\0').update(icons.raster).update('\0').update(icons.ico).digest('hex');
  return '/index.html?school=v3-' + revision;
}
function publicWorkspace(workspace) {
  if (!workspace) return null;
  const icons = schoolIcons(workspace);
  return Object.assign({}, workspace, { school_favicon: icons.raster, school_favicon_ico: icons.ico, school_page: schoolPage(workspace) });
}
function schoolSettings(body, current = {}) {
  if (!['school_id', 'school_name', 'school_logo'].some(key => Object.prototype.hasOwnProperty.call(body, key))) return { fields: null };
  if (body.school_id !== undefined && typeof body.school_id !== 'string') return { error: '请选择有效的学校' };
  const schoolId = String(body.school_id === undefined ? current.school_id || '' : body.school_id).trim();
  if (!schoolId) return { fields: { school_id: '', school_name: '', school_logo: '' } };
  if (schoolId !== 'custom') {
    const school = schools.find(schoolId);
    return school && SCHOOL_LOGO_PATHS.has(school.logo) ? { fields: { school_id: school.id, school_name: school.name, school_logo: school.logo } } : { error: '请选择有效的学校' };
  }
  if (body.school_name !== undefined && typeof body.school_name !== 'string') return { error: '请填写学校名称' };
  const name = String(body.school_name === undefined ? current.school_name || '' : body.school_name).trim();
  if (name.length < 2 || name.length > 80) return { error: '学校名称需为 2–80 个字符' };
  const logo = body.school_logo === undefined ? (current.school_id === 'custom' ? current.school_logo || '' : '') : body.school_logo;
  if (logo !== '' && !decodeSchoolLogo(logo)) return { error: '校徽需为 200 KB 以内的 PNG、JPG 或 WebP 图片' };
  return { fields: { school_id: 'custom', school_name: name, school_logo: logo } };
}
function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id, name: user.name, email: user.email, phone: user.phone || '',
    role: user.role, academic_role: user.academic_role || '', color: user.color,
    status: user.status, created_at: user.created_at
  };
}
function defaultDb() {
  const workspace = newWorkspace(process.env.WORKSPACE_NAME || '我的课题组');
  workspace.id = 'ws_default';
  workspace.slug = 'default';
  return {
    version: 2,
    workspaces: [workspace],
    // Kept as a compatibility alias for older exports. New code uses workspaces.
    workspace,
    users: [],
    projects: [], tasks: [], papers: [], events: [], analyses: [], experiments: [],
    daily_logs: [], weekly_reports: [], reviews: [],
    sessions: {}, notification_subscriptions: [], notification_preferences: [],
    audit_logs: [], settings: { ai: { provider: ENV_AI_PROVIDER, baseUrl: ENV_AI_BASE_URL, model: ENV_AI_MODEL, chatPath: ENV_AI_CHAT_PATH } }
  };
}

async function ensureDb() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!db) {
    try { db = JSON.parse(await fsp.readFile(DATA_FILE, 'utf8')); }
    catch (_) { db = defaultDb(); await persist(); }
    normalizeDb();
  }
  return db;
}
function normalizeDb() {
  const blank = defaultDb();
  for (const key of Object.keys(blank)) {
    if (key === 'workspace') db[key] = Object.assign(blank[key], db[key] || {});
    else if (key === 'settings') {
      db.settings = Object.assign({}, blank.settings, db.settings || {});
      db.settings.ai = Object.assign({}, blank.settings.ai, db.settings.ai || {});
    }
    else if (db[key] == null) db[key] = blank[key];
  }
  if (!Array.isArray(db.workspaces) || !db.workspaces.length) {
    const legacy = db.workspace && db.workspace.id ? db.workspace : blank.workspaces[0];
    db.workspaces = [Object.assign({}, blank.workspaces[0], legacy, { join_code: (legacy && legacy.join_code) || joinCode() })];
  }
  db.workspaces = db.workspaces.map(w => Object.assign({}, blank.workspaces[0], w, { join_code: w.join_code || joinCode() }));
  db.workspace = db.workspaces[0];
  const fallbackWorkspaceId = db.workspaces[0].id;
  for (const c of ['projects', 'tasks', 'papers', 'events', 'analyses', 'experiments', 'daily_logs', 'weekly_reports', 'reviews']) {
    db[c] = Array.isArray(db[c]) ? db[c] : [];
    db[c].forEach(row => { row.workspace_id = row.workspace_id || fallbackWorkspaceId; });
  }
  if (Array.isArray(db.audit_logs)) db.audit_logs.forEach(row => { row.workspace_id = row.workspace_id || fallbackWorkspaceId; });
  if (Array.isArray(db.users)) db.users.forEach(user => { user.workspace_id = user.workspace_id || fallbackWorkspaceId; });
}
function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain.then(async () => {
    const tmp = DATA_FILE + '.tmp';
    await fsp.writeFile(tmp, snapshot, 'utf8');
    await fsp.rename(tmp, DATA_FILE);
  });
  return writeChain;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}
function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const actual = crypto.scryptSync(password, parts[1], 64);
  const expected = Buffer.from(parts[2], 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function cookieToken(req) {
  const header = String(req.headers.cookie || '');
  const match = header.match(/(?:^|;\s*)lab_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function sessionCookie(token, maxAge) {
  const attrs = [`lab_session=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (COOKIE_SECURE) attrs.push('Secure');
  return attrs.join('; ');
}
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.sessions[token] = { user_id: userId, expires_at: Date.now() + SESSION_DAYS * 86400000 };
  return token;
}
function userFromRequest(req) {
  const token = cookieToken(req);
  const session = token && db.sessions[token];
  if (!session || session.expires_at < Date.now()) {
    if (token) delete db.sessions[token];
    return null;
  }
  return db.users.find(u => u.id === session.user_id && u.status !== 'disabled') || null;
}

function json(res, status, body, extraHeaders) {
  const payload = JSON.stringify(body);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }, extraHeaders || {}));
  res.end(payload);
}
function error(res, status, message, code) { json(res, status, { error: code || 'request_error', message }); }
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > MAX_BODY) { reject(Object.assign(new Error('请求内容过大'), { status: 413 })); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (_) { reject(Object.assign(new Error('请求 JSON 格式不正确'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function readBinaryBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0, exceeded = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { exceeded = true; chunks.length = 0; }
      else if (!exceeded) chunks.push(chunk);
    });
    req.on('end', () => exceeded ? reject(Object.assign(new Error('附件不能超过 10 MB'), { status: 413 })) : resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function validateRegistration(body) {
  const name = safeText(body.name, 80);
  const mail = email(body.email);
  const phone = safeText(body.phone, 40);
  const password = String(body.password || '');
  const academicRole = safeText(body.academic_role || body.role, 80);
  if (name.length < 2) return { error: '姓名至少需要 2 个字符' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { error: '请输入有效邮箱' };
  if (password.length < 8) return { error: '密码至少需要 8 位' };
  if (phone && !/^[+\d][\d\s-]{5,20}$/.test(phone)) return { error: '手机号格式不正确' };
  return { name, email: mail, phone, academicRole, password };
}
function addAudit(user, action, entity, entityId, details) {
  const workspace = activeWorkspace(user);
  db.audit_logs.push({ id: id('audit'), workspace_id: workspace && workspace.id, actor_id: user && user.id, action, entity, entity_id: entityId || '', details: details || {}, created_at: now() });
}
function workspaceRows(collection, user) {
  const workspace = activeWorkspace(user);
  if (!workspace) return [];
  let rows = db[collection].filter(row => row.workspace_id === workspace.id);
  if (collection === 'daily_logs') rows = rows.filter(row => roleIsPI(user) || row.author_id === user.id);
  return rows;
}
function canReadRow(user, collection, row) {
  if (roleIsPI(user)) return true;
  if (collection === 'daily_logs') return row.author_id === user.id;
  if (collection === 'tasks') return row.assignee_id === user.id || row.created_by === user.id;
  if (collection === 'projects') return row.lead_id === user.id || row.created_by === user.id || true;
  return true;
}
function canWriteRow(user, collection, row) {
  if (roleIsPI(user)) return true;
  if (collection === 'daily_logs') return !row || row.author_id === user.id;
  if (collection === 'tasks') return !row || row.assignee_id === user.id || row.created_by === user.id;
  if (collection === 'projects') return !row || row.lead_id === user.id || row.created_by === user.id;
  return !row || row.created_by === user.id;
}
// partial=true 用于 PATCH：只规范化请求里实际带上的字段，避免把未提交的字段重置为默认值。
function cleanItem(collection, body, user, partial) {
  const out = {};
  const given = key => !partial || out[key] !== undefined;
  const allowed = {
    projects: ['title', 'kind', 'goal', 'start_date', 'deadline', 'progress', 'lead_id', 'milestones', 'notes'],
    tasks: ['title', 'project_id', 'assignee_id', 'priority', 'status', 'due_date', 'tags', 'completed_at'],
    papers: ['title', 'authors', 'year', 'venue', 'tags', 'project_id', 'read_state', 'rating', 'note', 'url'],
    events: ['title', 'date', 'type', 'project_id', 'reminder', 'done'],
    analyses: ['title', 'tool', 'dataset', 'script', 'result', 'project_id'],
    experiments: ['title', 'date', 'project_id', 'task_id', 'category', 'hypothesis', 'materials', 'procedure', 'observations', 'results', 'conclusion', 'next_steps'],
    reviews: ['period', 'content'],
    daily_logs: ['date', 'project_id', 'content', 'hours', 'summary', 'applied'],
    weekly_reports: ['period', 'content', 'summary']
  }[collection] || [];
  for (const key of allowed) if (body[key] !== undefined) out[key] = body[key];
  if (collection === 'experiments') {
    const limits = { title: 200, date: 10, project_id: 100, task_id: 100, category: 80, hypothesis: 10000, materials: 10000, procedure: 20000, observations: 20000, results: 20000, conclusion: 10000, next_steps: 10000 };
    for (const key of allowed) if (out[key] !== undefined) out[key] = safeText(out[key], limits[key] || 10000);
  }
  if (collection === 'projects') {
    if (given('progress')) out.progress = Math.max(0, Math.min(100, Number(out.progress || 0)));
    if (out.milestones !== undefined) {
      out.milestones = (Array.isArray(out.milestones) ? out.milestones : []).slice(0, 100)
        .map(m => ({ title: safeText(m && m.title, 200), due: safeText(m && m.due, 10), done: bool(m && m.done) }))
        .filter(m => m.title);
    }
  }
  if (collection === 'tasks') {
    if (given('status')) out.status = ['todo', 'doing', 'done', 'delayed'].includes(out.status) ? out.status : 'todo';
    if (given('priority')) out.priority = ['高', '中', '低'].includes(out.priority) ? out.priority : '中';
  }
  if (collection === 'daily_logs') {
    if (!partial) out.author_id = user.id;
    if (given('hours')) out.hours = Math.max(0, Math.min(24, Number(out.hours || 0)));
    if (given('content')) out.content = safeText(out.content, 20000);
  }
  return out;
}

function experimentReferenceError(item, user) {
  const workspaceId = activeWorkspace(user).id;
  if (item.project_id && !db.projects.some(row => row.id === item.project_id && row.workspace_id === workspaceId)) return '关联项目不存在';
  const task = item.task_id && db.tasks.find(row => row.id === item.task_id && row.workspace_id === workspaceId);
  if (item.task_id && !task) return '关联任务不存在';
  if (task && item.project_id && task.project_id && task.project_id !== item.project_id) return '关联任务不属于所选项目';
  return '';
}

function attachmentFilename(req) {
  let filename = String(req.headers['x-file-name'] || '');
  try { filename = decodeURIComponent(filename); } catch (_) { return ''; }
  return safeText(path.basename(filename.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, ''), 180);
}

async function sendAttachment(res, experiment, attachment) {
  const file = path.join(ATTACHMENT_DIR, path.basename(attachment.storage_key || ''));
  try {
    const stat = await fsp.stat(file);
    res.writeHead(200, {
      'Content-Type': attachment.content_type || 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(file).pipe(res);
  } catch (_) { error(res, 404, '附件不存在', 'not_found'); }
}
function publicRow(collection, row) {
  const out = clone(row);
  if (collection === 'experiments') out.attachments = (out.attachments || []).map(({ storage_key, ...attachment }) => attachment);
  return out;
}

async function aiChat(system, userPrompt) {
  const config = effectiveAIConfig();
  if (!config.baseUrl || !config.apiKey || !config.model) return null;
  const endpoint = config.baseUrl + (config.chatPath.startsWith('/') ? config.chatPath : '/' + config.chatPath);
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: userPrompt }] })
  });
  if (!response.ok) throw new Error(`AI 服务返回 ${response.status}`);
  const data = await response.json();
  return data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
}
function parseJsonText(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch (_) {
    const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) { try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (_) {} }
  }
  return null;
}
function fallbackDaily(body, user, projects, tasks) {
  const text = safeText(body.content, 20000);
  const project = projects.find(p => p.id === body.projectId) || projects[0];
  const done = /(完成|做完|定稿|提交|通过|结束|收尾)/.test(text);
  const ownTasks = tasks.filter(t => t.assignee_id === user.id && t.status !== 'done');
  const primary = ownTasks.find(t => !project || t.project_id === project.id) || ownTasks[0];
  const delta = Math.max(2, Math.min(9, Math.round((Number(body.hours) || 4) / 1.6) + (done ? 2 : 0)));
  return {
    summary: `${user.name} 今日投入 ${Number(body.hours) || '—'} 小时：${text.slice(0, 90)}${text.length > 90 ? '…' : ''}`,
    progress: project ? [{ projectId: project.id, title: project.title, delta }] : [],
    taskUpdates: primary && (done || primary.status === 'todo') ? [{ taskId: primary.id, title: primary.title, from: primary.status, to: done ? 'done' : 'doing' }] : [],
    suggestions: ['把实验数据、结论或阻塞点补充到项目记录，方便组会复盘。'],
    tags: /(文献|综述|精读)/.test(text) ? ['文献阅读'] : (/(实验|样品|验证)/.test(text) ? ['实验'] : ['研究推进']),
    source: 'fallback', model: '服务端规则降级'
  };
}
async function summarizeDaily(body, user) {
  const aiConfig = effectiveAIConfig();
  const projects = workspaceRows('projects', user);
  const tasks = workspaceRows('tasks', user);
  const base = fallbackDaily(body, user, projects, tasks);
  const prompt = JSON.stringify({
    date: body.date || now().slice(0, 10), member: publicUser(user), content: safeText(body.content, 20000), hours: Number(body.hours || 0),
    projects: projects.slice(0, 50).map(p => ({ id: p.id, title: p.title, progress: p.progress, deadline: p.deadline })),
    tasks: tasks.slice(0, 100).map(t => ({ id: t.id, title: t.title, status: t.status, project_id: t.project_id, assignee_id: t.assignee_id }))
  });
  const system = '你是科研课题组工作台的助手。只返回 JSON，不要 Markdown。字段必须为 summary:string, progress:[{projectId,title,delta}], taskUpdates:[{taskId,title,from,to}], suggestions:string[], tags:string[]。delta 限制在 -20 到 20，状态只能 todo/doing/done/delayed。AI 只提出建议，不代表已经写入数据库。';
  try {
    const parsed = parseJsonText(await aiChat(system, prompt));
    if (parsed && typeof parsed.summary === 'string') return Object.assign(base, parsed, { source: 'ai', model: aiConfig.model });
  } catch (err) { base.aiError = err.message; }
  return base;
}
async function summarizeWeekly(user, body) {
  const aiConfig = effectiveAIConfig();
  const cutoff = Date.now() - 7 * 86400000;
  const logs = workspaceRows('daily_logs', user).filter(row => new Date(row.created_at || row.date).getTime() >= cutoff);
  const fallback = { summary: `本周共记录 ${logs.length} 条日报，累计投入 ${logs.reduce((n, x) => n + Number(x.hours || 0), 0)} 小时。`, highlights: logs.slice(0, 5).map(x => x.content), blockers: [], nextSteps: ['继续按项目补充可量化结果，并在周报中确认下周目标。'], source: 'fallback', model: '服务端规则降级' };
  try {
    const text = await aiChat('你是科研周报助手，只返回 JSON：summary:string, highlights:string[], blockers:string[], nextSteps:string[]。用中文，基于真实日报归纳，不要编造。', JSON.stringify({ period: body.period || '', logs: logs.map(x => ({ date: x.date, content: x.content, hours: x.hours })) }));
    const parsed = parseJsonText(text);
    if (parsed && typeof parsed.summary === 'string') return Object.assign(fallback, parsed, { source: 'ai', model: aiConfig.model });
  } catch (_) {}
  return fallback;
}

function plans() {
  return [
    { id: 'free', name: '免费版', interval: 'month', price: 0, member_limit: 5, features: ['基础项目与任务', '每日上报', 'AI 摘要额度'] },
    { id: 'pro_monthly', name: 'PI 专业版', interval: 'month', price: null, member_limit: 50, features: ['全模块', 'AI 周报', '通知与审计', '文件存储'] },
    { id: 'pro_yearly', name: 'PI 专业版', interval: 'year', price: null, member_limit: 50, features: ['全模块', 'AI 周报', '通知与审计', '文件存储'] }
  ];
}

async function api(req, res, pathname, method, body, user) {
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/api/health' && (method === 'GET' || method === 'HEAD')) {
    if (method === 'HEAD') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(); }
    return json(res, 200, { ok: true, service: 'lab-workbench', time: now(), aiConfigured: publicAIConfig().configured });
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const input = validateRegistration(body);
    if (input.error) return error(res, 400, input.error, 'invalid_registration');
    if (db.users.some(u => u.email === input.email)) return error(res, 409, '该邮箱已经注册', 'email_exists');
    const workspaceMode = String(body.workspace_mode || body.workspaceMode || '').toLowerCase();
    const isFirstAccount = db.users.length === 0;
    const createGroup = workspaceMode === 'create' || (!workspaceMode && isFirstAccount);
    const joinGroup = workspaceMode === 'join';
    if (!createGroup && !joinGroup) return error(res, 400, '请选择“创建新课题组”或填写课题组邀请码加入已有课题组', 'workspace_required');
    let workspace;
    if (createGroup) {
      const workspaceName = safeText(body.workspace_name || body.workspaceName, 80);
      if (workspaceName.length < 2) return error(res, 400, '课题组名称至少需要 2 个字符', 'invalid_workspace');
      const school = schoolSettings(body);
      if (school.error) return error(res, 400, school.error, 'invalid_school');
      // Reuse the empty compatibility workspace for the first PI so a ghost
      // default group is not left behind in a fresh installation.
      if (isFirstAccount && db.workspaces.length === 1 && db.workspaces[0].id === 'ws_default') {
        workspace = db.workspaces[0]; workspace.name = workspaceName; workspace.slug = slug(workspaceName); workspace.join_code = joinCode();
      } else {
        workspace = newWorkspace(workspaceName); db.workspaces.push(workspace);
      }
      Object.assign(workspace, school.fields || {});
    } else {
      workspace = workspaceByJoinCode(body.join_code || body.joinCode);
      if (!workspace) return error(res, 404, '邀请码无效，请向 PI 获取最新邀请码', 'invalid_join_code');
      if (db.users.filter(u => u.workspace_id === workspace.id && u.status !== 'disabled').length >= 50) return error(res, 409, '该课题组成员数量已达到当前版本上限', 'workspace_full');
    }
    const newUser = {
      id: id('usr'), workspace_id: workspace.id, name: input.name, email: input.email, phone: input.phone,
      // Access role comes from the registration path. Academic role is profile text only.
      role: createGroup ? 'pi' : 'member',
      academic_role: input.academicRole || (createGroup ? 'PI / 导师' : '课题组成员'), color: COLORS[db.users.length % COLORS.length],
      password_hash: hashPassword(input.password), status: 'active', created_at: now()
    };
    if (createGroup) workspace.owner_id = newUser.id;
    db.users.push(newUser); addAudit(newUser, 'register', 'user', newUser.id, { workspace_mode: createGroup ? 'create' : 'join', workspace_id: workspace.id });
    const token = createSession(newUser.id); await persist();
    return json(res, 201, { user: publicUser(newUser), workspace: publicWorkspace(workspace) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    const mail = email(body.email), password = String(body.password || '');
    const found = db.users.find(u => u.email === mail);
    if (!found || found.status === 'disabled' || !verifyPassword(password, found.password_hash)) return error(res, 401, '邮箱或密码不正确', 'invalid_credentials');
    const token = createSession(found.id); addAudit(found, 'login', 'user', found.id, {}); await persist();
    return json(res, 200, { user: publicUser(found), workspace: publicWorkspace(activeWorkspace(found)) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = cookieToken(req); if (token) delete db.sessions[token]; if (user) addAudit(user, 'logout', 'user', user.id, {}); await persist();
    return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!user) return error(res, 401, '未登录', 'unauthorized');
    return json(res, 200, { user: publicUser(user), workspace: publicWorkspace(activeWorkspace(user)) });
  }
  if (!user) return error(res, 401, '请先登录', 'unauthorized');

  if (parts[1] === 'experiments' && parts[2] && parts[3] === 'attachments') {
    const workspaceId = activeWorkspace(user).id;
    const experiment = db.experiments.find(row => row.id === parts[2] && row.workspace_id === workspaceId);
    if (!experiment) return error(res, 404, '实验记录不存在', 'not_found');
    experiment.attachments = Array.isArray(experiment.attachments) ? experiment.attachments : [];
    if (parts.length === 4 && method === 'POST') {
      if (!canWriteRow(user, 'experiments', experiment)) return error(res, 403, '没有添加附件的权限', 'forbidden');
      const filename = attachmentFilename(req);
      const ext = path.extname(filename).toLowerCase();
      if (!filename || !ATTACHMENT_TYPES[ext]) return error(res, 400, '仅支持 PDF、PNG、JPG、CSV、TSV、TXT、DOCX 和 XLSX 文件', 'unsupported_file_type');
      const data = await readBinaryBody(req, MAX_ATTACHMENT_BYTES);
      if (!data.length) return error(res, 400, '附件内容为空', 'empty_file');
      await fsp.mkdir(ATTACHMENT_DIR, { recursive: true });
      const storageKey = id('file') + ext;
      const filePath = path.join(ATTACHMENT_DIR, storageKey);
      await fsp.writeFile(filePath, data, { flag: 'wx', mode: 0o600 });
      const attachment = {
        id: id('att'), name: filename, size: data.length, content_type: ATTACHMENT_TYPES[ext],
        storage_key: storageKey, uploaded_by: user.id, created_at: now()
      };
      experiment.attachments.push(attachment);
      try {
        addAudit(user, 'upload', 'experiment_attachment', attachment.id, { experiment_id: experiment.id, size: data.length });
        await persist();
      } catch (err) {
        experiment.attachments = experiment.attachments.filter(row => row.id !== attachment.id);
        await fsp.unlink(filePath).catch(() => {});
        throw err;
      }
      const { storage_key, ...publicAttachment } = attachment;
      return json(res, 201, { attachment: publicAttachment });
    }
    if (parts.length === 5) {
      const attachment = experiment.attachments.find(row => row.id === parts[4]);
      if (!attachment) return error(res, 404, '附件不存在', 'not_found');
      if (method === 'GET') {
        if (!canReadRow(user, 'experiments', experiment)) return error(res, 403, '没有查看权限', 'forbidden');
        return sendAttachment(res, experiment, attachment);
      }
      if (method === 'DELETE') {
        if (!canWriteRow(user, 'experiments', experiment)) return error(res, 403, '没有删除附件的权限', 'forbidden');
        experiment.attachments = experiment.attachments.filter(row => row.id !== attachment.id);
        addAudit(user, 'delete', 'experiment_attachment', attachment.id, { experiment_id: experiment.id });
        await persist();
        await fsp.unlink(path.join(ATTACHMENT_DIR, path.basename(attachment.storage_key || ''))).catch(() => {});
        return json(res, 200, { ok: true });
      }
    }
    return error(res, 405, '不支持的请求方法', 'method_not_allowed');
  }

  if (pathname === '/api/workspace' && method === 'GET') return json(res, 200, { workspace: publicWorkspace(activeWorkspace(user)) });
  if (pathname === '/api/workspace' && method === 'PATCH') {
    if (!roleIsPI(user)) return error(res, 403, '只有 PI 可以修改课题组设置', 'forbidden');
    const workspace = activeWorkspace(user);
    const name = safeText(body.name, 80);
    if (name && name.length < 2) return error(res, 400, '课题组名称至少需要 2 个字符', 'invalid_workspace');
    const school = schoolSettings(body, workspace);
    if (school.error) return error(res, 400, school.error, 'invalid_school');
    const updates = Object.assign({}, school.fields || {});
    if (name) { updates.name = name; updates.slug = slug(name); }
    if (body.timezone !== undefined) updates.timezone = safeText(body.timezone, 80) || workspace.timezone;
    Object.assign(workspace, updates);
    addAudit(user, 'update', 'workspace', workspace.id, { fields: Object.keys(body) }); await persist();
    return json(res, 200, { workspace: publicWorkspace(workspace) });
  }
  if (pathname === '/api/workspace/join-code/rotate' && method === 'POST') {
    if (!roleIsPI(user)) return error(res, 403, '只有 PI 可以更新邀请码', 'forbidden');
    const workspace = activeWorkspace(user); workspace.join_code = joinCode();
    addAudit(user, 'rotate_join_code', 'workspace', workspace.id, {}); await persist();
    return json(res, 200, { workspace: publicWorkspace(workspace) });
  }

  if (pathname === '/api/bootstrap' && method === 'GET') {
    const workspace = activeWorkspace(user);
    const data = {};
    data.members = db.users.filter(u => u.workspace_id === workspace.id).map(publicUser);
    for (const c of ['projects', 'tasks', 'papers', 'events', 'analyses', 'experiments', 'reviews', 'daily_logs', 'weekly_reports']) data[c] = workspaceRows(c, user).filter(row => canReadRow(user, c, row)).map(row => publicRow(c, row));
    data.logs = data.daily_logs;
    return json(res, 200, { currentUser: publicUser(user), workspace: publicWorkspace(workspace), data, settings: { ai: publicAIConfig() }, permissions: { isPI: roleIsPI(user) } });
  }
  if (pathname === '/api/members' && method === 'GET') return json(res, 200, { members: db.users.filter(u => u.workspace_id === activeWorkspace(user).id).map(publicUser) });
  if (parts[0] === 'api' && parts[1] === 'members' && parts[2] && method === 'PATCH') {
    if (!roleIsPI(user)) return error(res, 403, '只有 PI 可以管理成员', 'forbidden');
    const found = db.users.find(u => u.id === parts[2] && u.workspace_id === activeWorkspace(user).id); if (!found) return error(res, 404, '成员不存在', 'not_found');
    if (body.role !== undefined && ROLES.has(body.role)) found.role = body.role;
    if (body.academic_role !== undefined) found.academic_role = safeText(body.academic_role, 80);
    if (body.status !== undefined && ['active', 'disabled'].includes(body.status)) found.status = body.status;
    addAudit(user, 'update', 'user', found.id, { fields: Object.keys(body) }); await persist(); return json(res, 200, { member: publicUser(found) });
  }
  if (parts[0] === 'api' && parts[1] === 'members' && parts[2] && method === 'DELETE') {
    if (!roleIsPI(user)) return error(res, 403, '只有 PI 可以移除成员', 'forbidden');
    const index = db.users.findIndex(u => u.id === parts[2] && u.workspace_id === activeWorkspace(user).id); if (index < 0) return error(res, 404, '成员不存在', 'not_found');
    if (db.users[index].id === user.id) return error(res, 400, '不能移除当前 PI', 'invalid_request');
    db.users[index].status = 'disabled'; addAudit(user, 'disable', 'user', parts[2], {}); await persist(); return json(res, 200, { ok: true });
  }

  if (pathname === '/api/ai/daily-summary' && method === 'POST') return json(res, 200, await summarizeDaily(body, user));
  if (pathname === '/api/ai/weekly-summary' && method === 'POST') return json(res, 200, await summarizeWeekly(user, body));
  if (pathname === '/api/ai/daily-summary/apply' && method === 'POST') {
    const payload = body.payload || body; const result = body.result || {};
    const idem = safeText(body.idempotencyKey || '', 120);
    if (idem && db.daily_logs.some(x => x.idempotency_key === idem)) return json(res, 200, { ok: true, duplicate: true });
    for (const update of Array.isArray(result.taskUpdates) ? result.taskUpdates : []) {
      const task = db.tasks.find(t => t.id === update.taskId && t.workspace_id === activeWorkspace(user).id);
      if (task && canWriteRow(user, 'tasks', task)) { task.status = ['todo', 'doing', 'done', 'delayed'].includes(update.to) ? update.to : task.status; task.completed_at = task.status === 'done' ? now() : null; }
    }
    for (const progress of Array.isArray(result.progress) ? result.progress : []) {
      const project = db.projects.find(p => p.id === progress.projectId && p.workspace_id === activeWorkspace(user).id);
      if (project && canWriteRow(user, 'projects', project)) project.progress = Math.max(0, Math.min(100, Number(project.progress || 0) + Number(progress.delta || 0)));
    }
    const log = Object.assign(cleanItem('daily_logs', { date: payload.date, project_id: payload.projectId, content: payload.content, hours: payload.hours, summary: result, applied: true }, user), { id: id('log'), workspace_id: activeWorkspace(user).id, created_at: now(), idempotency_key: idem });
    db.daily_logs.unshift(log); addAudit(user, 'apply_ai_daily', 'daily_log', log.id, { taskUpdates: result.taskUpdates || [], progress: result.progress || [] }); await persist();
    return json(res, 201, { ok: true, log: clone(log) });
  }

  if (pathname === '/api/settings/ai' && method === 'GET') return json(res, 200, { ai: publicAIConfig() });
  if (pathname === '/api/settings/ai' && method === 'PATCH') {
    if (!roleIsPI(user)) return error(res, 403, '只有 PI 可以修改 AI 设置', 'forbidden');
    for (const key of ['provider', 'baseUrl', 'model', 'chatPath']) if (body[key] !== undefined) db.settings.ai[key] = safeText(body[key], 300);
    addAudit(user, 'update', 'settings', 'ai', { fields: Object.keys(body).filter(k => k !== 'apiKey') }); await persist(); return json(res, 200, { ai: publicAIConfig() });
  }
  if (pathname === '/api/billing/plans' && method === 'GET') return json(res, 200, { plans: plans() });
  if (pathname === '/api/billing/subscription' && method === 'GET') { const workspace = activeWorkspace(user); return json(res, 200, { subscription: { plan: workspace.plan, status: workspace.subscription_status, provider: null } }); }
  if (pathname === '/api/billing/checkout' && method === 'POST') return error(res, 501, '支付服务尚未配置，已预留月付和年付接口', 'billing_not_configured');
  if (pathname === '/api/notifications/preferences' && method === 'GET') {
    const pref = db.notification_preferences.find(x => x.user_id === user.id) || { user_id: user.id, evening_report: true, morning_tasks: true, overdue_tasks: true, timezone: activeWorkspace(user).timezone };
    return json(res, 200, { preferences: pref });
  }
  if (pathname === '/api/notifications/preferences' && method === 'PATCH') {
    let pref = db.notification_preferences.find(x => x.user_id === user.id);
    if (!pref) { pref = { id: id('pref'), user_id: user.id }; db.notification_preferences.push(pref); }
    for (const key of ['evening_report', 'morning_tasks', 'overdue_tasks', 'timezone']) if (body[key] !== undefined) pref[key] = key === 'timezone' ? safeText(body[key], 80) : bool(body[key]);
    await persist(); return json(res, 200, { preferences: pref });
  }
  if (pathname === '/api/notifications/subscriptions' && method === 'POST') {
    const subscription = body.subscription || body; if (!subscription || typeof subscription !== 'object') return error(res, 400, '通知订阅格式不正确', 'invalid_subscription');
    const existing = db.notification_subscriptions.find(x => x.user_id === user.id && x.endpoint === subscription.endpoint);
    if (existing) existing.subscription = subscription; else db.notification_subscriptions.push({ id: id('push'), user_id: user.id, endpoint: subscription.endpoint || '', subscription, created_at: now() });
    await persist(); return json(res, 201, { ok: true });
  }

  if (parts[0] === 'api' && COLLECTION_ALIASES[parts[1]]) parts[1] = COLLECTION_ALIASES[parts[1]];
  const collection = parts[1];
  if (!COLLECTIONS.has(collection)) return error(res, 404, '接口不存在', 'not_found');
  if (method === 'GET' && parts.length === 2) {
    let rows = workspaceRows(collection, user).filter(row => canReadRow(user, collection, row));
    for (const [key, value] of new URL(req.url, 'http://localhost').searchParams.entries()) if (key !== 'limit') rows = rows.filter(row => String(row[key] || '') === value);
    const limit = Math.min(500, Math.max(1, Number(new URL(req.url, 'http://localhost').searchParams.get('limit') || 500)));
    return json(res, 200, { items: rows.slice(0, limit).map(row => publicRow(collection, row)) });
  }
  if (method === 'POST' && parts.length === 2) {
    const item = cleanItem(collection, body, user); item.id = id(collection.slice(0, 3)); item.workspace_id = activeWorkspace(user).id; item.created_by = user.id; item.created_at = now();
    if (collection === 'experiments') {
      if (!item.title) return error(res, 400, '请填写实验记录名称', 'invalid_experiment');
      const refError = experimentReferenceError(item, user);
      if (refError) return error(res, 400, refError, 'invalid_reference');
      item.attachments = [];
    }
    if (collection === 'projects' && !item.lead_id) item.lead_id = user.id;
    if (collection === 'tasks' && !item.assignee_id) item.assignee_id = user.id;
    if (collection === 'daily_logs') item.author_id = user.id;
    db[collection].unshift(item); addAudit(user, 'create', collection, item.id, {}); await persist(); return json(res, 201, { item: publicRow(collection, item) });
  }
  if ((method === 'PATCH' || method === 'PUT') && parts.length === 3) {
    const item = db[collection].find(row => row.id === parts[2] && row.workspace_id === activeWorkspace(user).id);
    if (!item) return error(res, 404, '记录不存在', 'not_found');
    if (!canWriteRow(user, collection, item)) return error(res, 403, '没有修改权限', 'forbidden');
    const patch = cleanItem(collection, body, user, true);
    if (collection === 'experiments') {
      const candidate = Object.assign({}, item, patch);
      if (!candidate.title) return error(res, 400, '请填写实验记录名称', 'invalid_experiment');
      const refError = experimentReferenceError(candidate, user);
      if (refError) return error(res, 400, refError, 'invalid_reference');
    }
    Object.assign(item, patch, { updated_at: now() }); addAudit(user, 'update', collection, item.id, { fields: Object.keys(body) }); await persist(); return json(res, 200, { item: publicRow(collection, item) });
  }
  if (method === 'DELETE' && parts.length === 3) {
    const index = db[collection].findIndex(row => row.id === parts[2] && row.workspace_id === activeWorkspace(user).id);
    if (index < 0) return error(res, 404, '记录不存在', 'not_found');
    if (!canWriteRow(user, collection, db[collection][index])) return error(res, 403, '没有删除权限', 'forbidden');
    const removed = db[collection].splice(index, 1)[0]; addAudit(user, 'delete', collection, removed.id, {}); await persist();
    if (collection === 'experiments') {
      for (const attachment of removed.attachments || []) await fsp.unlink(path.join(ATTACHMENT_DIR, path.basename(attachment.storage_key || ''))).catch(() => {});
    }
    return json(res, 200, { ok: true });
  }
  return error(res, 405, '不支持的请求方法', 'method_not_allowed');
}

function mime(file) {
  return { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
function sendImage(req, res, image) {
  res.writeHead(200, {
    'Content-Type': image.type, 'Content-Length': image.data.length,
    'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff'
  });
  return res.end(req.method === 'HEAD' ? undefined : image.data);
}
async function favicon(req, res, ico) {
  const workspace = workspaceForUser(userFromRequest(req));
  let image;
  if (workspace && workspace.school_id === 'custom') {
    const custom = decodeSchoolLogo(workspace.school_logo);
    if (custom && custom.type === 'image/png') {
      const data = ico ? pngIco(custom.data) : custom.data;
      if (data) image = { data, type: ico ? 'image/x-icon' : 'image/png' };
    }
  } else if (workspace) {
    const school = schools.find(workspace.school_id);
    if (school && SCHOOL_LOGO_PATHS.has(school.logo)) {
      const file = ico ? school.logo.replace(/\.png$/, '.ico') : school.logo;
      try { image = { data: await fsp.readFile(path.join(ROOT, file)), type: ico ? 'image/x-icon' : 'image/png' }; } catch (_) {}
    }
  }
  if (!image) image = { data: await fsp.readFile(path.join(ROOT, ico ? 'favicon.ico' : 'favicon.png')), type: ico ? 'image/x-icon' : 'image/png' };
  return sendImage(req, res, image);
}
function schoolIcon(req, res, pathname) {
  const match = pathname.match(/^\/school-icons\/([a-f0-9]{64})\.(png|jpg|webp|ico)$/);
  if (!match) return error(res, 404, '文件不存在', 'not_found');
  const token = Buffer.from(match[1], 'hex');
  const workspace = db.workspaces.find(current => current.school_id === 'custom' && typeof current.school_logo === 'string' && current.school_logo &&
    crypto.timingSafeEqual(token, Buffer.from(schoolIconToken(current), 'hex')));
  const image = workspace && decodeSchoolLogo(workspace.school_logo);
  if (!image) return error(res, 404, '文件不存在', 'not_found');
  if (match[2] === 'ico') {
    const data = image.type === 'image/png' && pngIco(image.data);
    return data ? sendImage(req, res, { data, type: 'image/x-icon' }) : error(res, 404, '文件不存在', 'not_found');
  }
  const extension = image.type === 'image/jpeg' ? 'jpg' : image.type.slice(6);
  return match[2] === extension ? sendImage(req, res, image) : error(res, 404, '文件不存在', 'not_found');
}
async function indexHtml(req, res) {
  const demo = new URL(req.url, 'http://localhost').searchParams.get('demo') === '1';
  const icons = schoolIcons(demo ? null : workspaceForUser(userFromRequest(req)));
  const links = [
    `<link id="app-favicon" rel="icon" href="${icons.raster}" type="${icons.type}">`,
    icons.ico ? `<link id="app-favicon-ico" rel="icon" href="${icons.ico}" type="image/x-icon">` : '',
    `<link id="app-apple-icon" rel="apple-touch-icon" href="${icons.raster}">`
  ].filter(Boolean).join('\n');
  const template = await fsp.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const cleaned = template.replace(/<link\b[^>]*\bid=["'](?:app-favicon|app-favicon-ico|app-apple-icon)["'][^>]*>\s*/gi, '');
  const html = cleaned.replace(/<head\b[^>]*>/i, tag => tag + '\n' + links);
  const data = Buffer.from(html, 'utf8');
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length,
    'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff'
  });
  return res.end(req.method === 'HEAD' ? undefined : data);
}
async function staticFile(req, res, pathname) {
  const clean = pathname === '/' ? '/index.html' : pathname;
  const file = path.resolve(ROOT, '.' + clean);
  const relative = path.relative(ROOT, file);
  const parts = relative.split(path.sep);
  const publicFile = ['index.html', 'styles.css', 'favicon.svg', 'sw.js'].includes(relative) ||
    SCHOOL_LOGO_PATHS.has('/' + relative.split(path.sep).join('/')) ||
    SCHOOL_ICO_PATHS.has('/' + relative.split(path.sep).join('/')) ||
    (parts.length === 2 && parts[0] === 'js' && path.extname(relative).toLowerCase() === '.js' && !parts.some(part => part.startsWith('.')));
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative) || !publicFile) return error(res, 404, '文件不存在', 'not_found');
  if (relative === 'index.html') return indexHtml(req, res);
  try {
    const stat = await fsp.stat(file); if (!stat.isFile()) throw new Error('not_file');
    res.writeHead(200, { 'Content-Type': mime(file), 'Content-Length': stat.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  }
  catch (_) { error(res, 404, '文件不存在', 'not_found'); }
}

async function main() {
  await ensureDb();
  await ensureSchoolIconKey();
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (url.pathname.startsWith('/api/')) {
        const binaryUpload = req.method === 'POST' && /^\/api\/experiments\/[^/]+\/attachments$/.test(url.pathname) && /^application\/octet-stream(?:;|$)/i.test(String(req.headers['content-type'] || ''));
        const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && !binaryUpload ? await parseBody(req) : {};
        return await api(req, res, url.pathname, req.method, body, userFromRequest(req));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return error(res, 405, '不支持的请求方法', 'method_not_allowed');
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const demo = url.searchParams.get('demo') === '1';
        const expected = new URL(schoolPage(workspaceForUser(userFromRequest(req))), 'http://localhost').searchParams.get('school');
        if (url.pathname === '/' || (!demo && (url.searchParams.getAll('school').length !== 1 || url.searchParams.get('school') !== expected))) {
          if (!demo) url.searchParams.set('school', expected);
          res.writeHead(302, { Location: '/index.html' + url.search, 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' });
          return res.end();
        }
      }
      if (url.pathname === '/favicon.ico') return await favicon(req, res, true);
      if (['/favicon.png', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png'].includes(url.pathname)) return await favicon(req, res, false);
      if (url.pathname.startsWith('/school-icons/')) return schoolIcon(req, res, url.pathname);
      return staticFile(req, res, decodeURIComponent(url.pathname));
    } catch (err) { console.error(err); error(res, err.status || 500, err.message || '服务器错误', 'server_error'); }
  });
  server.listen(PORT, HOST, () => console.log(`Lab Workbench listening on http://${HOST}:${PORT}`));
}
main().catch(err => { console.error(err); process.exit(1); });
