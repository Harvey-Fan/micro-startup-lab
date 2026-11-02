/* ========== 微创业实验室 · 公共脚本 ========== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const Store = {
  get(k, d) { try { const v = localStorage.getItem('mll_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mll_' + k, JSON.stringify(v)); } catch (e) {} }
};

function toast(msg, type = '') {
  let wrap = $('#toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2600);
}

const fmt = (n, d = 2) => (Number.isFinite(+n) ? (+n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const fmt0 = n => (Number.isFinite(+n) ? Math.round(+n).toLocaleString('zh-CN') : '—');
const pct = n => (n >= 0 ? '+' : '') + fmt(n, 2) + '%';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- 导航与页脚 ---------- */
const NAV = [
  ['index.html', '创意展厅'],
  ['camp.html', '推免雷达'],
  ['crypto.html', '加密记账'],
  ['radar.html', '信息差雷达'],
  ['health.html', '薄肌实验室'],
  ['baoyan.html', '保研工具箱']
];
function renderNav(active) {
  const links = NAV.map(([href, name]) =>
    `<a href="${href}" class="${href === active ? 'active' : ''}">${name}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
  <nav class="nav"><div class="nav-inner">
    <a class="logo" href="index.html"><span class="logo-badge">⚡</span>
      <span>微创业实验室<small>MICRO-STARTUP LAB</small></span></a>
    <div class="nav-links">${links}</div>
  </div></nav>`);
  document.body.insertAdjacentHTML('beforeend', `
  <div id="toast-wrap"></div>
  <footer class="foot"><div class="container">
    <p class="disc">⚠️ 行情来自 Binance/Gate.io/CoinGecko 公开接口、汇率来自欧洲央行参考汇率、食品数据来自 Open Food Facts；网络受限时自动降级为本地模拟。数据仅保存在你自己的浏览器(localStorage)中，不构成任何投资建议。</p>
    <p>微创业实验室 · 为软件工程新生打造的「信息差产品」练习场 — 学技术 · 做产品 · 理解商业 · 反哺学业</p>
    <p style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:6px">
        <img alt="全站访客" style="height:20px"
          src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fharvey-fan.github.io%2Fmicro-startup-lab%2F&label=%E8%AE%BF%E5%AE%A2&labelColor=%231d2946&countColor=%2338e1ff&style=flat"
          onerror="this.style.display='none'">
        <span class="faint">你是第 <b id="localVisits" style="color:var(--cyan)">—</b> 次打开本站</span>
      </span>
      <span class="faint">·</span><a href="https://github.com/Harvey-Fan/micro-startup-lab" target="_blank" rel="noopener" style="font-size:12px">GitHub 源码</a>
    </p>
  </div></footer>`);

  // 本地访问次数
  const n = (Store.get('site_visits', 0) || 0) + 1;
  Store.set('site_visits', n);
  const lv = document.getElementById('localVisits');
  if (lv) lv.textContent = n;

  // 百度统计（注册 tongji.baidu.com 拿到站点 ID 后填入即可自动生效；留空不加载）
  const BAIDU_TONGJI_ID = '';
  if (BAIDU_TONGJI_ID) {
    window._hmt = window._hmt || [];
    const hm = document.createElement('script');
    hm.src = 'https://hm.baidu.com/hm.js?' + BAIDU_TONGJI_ID;
    hm.async = 1;
    document.head.appendChild(hm);
  }
}

/* ---------- Tabs ---------- */
function initTabs(root = document) {
  $$('.tab', root).forEach(tab => tab.addEventListener('click', () => {
    const group = tab.dataset.group || 'default';
    $$(`.tab[data-group="${group}"]`).forEach(t => t.classList.remove('on'));
    $$(`.tabpane[data-group="${group}"]`).forEach(p => p.classList.remove('on'));
    tab.classList.add('on');
    $('#' + tab.dataset.target, root).classList.add('on');
  }));
}

/* ---------- 轻量折线图(Canvas, 无依赖) ---------- */
function drawLineChart(canvas, { values, labels = [], color = '#38e1ff', target = null, fill = true, height = 240 }) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 600, H = height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  if (!values || values.length === 0) {
    ctx.fillStyle = '#64748f'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('暂无数据', W / 2, H / 2);
    return;
  }
  const pad = { l: 46, r: 16, t: 18, b: 26 };
  let mn = Math.min(...values), mx = Math.max(...values);
  if (target != null) { mn = Math.min(mn, target); mx = Math.max(mx, target); }
  if (mn === mx) { mn -= 1; mx += 1; }
  const range = (mx - mn) * 1.12 || 1;
  mn -= (mx - mn) * 0.06 || 0.5; mx = mn + range;
  const x = i => pad.l + (values.length === 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (values.length - 1));
  const y = v => pad.t + (1 - (v - mn) / (mx - mn)) * (H - pad.t - pad.b);

  // 网格
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
  ctx.fillStyle = '#64748f'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const yy = pad.t + i * (H - pad.t - pad.b) / 4;
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke();
    const v = mx - i * (mx - mn) / 4;
    ctx.fillText(v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(v % 1 ? 1 : 0), pad.l - 8, yy + 4);
  }
  // 目标线
  if (target != null) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,180,84,.7)';
    ctx.beginPath(); ctx.moveTo(pad.l, y(target)); ctx.lineTo(W - pad.r, y(target)); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#ffb454'; ctx.textAlign = 'left';
    ctx.fillText('目标 ' + target, pad.l + 6, y(target) - 5);
  }
  // 面积
  if (fill && values.length > 1) {
    const g = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    g.addColorStop(0, color + '33'); g.addColorStop(1, color + '00');
    ctx.beginPath(); ctx.moveTo(x(0), H - pad.b);
    values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.lineTo(x(values.length - 1), H - pad.b); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
  }
  // 折线
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  values.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.stroke();
  // 点 + 首末标签
  values.forEach((v, i) => {
    if (i === values.length - 1 || values.length <= 14) {
      ctx.beginPath(); ctx.arc(x(i), y(v), values.length <= 14 ? 2.6 : 3.4, 0, 7);
      ctx.fillStyle = color; ctx.fill();
    }
  });
  if (labels.length) {
    ctx.fillStyle = '#64748f'; ctx.textAlign = 'center';
    const idxs = values.length <= 6 ? values.map((_, i) => i) : [0, Math.floor((values.length - 1) / 2), values.length - 1];
    idxs.forEach(i => labels[i] && ctx.fillText(labels[i], x(i), H - 8));
  }
}

/* ---------- 带超时的 JSON 请求（GitHub Pages 纯静态站点直连 CORS 接口） ---------- */
async function fetchJSON(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/* ---------- CSV 导出 / 下载 ---------- */
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
