/* 轻伴 LightMate — 工具函数层
 * DOM / 日期 / 格式化 / 提示条 / 弹窗 / 图表
 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});

  /* ---------------------------- DOM ---------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'dataset' && typeof v === 'object') Object.assign(node.dataset, v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------------------------- 日期 ---------------------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function toKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    var p = String(key).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  function today() { return toKey(new Date()); }

  function addDays(key, n) {
    var d = fromKey(key);
    d.setDate(d.getDate() + n);
    return toKey(d);
  }

  function diffDays(a, b) {
    // b - a，单位天
    var ms = fromKey(b).getTime() - fromKey(a).getTime();
    return Math.round(ms / 86400000);
  }

  function rangeKeys(startKey, days) {
    var out = [];
    for (var i = 0; i < days; i++) out.push(addDays(startKey, i));
    return out;
  }

  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

  function weekdayCN(key) { return '周' + WEEK_CN[fromKey(key).getDay()]; }

  function fmtMD(key) {
    var d = fromKey(key);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function fmtMDW(key) {
    return fmtMD(key) + ' ' + weekdayCN(key);
  }

  function nowTime() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function greetingKey() {
    var h = new Date().getHours();
    if (h < 11) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  /* ---------------------------- 格式化 ---------------------------- */
  function num(n) { return Math.round(Number(n) || 0); }

  function comma(n) {
    return String(num(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function pct(a, b) { return b > 0 ? clamp(Math.round((a / b) * 100), 0, 999) : 0; }

  /* ---------------------------- 环形进度（纯 SVG） ---------------------------- */
  function ringSVG(percent, opts) {
    opts = opts || {};
    var size = opts.size || 168;
    var stroke = opts.stroke || 14;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var p = clamp(percent, 0, 100);
    var dash = c * p / 100;
    var color = opts.color || 'var(--mint-500)';
    var track = opts.track || 'var(--line)';
    var id = 'rg' + Math.random().toString(36).slice(2, 8);
    var svg =
      '<svg class="ring" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="完成 ' + p + '%">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + (opts.from || '#7DD3A8') + '"/>' +
      '<stop offset="100%" stop-color="' + (opts.to || '#3FA97A') + '"/>' +
      '</linearGradient></defs>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#' + id + ')" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + (c - dash) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg>';
    return svg;
  }

  /* ---------------------------- 折线图（体重趋势） ---------------------------- */
  function lineChart(points, opts) {
    opts = opts || {};
    if (!points || points.length < 2) {
      return '<div class="empty-chart">至少记录 2 次体重后，这里会画出你的曲线。</div>';
    }
    var w = opts.width || 640, h = opts.height || 200;
    var padL = 38, padR = 16, padT = 18, padB = 26;
    var vals = points.map(function (p) { return p.value; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max - min < 1) { max = max + 0.5; min = min - 0.5; }
    var span = max - min;
    min -= span * 0.12; max += span * 0.12;
    var iw = w - padL - padR, ih = h - padT - padB;

    function X(i) { return padL + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw); }
    function Y(v) { return padT + ih - ((v - min) / (max - min)) * ih; }

    var path = points.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.value).toFixed(1); }).join(' ');
    var area = path + ' L' + X(points.length - 1).toFixed(1) + ' ' + (padT + ih) + ' L' + X(0).toFixed(1) + ' ' + (padT + ih) + ' Z';

    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var v = min + (max - min) * (g / 3);
      var y = Y(v);
      grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (w - padR) + '" y2="' + y.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>' +
        '<text x="' + (padL - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" class="chart-tick">' + v.toFixed(1) + '</text>';
    }

    var dots = points.map(function (p, i) {
      return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.value).toFixed(1) + '" r="3.5" fill="#fff" stroke="var(--mint-600)" stroke-width="2"><title>' +
        esc(p.label + ' · ' + p.value + ' kg') + '</title></circle>';
    }).join('');

    var first = points[0], last = points[points.length - 1];
    var labels = '<text x="' + padL + '" y="' + (h - 8) + '" class="chart-tick">' + esc(first.label) + '</text>' +
      '<text x="' + (w - padR) + '" y="' + (h - 8) + '" text-anchor="end" class="chart-tick">' + esc(last.label) + '</text>';

    return '<svg class="line-chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img">' +
      '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#3FA97A" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="#3FA97A" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#areaGrad)"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--mint-600)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + labels +
      '</svg>';
  }

  /* ---------------------------- Toast ---------------------------- */
  var toastTimer = null;
  function toast(msg, kind) {
    var box = $('#toast');
    if (!box) {
      box = el('div', { id: 'toast', class: 'toast-wrap' });
      document.body.appendChild(box);
    }
    box.innerHTML = '';
    box.appendChild(el('div', { class: 'toast toast-' + (kind || 'ok'), text: msg }));
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, 2600);
  }

  /* ---------------------------- Modal ---------------------------- */
  function modal(opts) {
    var wrap = el('div', { class: 'modal-mask' });
    var card = el('div', { class: 'modal-card' });
    card.appendChild(el('div', { class: 'modal-title', text: opts.title || '' }));
    if (opts.body) card.appendChild(el('div', { class: 'modal-body', html: opts.body }));
    var actions = el('div', { class: 'modal-actions' });
    (opts.actions || [{ label: '知道了' }]).forEach(function (a) {
      actions.appendChild(el('button', {
        class: 'btn ' + (a.kind || 'btn-ghost'),
        type: 'button',
        text: a.label,
        onclick: function () {
          close();
          if (a.onClick) a.onClick();
        }
      }));
    });
    card.appendChild(actions);
    wrap.appendChild(card);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('show'); });
    function close() {
      wrap.classList.remove('show');
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 200);
    }
    return { close: close };
  }

  /* ---------------------------- 演示用随机 ---------------------------- */
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(arr, rnd) {
    var r = (rnd || Math.random)();
    return arr[Math.floor(r * arr.length) % arr.length];
  }

  function pickMany(arr, n, rnd) {
    var copy = arr.slice(), out = [];
    while (out.length < n && copy.length) {
      var i = Math.floor((rnd || Math.random)() * copy.length) % copy.length;
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  LM.util = {
    $: $, $$: $$, el: el, esc: esc,
    pad: pad, toKey: toKey, fromKey: fromKey, today: today, addDays: addDays, diffDays: diffDays,
    rangeKeys: rangeKeys, weekdayCN: weekdayCN, fmtMD: fmtMD, fmtMDW: fmtMDW, nowTime: nowTime,
    greetingKey: greetingKey,
    num: num, comma: comma, clamp: clamp, pct: pct,
    ringSVG: ringSVG, lineChart: lineChart,
    toast: toast, modal: modal,
    hashStr: hashStr, mulberry32: mulberry32, pick: pick, pickMany: pickMany, uid: uid
  };
})(window);
