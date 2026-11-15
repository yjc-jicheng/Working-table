/* 图表（原生 SVG，零依赖）
 * 视图里先用 slot() 占位，渲染完成后 mount() 按容器实际宽度绘制，文字不会被拉伸。
 * 颜色全部走 CSS 变量，深浅色主题自动切换；悬停提示由 [data-tip] 统一处理。
 */
window.LabCharts = (function () {
  'use strict';
  let slots = [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function n1(v) { return Number(v).toFixed(1); }
  function niceStep(raw) {
    if (raw <= 1) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / pow;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  }
  function scale(values) {
    const max = Math.max.apply(null, values.concat([1]));
    const step = niceStep(max / 3);
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = [];
    for (let t = 0; t <= top + 1e-9; t += step) ticks.push(t);
    return { top: top, ticks: ticks };
  }
  function frame(w, h, sc, box) {
    let out = '';
    sc.ticks.forEach(function (t) {
      const y = box.top + box.ih - (t / sc.top) * box.ih;
      out += '<line class="' + (t === 0 ? 'ch-base' : 'ch-grid') + '" x1="' + box.left + '" y1="' + n1(y) + '" x2="' + (w - box.right) + '" y2="' + n1(y) + '"/>' +
        '<text class="ch-tick" x="' + (box.left - 8) + '" y="' + n1(y + 3.5) + '" text-anchor="end">' + t + '</text>';
    });
    return out;
  }
  /* 标签过密时按间隔抽稀，始终保留最后一个 */
  function labelStep(count, innerWidth, minGap) {
    return Math.max(1, Math.ceil(count / Math.max(1, Math.floor(innerWidth / minGap))));
  }

  function line(cfg, w) {
    const h = cfg.height || 170, box = { left: 32, right: 30, top: 18, bottom: 26 };
    box.iw = w - box.left - box.right; box.ih = h - box.top - box.bottom;
    const values = cfg.values, labels = cfg.labels || [], count = values.length;
    const sc = scale(values), color = cfg.color || 'var(--chart-1)';
    const pts = values.map(function (v, i) {
      return [box.left + (count === 1 ? box.iw / 2 : i * box.iw / (count - 1)), box.top + box.ih - (v / sc.top) * box.ih];
    });
    const path = pts.map(function (p, i) { return (i ? 'L' : 'M') + n1(p[0]) + ' ' + n1(p[1]); }).join(' ');
    const base = box.top + box.ih;
    const area = path + ' L' + n1(pts[count - 1][0]) + ' ' + base + ' L' + n1(pts[0][0]) + ' ' + base + ' Z';
    const step = labelStep(count, box.iw, 46);
    let xl = '', hits = '';
    const band = count === 1 ? box.iw : box.iw / (count - 1);
    pts.forEach(function (p, i) {
      const last = i === count - 1;
      if (labels[i] && (last || (i % step === 0 && count - 1 - i >= step * 0.6))) {
        xl += '<text class="ch-tick" x="' + n1(p[0]) + '" y="' + (h - 7) + '" text-anchor="' + (last ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(labels[i]) + '</text>';
      }
      const tip = (cfg.tips && cfg.tips[i]) || ((labels[i] || '') + '：' + values[i] + (cfg.unit || ''));
      hits += '<g class="ch-hit" data-tip="' + esc(tip) + '"><rect x="' + n1(p[0] - band / 2) + '" y="' + box.top + '" width="' + n1(band) + '" height="' + box.ih + '" fill="transparent"/>' +
        '<line class="ch-guide ch-hover" x1="' + n1(p[0]) + '" y1="' + box.top + '" x2="' + n1(p[0]) + '" y2="' + base + '"/>' +
        '<circle class="ch-dot ch-hover" cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="4.5" style="fill:' + color + '"/></g>';
    });
    const end = pts[count - 1];
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(cfg.label || '趋势折线图') + '">' + frame(w, h, sc, box) +
      '<path d="' + area + '" style="fill:' + color + '" opacity="0.1"/>' +
      '<path d="' + path + '" fill="none" style="stroke:' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle class="ch-dot" cx="' + n1(end[0]) + '" cy="' + n1(end[1]) + '" r="4.5" style="fill:' + color + '"/>' +
      '<text class="ch-value" x="' + n1(end[0] + 9) + '" y="' + n1(end[1] + 4) + '">' + values[count - 1] + '</text>' +
      xl + hits + '</svg>';
  }

  function bar(cfg, w) {
    const h = cfg.height || 170, box = { left: 32, right: 12, top: 18, bottom: 26 };
    box.iw = w - box.left - box.right; box.ih = h - box.top - box.bottom;
    const series = cfg.series, labels = cfg.labels || [], count = labels.length, groups = series.length;
    const sc = scale(series.reduce(function (all, s) { return all.concat(s.values); }, []));
    const slotW = box.iw / count, gap = 2;
    const bw = Math.max(4, Math.min(24, (slotW * 0.62 - gap * (groups - 1)) / groups));
    const groupW = bw * groups + gap * (groups - 1), base = box.top + box.ih;
    const step = labelStep(count, box.iw, 44);
    let out = '';
    for (let i = 0; i < count; i++) {
      const cx = box.left + slotW * (i + 0.5);
      series.forEach(function (s, k) {
        const v = Number(s.values[i]) || 0, bh = (v / sc.top) * box.ih;
        const x = cx - groupW / 2 + k * (bw + gap), y = base - bh, r = Math.min(4, bw / 2, bh);
        const tip = (labels[i] ? labels[i] + ' · ' : '') + s.name + '：' + v + (cfg.unit || '');
        if (bh > 0.5) {
          out += '<path class="ch-bar" data-tip="' + esc(tip) + '" style="fill:' + s.color + '" d="M' + n1(x) + ' ' + n1(base) + ' V' + n1(y + r) + ' Q' + n1(x) + ' ' + n1(y) + ' ' + n1(x + r) + ' ' + n1(y) +
            ' H' + n1(x + bw - r) + ' Q' + n1(x + bw) + ' ' + n1(y) + ' ' + n1(x + bw) + ' ' + n1(y + r) + ' V' + n1(base) + ' Z"/>';
        }
        if (groups === 1 && v > 0) out += '<text class="ch-value" x="' + n1(x + bw / 2) + '" y="' + n1(y - 6) + '" text-anchor="middle">' + v + '</text>';
      });
      if (labels[i] && (i % step === 0 || i === count - 1)) out += '<text class="ch-tick" x="' + n1(cx) + '" y="' + (h - 7) + '" text-anchor="middle">' + esc(labels[i]) + '</text>';
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(cfg.label || '柱状图') + '">' + frame(w, h, sc, box) + out + '</svg>';
  }

  /* 环形图尺寸固定，直接返回 SVG；分段之间留 2px 间隙 */
  function donut(segments, centerLabel, caption) {
    const size = 156, r = 56, cx = 78, cy = 78, sw = 16;
    const total = segments.reduce(function (a, b) { return a + b.value; }, 0);
    const live = segments.filter(function (s) { return s.value > 0; });
    const pad = live.length > 1 ? 2 / r : 0;
    let angle = -Math.PI / 2, out = '';
    if (!total) out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" class="ch-empty" stroke-width="' + sw + '"/>';
    live.forEach(function (s) {
      const sweep = (s.value / total) * Math.PI * 2;
      const a1 = angle + pad / 2, a2 = angle + sweep - pad / 2;
      const tip = s.label + '：' + s.value + '（' + Math.round(s.value / total * 100) + '%）';
      if (live.length === 1) {
        out += '<circle class="ch-arc" data-tip="' + esc(tip) + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" style="stroke:' + s.color + '" stroke-width="' + sw + '"/>';
      } else if (a2 > a1) {
        out += '<path class="ch-arc" data-tip="' + esc(tip) + '" d="M' + n1(cx + r * Math.cos(a1)) + ' ' + n1(cy + r * Math.sin(a1)) + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > Math.PI ? 1 : 0) + ' 1 ' +
          n1(cx + r * Math.cos(a2)) + ' ' + n1(cy + r * Math.sin(a2)) + '" fill="none" style="stroke:' + s.color + '" stroke-width="' + sw + '"/>';
      }
      angle += sweep;
    });
    out += '<text class="ch-center" x="' + cx + '" y="' + (cy + 3) + '" text-anchor="middle">' + esc(centerLabel) + '</text>' +
      '<text class="ch-tick" x="' + cx + '" y="' + (cy + 21) + '" text-anchor="middle">' + esc(caption || '总计') + '</text>';
    return '<svg class="donut" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="占比环形图">' + out + '</svg>';
  }

  function legend(series) {
    return '<div class="ch-legend">' + series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>';
    }).join('') + '</div>';
  }
  function slot(cfg) {
    slots.push(cfg);
    return (cfg.type === 'bar' && cfg.series.length > 1 ? legend(cfg.series) : '') +
      '<div class="chart" data-chart="' + (slots.length - 1) + '" style="height:' + (cfg.height || 170) + 'px"></div>';
  }
  function reset() { slots = []; }
  function mount(root) {
    (root || document).querySelectorAll('[data-chart]').forEach(function (el) {
      const cfg = slots[Number(el.dataset.chart)];
      if (!cfg) return;
      const w = Math.max(220, Math.floor(el.clientWidth) || 560);
      el.innerHTML = cfg.type === 'bar' ? bar(cfg, w) : line(cfg, w);
    });
  }

  /* 悬停提示 */
  let tipEl = null;
  function showTip(target, e) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
    tipEl.textContent = target.getAttribute('data-tip');
    tipEl.classList.add('show');
    moveTip(e);
  }
  function moveTip(e) {
    if (!tipEl) return;
    const pad = 12, rect = tipEl.getBoundingClientRect();
    let x = e.clientX + pad, y = e.clientY - rect.height - pad;
    if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
    if (y < 8) y = e.clientY + pad;
    tipEl.style.left = Math.max(8, x) + 'px'; tipEl.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.remove('show'); }
  document.addEventListener('mouseover', function (e) {
    const target = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (target) showTip(target, e); else hideTip();
  });
  document.addEventListener('mousemove', function (e) { if (tipEl && tipEl.classList.contains('show')) moveTip(e); });
  document.addEventListener('scroll', hideTip, true);

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { mount(document); }, 120);
  });

  return { slot: slot, reset: reset, mount: mount, donut: donut };
})();
