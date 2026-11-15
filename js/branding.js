/* Workspace school branding and a shared school picker. */
(function () {
  'use strict';
  const Schools = window.LabSchools;
  const CACHE_KEY = 'lab-workbench:school-branding:v1';
  const DEFAULT_LOGO = 'favicon.svg';
  const ICON_VERSION = '?v=2';
  const SCHOOL_PAGE_RE = /^\/index\.html\?school=v3-[a-f0-9]{64}$/;
  function assetSource(source) { return window.location.protocol === 'file:' && source.charAt(0) === '/' ? '.' + source : source; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function schoolFields(value) {
    const school = value || {}, preset = Schools.find(school.school_id);
    const page = SCHOOL_PAGE_RE.test(String(school.school_page || '')) ? school.school_page : '';
    if (preset) return { school_id: preset.id, school_name: preset.name, school_logo: preset.logo, school_favicon: preset.logo + ICON_VERSION, school_favicon_ico: preset.logo.replace(/\.png$/, '.ico') + ICON_VERSION, school_page: page };
    if (school.school_id === 'custom') {
      return {
        school_id: 'custom', school_name: String(school.school_name || '').slice(0, 80),
        school_logo: /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(school.school_logo || '') && school.school_logo.length <= 280000 ? school.school_logo : '',
        school_favicon: /^\/school-icons\/[a-f0-9]{64}\.(?:png|jpg|webp)\?v=2$/.test(school.school_favicon || '') ? school.school_favicon : '',
        school_favicon_ico: /^\/school-icons\/[a-f0-9]{64}\.ico\?v=2$/.test(school.school_favicon_ico || '') ? school.school_favicon_ico : '',
        school_page: page
      };
    }
    return { school_id: '', school_name: '', school_logo: '' };
  }
  function pageFor(value) { return schoolFields(value).school_page || ''; }
  function remembered() {
    try { return schoolFields(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')); }
    catch (_) { return schoolFields(null); }
  }
  function imageHTML(value) {
    const school = schoolFields(value);
    return '<img class="school-crest" src="' + esc(assetSource(school.school_logo || DEFAULT_LOGO)) + '" alt="' + esc(school.school_name ? school.school_name + '校徽' : '课题组标识') + '">';
  }
  function fallback(event) {
    const image = event.target;
    if (!image || !image.classList || !image.classList.contains('school-crest') || image.dataset.fallback) return;
    image.dataset.fallback = 'true'; image.src = DEFAULT_LOGO;
    image.alt = '课题组标识';
  }
  document.addEventListener('error', fallback, true);
  function iconLink(id, rel, source, type, sizes) {
    const existing = document.getElementById(id);
    if (!source) { if (existing) existing.remove(); return; }
    source = assetSource(source);
    if (existing && existing.getAttribute('href') === source) return;
    const link = document.createElement('link');
    link.id = id; link.rel = rel; link.href = source;
    if (type) link.type = type;
    if (sizes) link.setAttribute('sizes', sizes);
    if (existing) existing.replaceWith(link); else document.head.appendChild(link);
  }
  function setFavicon(value) {
    const school = schoolFields(value), raster = school.school_favicon || 'favicon.png' + ICON_VERSION;
    const ico = school.school_favicon ? school.school_favicon_ico : 'favicon.ico' + ICON_VERSION;
    const type = /\.jpg\?/.test(raster) ? 'image/jpeg' : /\.webp\?/.test(raster) ? 'image/webp' : 'image/png';
    iconLink('app-favicon-ico', 'icon', ico, 'image/x-icon', school.school_id === 'custom' ? '256x256' : '16x16 32x32 48x48 64x64');
    iconLink('app-favicon', 'icon', raster, type, school.school_id === 'custom' ? '' : '256x256');
    iconLink('app-apple-icon', 'apple-touch-icon', raster);
  }
  function apply(value, persist, updateIcon) {
    const school = schoolFields(value);
    document.querySelectorAll('.brand-mark, .auth-mark').forEach(function (mark) {
      const source = assetSource(school.school_logo || DEFAULT_LOGO), existing = mark.querySelector('img');
      if (!existing || existing.getAttribute('src') !== source) mark.innerHTML = imageHTML(school);
      mark.title = school.school_name || '课题组工作台';
      mark.classList.toggle('has-school', Boolean(school.school_logo));
    });
    if (updateIcon !== false) setFavicon(school);
    if (persist) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(school)); } catch (_) {} }
  }
  function pickerHTML(prefix, value, disabled) {
    const school = schoolFields(value), off = disabled ? ' disabled' : '';
    return '<div class="school-picker" data-school-picker>' +
      '<label class="field"><span>所属学校</span><input type="text" id="' + prefix + '-school-name" name="school_name" data-school-name list="' + prefix + '-schools" maxlength="80" autocomplete="off" placeholder="输入学校名称或简称" value="' + esc(school.school_name) + '"' + off + '></label>' +
      '<datalist id="' + prefix + '-schools">' + Schools.list.map(function (item) {
        return '<option value="' + esc(item.name) + '" label="' + esc((item.aliases || []).join(' / ')) + '"></option>';
      }).join('') + '</datalist>' +
      '<input type="hidden" name="school_id" data-school-id value="' + esc(school.school_id) + '"><input type="hidden" data-school-logo>' +
      '<div class="school-preview"><div class="school-preview-mark">' + imageHTML(school) + '</div>' +
      '<div class="school-preview-text"><strong data-school-caption>' + esc(school.school_name || '课题组标识') + '</strong><span data-school-hint>侧边栏与浏览器标签页使用同一校徽</span></div></div>' +
      (!disabled ? '<div class="school-custom" data-school-custom hidden><label class="btn btn-sm school-upload">上传校徽<input type="file" data-school-file accept="image/png,image/jpeg,image/webp" class="visually-hidden"></label><button type="button" class="btn btn-sm btn-ghost" data-school-remove hidden>移除校徽</button><span class="field-hint">PNG / JPG / WebP，最大 2 MB</span></div>' : '') +
      '<div class="school-error" data-school-error role="alert" hidden></div></div>';
  }
  function readPicker(root) {
    const picker = root.querySelector('[data-school-picker]');
    if (!picker) return {};
    if (picker.dataset.busy === 'true') throw new Error('校徽正在处理，请稍候');
    if (picker.dataset.invalid === 'true') throw new Error('请重新选择有效的校徽文件，或移除校徽');
    return { school_id: picker.querySelector('[data-school-id]').value, school_name: picker.querySelector('[data-school-name]').value.trim(), school_logo: picker.querySelector('[data-school-logo]').value };
  }
  async function resizeLogo(file) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片');
    if (file.size > 2 * 1024 * 1024) throw new Error('校徽图片不能超过 2 MB');
    const source = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = source; await image.decode();
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 20000000) throw new Error('图片尺寸过大，请使用校徽小图');
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d'), ratio = Math.min(240 / image.naturalWidth, 240 / image.naturalHeight);
      const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio;
      ctx.drawImage(image, (256 - width) / 2, (256 - height) / 2, width, height);
      const data = canvas.toDataURL('image/png');
      if (data.length > 270000) throw new Error('图片过于复杂，请使用更小的校徽图片');
      return data;
    } catch (err) { throw new Error(err.message || '无法读取图片，请重新选择'); }
    finally { URL.revokeObjectURL(source); }
  }
  function mount(root, value, onChange, uploadState) {
    const picker = root.querySelector('[data-school-picker]');
    if (!picker || picker.dataset.mounted) return;
    picker.dataset.mounted = 'true';
    const name = picker.querySelector('[data-school-name]'), id = picker.querySelector('[data-school-id]'), logo = picker.querySelector('[data-school-logo]');
    let draft = schoolFields(value), revision = 0;
    const status = uploadState || {};
    picker.dataset.invalid = status.error ? 'true' : 'false';
    if (status.error) { const error = picker.querySelector('[data-school-error]'); error.textContent = status.error; error.hidden = false; }
    const fileInput = picker.querySelector('[data-school-file]'), remove = picker.querySelector('[data-school-remove]');
    function update(next, notify) {
      draft = next; id.value = next.school_id; logo.value = next.school_logo;
      picker.querySelector('.school-preview-mark').innerHTML = imageHTML(next);
      picker.querySelector('[data-school-caption]').textContent = next.school_name || '课题组标识';
      picker.querySelector('[data-school-hint]').textContent = next.school_id === 'custom' && !next.school_logo ? '可上传这所学校的校徽' : '侧边栏与浏览器标签页使用同一校徽';
      const custom = picker.querySelector('[data-school-custom]'); if (custom) custom.hidden = next.school_id !== 'custom';
      if (remove) remove.hidden = !next.school_logo && picker.dataset.invalid !== 'true';
      if (notify && onChange) onChange(Object.assign({}, next));
    }
    function clearError() {
      status.error = '';
      picker.dataset.invalid = 'false'; const error = picker.querySelector('[data-school-error]'); error.hidden = true; error.textContent = '';
    }
    update(draft, false);
    name.addEventListener('input', function () {
      revision++; picker.dataset.busy = 'false'; clearError();
      const typed = name.value.trim(), preset = Schools.match(typed);
      update(preset ? schoolFields({ school_id: preset.id }) : typed ? { school_id: 'custom', school_name: typed, school_logo: draft.school_id === 'custom' ? draft.school_logo : '' } : schoolFields(null), true);
    });
    name.addEventListener('change', function () { name.value = draft.school_name; });
    if (remove) remove.addEventListener('click', function () { revision++; picker.dataset.busy = 'false'; clearError(); if (fileInput) fileInput.value = ''; update(Object.assign({}, draft, { school_logo: '' }), true); });
    if (fileInput) fileInput.addEventListener('change', async function () {
      const file = fileInput.files && fileInput.files[0]; if (!file) return;
      const token = ++revision; picker.dataset.busy = 'true'; clearError();
      try {
        const data = await resizeLogo(file);
        if (token !== revision || !picker.isConnected) return;
        update(Object.assign({}, draft, { school_logo: data }), true);
      } catch (err) {
        if (token !== revision || !picker.isConnected) return;
        picker.dataset.invalid = 'true'; const error = picker.querySelector('[data-school-error]'); error.textContent = err.message; error.hidden = false;
        status.error = err.message;
        if (remove) remove.hidden = false;
      } finally { if (token === revision) { picker.dataset.busy = 'false'; fileInput.value = ''; } }
    });
  }
  window.LabBranding = { apply: apply, remembered: remembered, schoolFields: schoolFields, pageFor: pageFor, pickerHTML: pickerHTML, mount: mount, readPicker: readPicker };
  // Keep server-rendered icons authoritative while the authenticated workspace loads.
  apply(remembered(), false, false);
})();
