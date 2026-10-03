/* ═══ EchoPath Demo —— 后端对接版 V5 ═══
   首页 P1：回响 Canvas（多条来路汇成你这一条，随指针聚拢，点击荡开回声）
   来时路 P2：AI 对谈收在便签里；主区是由对谈生成的「来路图」
   理解困境 P3：整页平铺的编辑式排版
   决策地形 P4：可触碰的知识网络（节点避让指针、可拖拽、点击深入）
   真实案例 P5：数据生成的案例头图 + 阅读进度 + 回到决策地形
   全局：加载仪式（路径生长等待画面）+ API 调试台 + 三级降级 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const body = document.body;
const CURVE = 50;
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════ 一、后端探测与 API 客户端 ═══════════ */

const HEALTH_TIMEOUT = 2500;
const Backend = { online: false, keyConfigured: false, base: '' };

function savedBase() {
  try { return localStorage.getItem('echopath.backend') || ''; } catch { return ''; }
}
async function tryHealth(base) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT);
  try {
    const r = await fetch(`${base}/health`, { signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; } finally { clearTimeout(timer); }
}
async function detectBackend() {
  const candidates = [];
  if (savedBase()) candidates.push(savedBase());
  if (location.protocol.startsWith('http')) candidates.push('/api');
  candidates.push('http://localhost:3000/api');
  for (const base of [...new Set(candidates)]) {
    const h = await tryHealth(base);
    if (h && h.ok) {
      Backend.online = true; Backend.base = base; Backend.keyConfigured = !!h.key_configured;
      return true;
    }
  }
  Backend.online = false; Backend.keyConfigured = false; Backend.base = '';
  return false;
}
async function api(path, bodyData) {
  const opt = bodyData === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) };
  const t0 = performance.now();
  const r = await fetch(`${Backend.base}${path}`, opt);
  const ms = Math.round(performance.now() - t0);
  const text = await r.text();
  let json = {};
  try { json = JSON.parse(text); } catch { /* 保持空对象 */ }
  if (!r.ok) {
    const err = new Error(json.error?.message || `HTTP ${r.status}`);
    err.code = json.error?.code || ''; err.hint = json.error?.hint || '';
    err.status = r.status; err.ms = ms; err.raw = json;
    throw err;
  }
  json.__ms = ms;
  return json;
}
function refreshBackendHint() {
  const dot = $('#backendDot'), hint = $('#backendHint'), tag = $('#noteTag');
  dot.className = 'backend-dot' + (Backend.online ? (Backend.keyConfigured ? ' on' : ' half') : '');
  if (!Backend.online) {
    hint.textContent = '离线 · 模拟数据';
    tag.textContent = '模拟数据 · 未连接后端'; tag.classList.remove('ok');
  } else if (!Backend.keyConfigured) {
    hint.textContent = '后端在线 · 未配 AI Key';
    tag.textContent = '后端在线 · 访谈需配 Key'; tag.classList.remove('ok');
  } else {
    hint.textContent = '已连接后端';
    tag.textContent = '已连接 EchoPath 后端'; tag.classList.add('ok');
  }
  const devBase = $('#devBase');
  if (devBase) devBase.textContent = Backend.base || '（未连接）';
}

/* ═══════════ 二、访谈字段规格（与 src/types/interview.ts 对齐） ═══════════ */

const FIELDS = [
  { key: 'stage',                  label: '你在什么阶段' },
  { key: 'dilemma',                label: '你在纠结什么' },
  { key: 'prior_path',             label: '你怎么走到今天的' },
  { key: 'constraints',            label: '拔不掉的条件' },
  { key: 'goals',                  label: '你最在意的' },
  { key: 'validation',             label: '为新方向做过什么' },
  { key: 'fear',                   label: '你最怕发生什么' },
  { key: 'reversibility_attitude', label: '试不成能不能接受' },
];

/* ═══════════ 三、全局状态 ═══════════ */

let seq = 0;
const uid = () => 'm' + (++seq);

const Store = {
  messages: [], iState: null, askedField: '',
  phase: 'idle', busy: false,
  summary: '', noDilemma: false, bestQuote: '',
  situation: null, landscape: null,
  sourceId: undefined, sources: [],
  currentCases: [],
  mockMode: false,
  fieldSources: {},   // 每个字段对应的用户原话（点来路图节点查看/纠正用）
};

function persist() {
  try {
    sessionStorage.setItem('echopath.ui.v2', JSON.stringify({
      messages: Store.messages, iState: Store.iState, askedField: Store.askedField,
      summary: Store.summary, noDilemma: Store.noDilemma, bestQuote: Store.bestQuote,
      situation: Store.situation, landscape: Store.landscape, sourceId: Store.sourceId,
      currentCases: Store.currentCases, mockMode: Store.mockMode,
      fieldSources: Store.fieldSources,
    }));
  } catch { /* 忽略 */ }
}
function restore() {
  try {
    const d = JSON.parse(sessionStorage.getItem('echopath.ui.v2') || 'null');
    if (d) Object.assign(Store, d);
    return !!d;
  } catch { return false; }
}

/* ═══════════ 四、首页「回响」Canvas ═══════════
   多条来自左侧的来路，向「你此刻的位置」汇聚；
   指针移动时汇聚点柔和跟随，点击时荡开一圈回声。 */

const echo = { raf: 0, mx: .68, my: .54, tx: .68, ty: .54, ripples: [], paths: [] };

function initEchoCanvas() {
  const cv = $('#echoCanvas');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    const r = cv.getBoundingClientRect();
    cv.width = r.width * dpr; cv.height = r.height * dpr;
  }
  resize();

  /* 六条来路：起点与弯度各异，都汇向同一个点 */
  const N = 6;
  if (!echo.paths.length) {
    echo.paths = Array.from({ length: N }, (_, i) => ({
      y0: 0.12 + (i / (N - 1)) * 0.76,          // 左侧起点（相对高度）
      bend: (i - (N - 1) / 2) * 0.16,           // 各自的性格
      phase: Math.random() * Math.PI * 2,
      hue: i === N - 2,                          // 其中一条用木橙：最像你的那条来路
    }));
  }

  /* ⚠️ 监听只挂一次：每次回到首页都会重进本函数，重复挂会让回声圈翻倍 */
  if (!echo.bound) {
    echo.bound = true;
    addEventListener('resize', resize);
    const host = $('#p1');
    host.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      echo.tx = Math.min(.9, Math.max(.35, (e.clientX - r.left) / r.width));
      echo.ty = Math.min(.85, Math.max(.15, (e.clientY - r.top) / r.height));
    });
    host.addEventListener('pointerdown', () => {
      echo.ripples.push({ r: 0, a: .5 });
    });
  }

  function frame(t) {
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    /* 汇聚点缓慢跟随指针 */
    echo.mx += (echo.tx - echo.mx) * 0.045;
    echo.my += (echo.ty - echo.my) * 0.045;
    const mx = echo.mx * W, my = echo.my * H;

    const GREEN = '111,127,94', WOOD = '185,125,70';
    for (const p of echo.paths) {
      const y0 = p.y0 * H + Math.sin(t / 2600 + p.phase) * 6 * dpr;
      const c1x = W * 0.30, c1y = y0 + p.bend * H * 0.55;
      const c2x = W * 0.55, c2y = my + (y0 - my) * 0.25;
      ctx.beginPath();
      ctx.moveTo(-20, y0);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, mx, my);
      ctx.strokeStyle = `rgba(${p.hue ? WOOD : GREEN},${p.hue ? .30 : .16})`;
      ctx.lineWidth = (p.hue ? 1.4 : 1) * dpr;
      ctx.stroke();
      /* 来路上的小节点：缓慢向汇聚点漂移 */
      const prog = ((t / 9000) + p.phase / (Math.PI * 2)) % 1;
      const q = 1 - prog, bx = q * q * q * -20 + 3 * q * q * prog * c1x + 3 * q * prog * prog * c2x + prog ** 3 * mx;
      const by = q * q * q * y0 + 3 * q * q * prog * c1y + 3 * q * prog * prog * c2y + prog ** 3 * my;
      ctx.beginPath();
      ctx.arc(bx, by, 2.2 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue ? WOOD : GREEN},${.5 * (1 - prog) + .1})`;
      ctx.fill();
    }

    /* 汇聚点之后：你的线向未来延伸出去 */
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.bezierCurveTo(mx + W * .10, my - H * .06, mx + W * .22, my - H * .10, W + 20, my - H * .14);
    ctx.strokeStyle = `rgba(${GREEN},.28)`;
    ctx.lineWidth = 1.4 * dpr;
    ctx.stroke();

    /* NOW 点：外圈呼吸 */
    const breathe = REDUCED ? 0 : Math.sin(t / 900) * 1.5 * dpr;
    ctx.beginPath(); ctx.arc(mx, my, 7 * dpr + breathe, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${WOOD},.5)`; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
    ctx.beginPath(); ctx.arc(mx, my, 3.2 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${WOOD})`; ctx.fill();

    /* 点击的回声圈 */
    echo.ripples = echo.ripples.filter(r => r.a > 0.01);
    for (const r of echo.ripples) {
      r.r += 2.2 * dpr; r.a *= 0.965;
      ctx.beginPath(); ctx.arc(mx, my, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${WOOD},${r.a})`; ctx.lineWidth = 1 * dpr; ctx.stroke();
    }

    if (!REDUCED) echo.raf = requestAnimationFrame(frame);
  }
  if (echo.raf) cancelAnimationFrame(echo.raf);
  if (REDUCED) { frame(0); return; }   // 减少动态：只画一帧静帧
  echo.raf = requestAnimationFrame(frame);
}

/* ═══════════ 五、来路图（P2 主区：由对谈生成的图形） ═══════════
   重组原则：
   - 主路径只放「经历与转折」（prior_path → validation → NOW）—— 按语义先后，不发明日期/因果；
   - 目标 / 约束 / 担忧是**旁注**，虚线挂在 NOW 上，不占时间节点；
   - 新节点局部生长，已有节点保持稳定（road.drawn 登记制）；
   - 未确认的未来方向画成「未定的虚线 + 空心问号」，不画成已选择的路；
   - 点节点看原话、当场纠正（纠正后置信度记 1 = 已确认）。 */

const ROAD_MAIN = ['prior_path', 'validation'];
const ROAD_ANNO = [
  { key: 'constraints', kind: '拔不掉', dx: -120, dy: -110 },
  { key: 'goals', kind: '在意', dx: 150, dy: -110 },
  { key: 'fear', kind: '最怕', dx: 10, dy: 105 },
];
const road = { drawn: new Set() };

/* 旅伴缩小守在 NOW 旁（访谈开始后） */
function palMini(x, y) {
  return `<g class="pal-mini" transform="translate(${x},${y}) scale(0.3)">
    <polygon class="pf-shade" points="124,74 124,168 88,168 110,74"/>
    <polygon class="pf-body" points="124,74 136,74 160,168 124,168"/>
    <polygon class="pf-hood" points="124,36 106,72 142,72"/>
    <polygon class="pf-hood-f" points="124,36 124,72 142,72"/>
    <circle class="pf-face" cx="121" cy="60" r="5"/>
    <line class="pf-arm" x1="142" y1="98" x2="176" y2="88"/>
    <line class="pf-arm" x1="176" y1="88" x2="176" y2="104"/>
    <circle cx="176" cy="115" r="30" fill="#E8B168" opacity=".22"/>
    <rect class="pf-lantern" x="168" y="104" width="16" height="22" rx="4"/>
    <circle class="pf-flame" cx="176" cy="115" r="4"/>
  </g>`;
}

function drawRoad() {
  const svg = $('#roadSvg');
  if (!svg) return;
  const c = Store.iState?.collected || {};
  const mainKeys = ROAD_MAIN.filter(k => c[k]);
  const nowKnown = c.dilemma || c.stage;
  const baseY = 250;

  if (!mainKeys.length && !nowKnown) {
    svg.innerHTML = `<path class="road-line ghost" d="M40,${baseY} C240,${baseY - 30} 420,${baseY + 20} 760,${baseY - 40}"/>
      <text class="road-note" x="400" y="${baseY - 60}" text-anchor="middle">这里还空着，等你开口</text>`;
    return;
  }

  /* 主路径节点：经历与转折，终点是 NOW（此刻的路口） */
  const nodes = mainKeys.map(k => ({ key: k, label: FIELDS.find(f => f.key === k)?.label || k, value: c[k] }));
  nodes.push({ key: 'now', label: '此刻的路口', value: c.dilemma || '' });
  const n = nodes.length;
  const xs = nodes.map((_, i) => 90 + i * (430 / Math.max(n - 1, 1)));
  const ys = xs.map((x, i) => baseY - 26 * Math.sin((x - 40) / 720 * Math.PI) + (i % 2 ? 16 : -6));
  const nowX = xs[n - 1], nowY = ys[n - 1];

  let h = `<path class="road-line" d="M40,${baseY} C240,${baseY - 30} 420,${baseY + 20} 760,${baseY - 40}"/>`;

  nodes.forEach((nd, i) => {
    const isNow = nd.key === 'now';
    const isNew = !road.drawn.has(nd.key);
    const val = String(nd.value).length > 14 ? String(nd.value).slice(0, 14) + '…' : nd.value;
    h += `<g class="road-node${isNow ? ' now' : ''}${isNew ? ' grow-in' : ''}" data-key="${nd.key}" transform="translate(${xs[i]},${ys[i]})"
            tabindex="0" role="button" aria-label="${esc(nd.label)}：${esc(String(nd.value || ''))}。回车查看原话或纠正">
      <circle class="dot" cx="0" cy="0" r="${isNow ? 7 : 5}"/>
      <text class="rn-label" x="0" y="-30" text-anchor="middle">${esc(nd.label)}</text>
      ${val ? `<text class="rn-value" x="0" y="-14" text-anchor="middle">${esc(val)}</text>` : ''}
    </g>`;
    if (isNow) h += `<text class="rn-now${isNew ? ' grow-in' : ''}" x="${xs[i]}" y="${ys[i] + 28}" text-anchor="middle">NOW${c.stage ? ' · ' + esc(String(c.stage).slice(0, 10)) : ''}</text>`;
  });

  /* 旁注：约束 / 在意 / 担忧 —— 虚线挂在 NOW 上，不是时间节点 */
  ROAD_ANNO.forEach(a => {
    const v = c[a.key];
    if (!v) return;
    const isNew = !road.drawn.has(a.key);
    const bx = nowX + a.dx, by = nowY + a.dy;
    const txt = String(v).length > 16 ? String(v).slice(0, 16) + '…' : v;
    const w = Math.max(String(txt).length * 11 + 18, 78);
    h += `<g class="road-anno${isNew ? ' grow-in' : ''}">
      <line x1="${nowX}" y1="${nowY}" x2="${bx}" y2="${by + 6}"/>
      <g class="road-node anno" data-key="${a.key}" transform="translate(0,0)"
         tabindex="0" role="button" aria-label="${a.kind}：${esc(String(v))}。回车查看原话或纠正">
        <rect class="anno-box" x="${bx - w / 2}" y="${by - 16}" width="${w}" height="38" rx="8"/>
        <text class="anno-kind" x="${bx}" y="${by - 2}" text-anchor="middle">${a.kind}</text>
        <text class="anno-tag" x="${bx}" y="${by + 12}" text-anchor="middle">${esc(txt)}</text>
      </g>
    </g>`;
  });

  /* 旅伴缩小守在 NOW 旁 */
  if (Store.messages.length) h += palMini(nowX + 30, nowY - 66);

  /* 未确认的未来：未定虚线 + 空心问号，不画成已选的路 */
  h += `<path class="road-future" d="M${nowX},${nowY} C${nowX + 90},${nowY - 24} ${nowX + 150},${nowY - 44} 700,${nowY - 62}"/>
    <circle class="road-q" cx="712" cy="${nowY - 64}" r="6"/>
    <text class="road-future-label" x="712" y="${nowY - 80}" text-anchor="middle">还没定 · 也不用现在定</text>`;

  svg.innerHTML = h;

  /* 主路生长动画只在第一次 */
  if (!road.drawn.has('__main')) {
    const p = svg.querySelector('.road-line:not(.ghost)');
    if (p) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        p.style.transition = 'stroke-dashoffset 900ms var(--ease)';
        p.style.strokeDashoffset = 0;
      }));
    }
    road.drawn.add('__main');
  }
  nodes.forEach(nd => road.drawn.add(nd.key));
  ROAD_ANNO.forEach(a => { if (c[a.key]) road.drawn.add(a.key); });

  $('#roadHint').textContent = nodes.length > 1
    ? '点任意节点，能看到你当时的原话，也能直接纠正。'
    : '随着便签里的对谈，你的来路会在这里逐步成形。';
}

/* 原话弹层 + 纠正流程 */
function hideRoadPop() { const p = $('#roadPop'); if (p) p.hidden = true; }
function showRoadPop(key, g) {
  const pop = $('#roadPop');
  if (!pop || !Store.iState) return;
  const fkey = key === 'now' ? 'dilemma' : key;
  const label = key === 'now' ? '此刻的路口' : (FIELDS.find(f => f.key === fkey)?.label || key);
  const anno = ROAD_ANNO.find(a => a.key === fkey);
  const value = Store.iState.collected[fkey] || '';
  const src = Store.fieldSources?.[fkey];
  pop.innerHTML = `
    <button class="rp-x" id="rpClose" aria-label="关闭">×</button>
    <p class="rp-kind">${esc(anno ? anno.kind + ' · ' : '')}${esc(label)}</p>
    ${src?.text
      ? `<p class="rp-quote">${src.edited ? '你亲手改过：' : '你说过：'}“${esc(src.text.length > 90 ? src.text.slice(0, 90) + '…' : src.text)}”</p>`
      : '<p class="rp-quote">（这条是 AI 从对话里整理的，没有对应单句原话）</p>'}
    <input id="rpEdit" type="text" value="${esc(String(value))}" aria-label="纠正这条">
    <div class="rp-actions">
      <button class="tact" id="rpSave" style="color:var(--green)">按我说的改 ✓</button>
      <span style="font-size:.66rem;color:#b3a888">改完记为「已确认」</span>
    </div>`;
  pop.hidden = false;
  const host = pop.parentElement.getBoundingClientRect();
  const r = g.getBoundingClientRect();
  pop.style.left = Math.max(6, Math.min(r.left - host.left + r.width / 2 - 150, host.width - 310)) + 'px';
  pop.style.top = Math.max(6, r.bottom - host.top + 10 + ($('#roadScroll')?.scrollTop || 0)) + 'px';
  $('#rpClose').addEventListener('click', hideRoadPop);
  const save = () => {
    const v = $('#rpEdit').value.trim();
    if (v) {
      Store.iState.collected[fkey] = v;
      Store.iState.confidence[fkey] = 1;
      Store.fieldSources[fkey] = { text: v, edited: true };
      persist(); renderFieldPanel(); drawRoad();
    }
    hideRoadPop();
  };
  $('#rpSave').addEventListener('click', save);
  $('#rpEdit').addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
}
(function roadEvents() {
  const svg = $('#roadSvg');
  svg.addEventListener('click', e => {
    const g = e.target.closest('.road-node');
    if (g) showRoadPop(g.dataset.key, g); else hideRoadPop();
  });
  svg.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.road-node')) {
      e.preventDefault();
      showRoadPop(e.target.closest('.road-node').dataset.key, e.target.closest('.road-node'));
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.road-pop') && !e.target.closest('.road-node')) hideRoadPop();
  });
})();

/* ═══════════ 六、导航 ═══════════ */

const rail = $('#navRail'), cap = $('#navCapsule');
let moveTimer = null;
function capsuleTo(btn) {
  if (!btn || !cap) return;
  cap.style.transform = `translateY(${btn.offsetTop}px)`;
  cap.classList.add('moving');
  clearTimeout(moveTimer);
  moveTimer = setTimeout(() => cap.classList.remove('moving'), 240);
}
$$('.nav-item').forEach(b => {
  b.addEventListener('pointerenter', () => capsuleTo(b));
  b.addEventListener('click', () => showPage(b.dataset.page));
});
rail.addEventListener('pointerleave', () => capsuleTo($('.nav-item.is-active')));

let p2Started = false;
function showPage(id) {
  window.scrollTo(0, 0);          // ⚠️ 切页回顶：避免进入新页面时从中间开始
  $$('.page').forEach(p => p.classList.toggle('is-active', p.id === id));
  $$('.nav-item').forEach(b => b.classList.toggle('is-active', b.dataset.page === id));
  const active = $('.nav-item.is-active');
  $('#navTabLabel').textContent = active ? active.textContent : '';
  capsuleTo(active);
  if (id === 'p1') initEchoCanvas();
  else if (echo.raf) { cancelAnimationFrame(echo.raf); echo.raf = 0; }
  if (id === 'p2') { drawRoad(); if (!p2Started) { p2Started = true; void enterInterview(); } }
  if (id === 'p4') { renderLandscape(); void checkFreshness(); }
  else netStop();
  if (id === 'p5') renderCaseList();
  if (id === 'p6') renderSelfPage();
}
$$('[data-goto]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.goto)));
addEventListener('resize', () => capsuleTo($('.nav-item.is-active')));
$('#navCollapse').addEventListener('click', () => body.dataset.navstate = 'collapsed');
$('#navTab').addEventListener('click', () => {
  body.dataset.navstate = 'expanded';
  requestAnimationFrame(() => capsuleTo($('.nav-item.is-active')));
});

/* ⚠️ 小屏自动把导航收成竖条标签，回桌面自动展开；
   用户的手动收放只在当前断点内有效（跨断点时重新落默认态） */
const mqNarrow = matchMedia('(max-width: 900px)');
function applyNavMQ() {
  body.dataset.navstate = mqNarrow.matches ? 'collapsed' : 'expanded';
  requestAnimationFrame(() => capsuleTo($('.nav-item.is-active')));
}
mqNarrow.addEventListener('change', applyNavMQ);
if (mqNarrow.matches) applyNavMQ();

/* ═══════════ 七、便签对谈（P2：AI 只住在便签里） ═══════════ */

const chatLog = $('#chatLog'), chatForm = $('#chatForm'), chatText = $('#chatText');
const noteStatus = $('#noteStatus'), chatHints = $('#chatHints');

/* 回忆入口提示：两种来源 —— 后端 /answer 救援时带回的 hints（string[]），
   或用户主动点「帮我回忆」调 /interview/hints 动态生成（{entry, followup}[]）。
   ⚠️ 纪律：提示只帮回忆 —— 点击入口只**展开更具体的小问题**，
   由用户自己组织回答发送；任何提示文字都不会被自动提交为用户的答案。 */
let recallBusy = false;
let lastHintEntries = [];

function renderHints(list) {
  const items = (Array.isArray(list) ? list : [])
    .map(x => (typeof x === 'string' ? { entry: x, followup: '' } : x))
    .filter(x => x && x.entry && x.entry.trim());
  if (!items.length) { chatHints.hidden = true; chatHints.innerHTML = ''; return; }
  lastHintEntries = items.map(x => x.entry);
  chatHints.innerHTML =
    '<span class="chat-hints-label">帮你回忆（点开看一个更具体的问题）：</span>' +
    items.map((h, i) => `<button type="button" class="hint-chip" data-i="${i}">${esc(h.entry)}</button>`).join('') +
    '<button type="button" class="hint-chip hint-more" data-more="1">换一批</button>' +
    '<button type="button" class="hint-chip hint-skip" data-skip="1">都不是 / 暂时跳过 →</button>';
  chatHints.hidden = false;
  bindHintActions(items);
}
function bindHintActions(items) {
  $$('.hint-chip', chatHints).forEach(b => b.addEventListener('click', () => {
    if (b.dataset.skip) {          // 跳过是用户明确的动作：作为一条普通回答发送
      if (Store.busy) return;
      renderHints([]);
      if (Store.mockMode) mockChat('跳过');
      else if (Store.iState) sendAnswer('跳过');
      return;
    }
    if (b.dataset.more) { loadHints(lastHintEntries); return; }   // 换一批 = 换切入角度
    const item = items[Number(b.dataset.i)];
    if (item) expandHint(item);
  }));
}
/* 点进入口 → 展开更具体的小问题（引导他想），不把提示文字当作他的回答 */
function expandHint(item) {
  chatHints.innerHTML =
    `<span class="hint-followup serif">${esc(item.followup || `就从「${item.entry}」想起：当时是哪个环节让你印象最深？`)}</span>` +
    '<button type="button" class="hint-chip" data-fill="1">从「' + esc(item.entry) + '」开始写</button>' +
    '<button type="button" class="hint-chip hint-more" data-more="1">换一批</button>' +
    '<button type="button" class="hint-chip hint-skip" data-skip="1">都不是 / 暂时跳过 →</button>';
  $$('.hint-chip', chatHints).forEach(b => b.addEventListener('click', () => {
    if (b.dataset.skip) { if (!Store.busy) { renderHints([]); Store.mockMode ? mockChat('跳过') : sendAnswer('跳过'); } return; }
    if (b.dataset.more) { loadHints(lastHintEntries); return; }
    if (b.dataset.fill) { chatText.value = item.entry + '——'; chatText.focus(); }
  }));
}
/* 「帮我回忆」：动态生成（加载态 / 失败重试；失败时不拿固定文案冒充个性化结果） */
async function loadHints(previous = []) {
  if (recallBusy) return;
  if (Store.mockMode || !Store.iState) {
    chatHints.hidden = false;
    chatHints.innerHTML = '<span class="chat-hints-label hint-err">模拟模式下没有 AI 提示 —— 启动后端并配好 Key 后，这里会按你的语境动态生成。</span>';
    return;
  }
  recallBusy = true;
  chatHints.hidden = false;
  chatHints.innerHTML = '<span class="chat-hints-label hint-loading">正在按你聊到的内容，想几个回忆入口…</span>';
  try {
    const r = await api('/interview/hints', { state: Store.iState, asked_field: Store.askedField, previous_hints: previous });
    if ((r.hints || []).length) renderHints(r.hints);
    else chatHints.innerHTML = '<span class="chat-hints-label">这次没想到新入口 —— 试试自己先写半句？</span>';
  } catch (e) {
    chatHints.innerHTML = `<span class="chat-hints-label hint-err">没生成出来（${esc(e.message)}）</span>` +
      '<button type="button" class="hint-chip hint-more" id="hintRetry">重试</button>';
    $('#hintRetry').addEventListener('click', () => loadHints(lastHintEntries));
  } finally { recallBusy = false; }
}
$('#recallBtn').addEventListener('click', () => loadHints(lastHintEntries));

function renderChat() {
  chatLog.innerHTML = '';
  for (const m of Store.messages) {
    const p = document.createElement('p');
    p.className = m.role === 'user' ? 'me' : 'ai';
    p.textContent = m.text;
    p.dataset.mid = m.id;
    if (m.role === 'user' && m.stateBefore && Backend.online && !Store.mockMode) {
      const btn = document.createElement('button');
      btn.className = 'msg-edit'; btn.type = 'button'; btn.textContent = '改这句';
      btn.title = '回到这句之前，用新内容重走';
      btn.addEventListener('click', () => rewindTo(m.id));
      p.appendChild(btn);
    }
    chatLog.appendChild(p);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}
function pushMsg(role, text, extra = {}) {
  const m = { id: uid(), role, text, ...extra };
  Store.messages.push(m);
  renderChat();
  persist();
  return m;
}
function setStatus(text, isErr, withRetry) {
  noteStatus.hidden = false;
  noteStatus.className = 'note-status' + (isErr ? ' err' : '');
  noteStatus.textContent = text;
  if (withRetry) {
    const btn = document.createElement('button');
    btn.className = 'retry'; btn.textContent = '重试';
    btn.onclick = withRetry;
    noteStatus.appendChild(btn);
  }
}
function clearStatus() { noteStatus.hidden = true; noteStatus.textContent = ''; }

/* AI 等待指示：便签里的三个小点 */
let typingEl = null;
function showTyping() {
  hideTyping();
  typingEl = document.createElement('p');
  typingEl.className = 'ai typing-dots';
  typingEl.innerHTML = '<i></i><i></i><i></i>';
  chatLog.appendChild(typingEl);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function hideTyping() { typingEl?.remove(); typingEl = null; }

/* ── 字段明细面板（收在主区的折叠层里） ── */
function confDot(c) {
  const lv = c >= 0.8 ? 3 : c >= 0.5 ? 2 : 1;
  return `<span class="conf conf-${lv}" title="置信度 ${Math.round((c || 0) * 100)}%">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</span>`;
}
function renderFieldPanel(flashKeys = []) {
  const panel = $('#fieldPanel');
  const collected = Store.iState?.collected || {};
  const confidence = Store.iState?.confidence || {};
  const anyValue = FIELDS.some(f => collected[f.key]);
  panel.innerHTML = FIELDS.map(f => {
    const v = collected[f.key];
    const cls = 'field-row' + (v ? ' filled' : '') + (flashKeys.includes(f.key) ? ' flash' : '');
    return `<div class="${cls}" data-key="${f.key}">
      <span class="f-label">${f.label}</span>
      <span class="f-value" ${v && Backend.online && !Store.mockMode ? 'contenteditable="true" spellcheck="false"' : ''}>${v ? esc(v) : '<i>还没聊到</i>'}</span>
      ${v ? confDot(confidence[f.key] || 0) : ''}
    </div>`;
  }).join('');
  $('#quoteLine').hidden = !Store.bestQuote;
  if (Store.bestQuote) $('#quoteLine').textContent = `你说过：“${Store.bestQuote}”`;
  if (!anyValue && Store.mockMode) {
    panel.innerHTML = '<p class="note-empty">模拟模式下，字段不会被真实抽取。<br>启动后端并配置 Key 后，这里会逐步长出 AI 听到的你。</p>';
  }
  if (anyValue && !$('#fieldDetails').open) $('#fieldDetails').open = false;
  drawRoad();
  persist();
}
$('#fieldPanel').addEventListener('blur', e => {
  const row = e.target.closest('.field-row'); if (!row) return;
  if (!e.target.classList.contains('f-value')) return;
  const v = e.target.textContent.trim();
  if (v && Store.iState) {
    Store.iState.collected[row.dataset.key] = v;
    Store.iState.confidence[row.dataset.key] = 1;
    renderFieldPanel();
  }
}, true);

/* ═══════════ 八、访谈链路（/api/interview/*） ═══════════ */

async function enterInterview() {
  if (Store.messages.length) { renderChat(); renderFieldPanel(); return; }
  if (Backend.online && Backend.keyConfigured) {
    await startInterview();
  } else if (Backend.online) {
    pushMsg('ai', '后端已连接，但还没配 AI Key，对谈暂时开不了。你可以先在「后端连接设置」里用示例处境直接看决策地形，或配好 TOKENDANCE_API_KEY 再回来。');
    setStatus('对谈需要 TOKENDANCE_API_KEY（问队长要，或 tokendance.space/keys 自建）', true);
  } else {
    startMock();
  }
}
async function startInterview() {
  Store.mockMode = false;
  setStatus('正在准备第一个问题…');
  Store.busy = true;
  try {
    const r = await api('/interview/start', {});
    Store.iState = r.state;
    Store.askedField = r.asked_field;
    pushMsg('ai', r.message, { field: r.asked_field });
    clearStatus();
  } catch (e) {
    /* ⚠️ 如实说原因：网关 402（额度用尽）/ 超时 / 断网 —— 笼统的"连接失败"会让人查错方向。
       实测踩过：Key 额度耗尽时，界面只说"连接失败"，看起来像代码坏了。 */
    const why = /402|quota|balance|额度/i.test(e.message) ? `${e.message} —— 很可能是 AI 额度用完了，找负责人充值或换 Key` : e.message;
    setStatus(`对谈没能开始：${why}`, true, () => startInterview());
  } finally { Store.busy = false; persist(); }
}
async function sendAnswer(text, overrideState) {
  const base = overrideState || Store.iState;
  if (!base || !text.trim() || Store.busy) return;
  const snapshot = JSON.parse(JSON.stringify(base));
  pushMsg('user', text, { stateBefore: snapshot });
  Store.busy = true;
  setStatus('正在理解你说的…');
  showTyping();
  renderHints([]);
  try {
    const r = await api('/interview/answer', { state: base, answer: text, asked_field: Store.askedField });
    hideTyping();
    Store.iState = r.state;
    if (r.extracted?.memorable_quote) Store.bestQuote = r.extracted.memorable_quote;
    const flashKeys = (r.extracted?.updates || []).map(u => u.field);
    /* 记下每个字段来自哪句原话 —— 来路图节点点开要看的就是它 */
    for (const u of (r.extracted?.updates || [])) Store.fieldSources[u.field] = { text };
    renderFieldPanel(flashKeys);
    if (r.asked_field) Store.askedField = r.asked_field;
    if (r.message) pushMsg('ai', r.message, { field: r.asked_field });
    renderHints(r.hints);
    clearStatus();
    if (r.done) await doFinish(r.state);
  } catch (e) {
    hideTyping();
    const why = /402|quota|balance|额度/i.test(e.message) ? `${e.message}（AI 额度可能用完了）` : e.message;
    setStatus(`这条回答没递到：${why}。对谈记录还在。`, true, () => sendAnswer(text, base));
  } finally { Store.busy = false; persist(); }
}
async function doFinish(state) {
  renderHints([]);
  Store.phase = 'confirming';
  setStatus('信息够了，正在把你的处境讲回给你听…');
  try {
    const r = await api('/interview/finish', { state });
    Store.summary = r.summary;
    Store.noDilemma = !!r.no_dilemma;
    Store.iState = r.state;
    pushMsg('ai', r.summary, { field: 'summary' });
    clearStatus();
    fillSummaryPage();
    showPage('p3');
  } catch (e) {
    setStatus('总结失败。', true, () => doFinish(state));
  }
  Store.phase = 'done';
  persist();
}
async function rewindTo(messageId) {
  const idx = Store.messages.findIndex(m => m.id === messageId);
  if (idx < 0) return;
  const target = Store.messages[idx];
  if (target.role !== 'user' || !target.stateBefore) return;
  const back = JSON.parse(JSON.stringify(target.stateBefore));
  Store.iState = back;
  Store.summary = ''; Store.noDilemma = false; Store.landscape = null;
  Store.messages = Store.messages.slice(0, idx);
  let prevField = '';
  for (let i = Store.messages.length - 1; i >= 0; i--) {
    if (Store.messages[i].role === 'ai' && Store.messages[i].field) { prevField = Store.messages[i].field; break; }
  }
  Store.askedField = prevField === 'summary' ? '' : prevField;
  renderChat(); renderFieldPanel();
  const text = prompt('把这句改成：', target.text);
  if (text && text.trim()) await sendAnswer(text.trim(), back);
  persist();
}

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatText.value.trim();
  if (!text || Store.busy) return;
  chatText.value = ''; chatText.focus();
  renderHints([]);
  if (Store.mockMode) { mockChat(text); return; }
  if (!Store.iState) { setStatus('对谈还没开始。', true, () => enterInterview()); return; }
  sendAnswer(text);
});
$('#finishNowBtn').addEventListener('click', () => {
  if (Store.mockMode || !Store.iState) return;
  doFinish(Store.iState);
});
$('#restartBtn').addEventListener('click', () => {
  if (!confirm('重新开始会清空这次对谈和处境，确定吗？')) return;
  resetAll();
  if (Backend.online && Backend.keyConfigured) startInterview();
  else if (!Backend.online) startMock();
});
function resetAll() {
  Store.messages = []; Store.iState = null; Store.askedField = '';
  Store.summary = ''; Store.noDilemma = false; Store.bestQuote = '';
  Store.situation = null; Store.landscape = null; Store.currentCases = [];
  Store.mockMode = false; Store.busy = false; Store.phase = 'idle';
  Store.fieldSources = {};
  road.drawn.clear();
  sessionStorage.removeItem('echopath.ui.v2');
  renderHints([]);
  renderChat(); renderFieldPanel(); fillSummaryPage();
}

/* ── 模拟模式 ── */
const MOCK_FOLLOWUPS = [
  '这件事当时对你意味着什么？', '当时你身边有人可以商量吗？',
  '现在回看，你觉得那一刻改变了什么？', '如果把那段时间分成几个节点，你会怎么分？',
];
function startMock() {
  Store.mockMode = true;
  pushMsg('ai', '（离线模拟模式）你第一次认真怀疑现在这个方向，大概是什么时候？');
  renderFieldPanel();
}
async function mockChat(text) {
  setStatus('模拟回复中…');
  await wait(600);
  pushMsg('ai', MOCK_FOLLOWUPS[Store.messages.length % MOCK_FOLLOWUPS.length]);
  clearStatus();
}

/* ═══════════ 九、理解困境（P3） ═══════════ */

function fillSummaryPage() {
  const has = !!Store.summary;
  $('#summaryText').textContent = has ? Store.summary : '聊完「来时路」之后，这里会出现 AI 对你处境的理解。';
  $('#noDilemmaNote').hidden = !(has && Store.noDilemma);
  $('#confirmSummaryBtn').style.display = (has && !Store.noDilemma && Backend.online) ? '' : 'none';
  $('#correctOpenBtn').style.display = (has && Backend.online && Backend.keyConfigured) ? '' : 'none';
  $('#correctBox').hidden = true;
}
$('#correctOpenBtn').addEventListener('click', () => {
  $('#correctBox').hidden = !$('#correctBox').hidden;
  $('#correctText').focus();
});
$('#correctSend').addEventListener('click', async () => {
  const t = $('#correctText').value.trim();
  if (!t || !Store.iState) return;
  $('#correctText').value = '';
  $('#correctBox').hidden = true;
  showPage('p2');
  await sendAnswer(t);
});

function splitList(v) {
  return (v || '').split(/[，,、；;/]/).map(x => x.trim()).filter(x => x.length > 0 && x.length < 40);
}
function buildSituation() {
  const c = Store.iState?.collected || {};
  const options = splitList(c.dilemma);
  return {
    stage: c.stage || '未说明',
    options: options.length ? options : ['继续现在这条路', '换一条路'],
    root_factors: [],
    constraints: splitList(c.constraints),
    goals: splitList(c.goals),
    prior_path: c.prior_path,
    validation: c.validation,
    fear: c.fear,
    risk: 'medium',
    reversibility: (c.reversibility_attitude || '').includes('接受') ? 'high'
      : (c.reversibility_attitude || '').includes('不') ? 'low' : 'medium',
    unknowns: [],
  };
}
$('#confirmSummaryBtn').addEventListener('click', async () => {
  Store.situation = buildSituation();
  showPage('p4');          // 先切页：加载仪式在 P4，等完再切会让人觉得卡住
  await runLandscape();
});

/* ═══════════ 十、加载仪式 ═══════════
   等 AI 的几秒不该是白屏或转圈：让一条路径慢慢长出来，
   配一句与当前环节相关的话。*/

const VEIL_LINES = {
  landscape: ['正在检索与你来时路接近的人…', '正在按根因素把他们的走法聚类…', '正在按「你最怕的事」给代价排序…'],
  case: ['正在翻开这个人的人生…', '正在把「当时知道」和「后来发生」分开…', '正在核对证据的分层…'],
};
let veilTimer = 0;
function veilShow(kind) {
  const veil = $('#loadVeil');
  const lines = VEIL_LINES[kind] || VEIL_LINES.landscape;
  let i = 0;
  $('#veilText').textContent = lines[0];
  $('#veilSub').textContent = '好的回响值得等几秒';
  veil.hidden = false;
  clearInterval(veilTimer);
  veilTimer = setInterval(() => {
    i = (i + 1) % lines.length;
    $('#veilText').textContent = lines[i];
    if (i === lines.length - 1) $('#veilSub').textContent = '正在生长，马上就好';
  }, 1600);
}
function veilHide() { clearInterval(veilTimer); $('#loadVeil').hidden = true; }

/* ═══════════ 十一、决策地形（P4） ═══════════ */

const PRIVACY_LABEL = { public: '公开数据', deidentified: '脱敏数据', private: '私有数据' };
const MAX_PATHS = 4;

async function ensureSources() {
  if (Store.sources.length || !Backend.online) return;
  try {
    const r = await api('/sources');
    Store.sources = r.sources || [];
  } catch { Store.sources = []; }
}
async function runLandscape() {
  if (!Backend.online || !Store.situation) return;
  $('#terrainBlock').hidden = true;
  $('#profileBlock').hidden = true;
  $('#singlePathNote').hidden = true;
  veilShow('landscape');
  try {
    const r = await api('/landscape', {
      situation: Store.situation,
      user_quote: Store.bestQuote || undefined,
      source_id: Store.sourceId,
    });
    Store.landscape = r;
    renderLandscape();
  } catch (e) {
    $('#veilText').textContent = `生成失败：${e.message}`;
    $('#veilSub').textContent = '';
    setTimeout(veilHide, 2600);
    return;
  }
  veilHide();
  persist();
}
function renderSourceBar() {
  const bar = $('#sourceBar');
  if (!Backend.online || !Store.sources.length) { bar.hidden = true; return; }
  const ds = Store.landscape?.data_source;
  bar.hidden = false;
  bar.innerHTML = Store.sources.map(s =>
    `<button class="src-chip${(Store.sourceId ?? ds?.id ?? 'historical') === s.id ? ' on' : ''}" data-src="${esc(s.id)}">${esc(s.label)}</button>`
  ).join('') + (ds ? `<span class="src-note">${esc(ds.label)} · ${PRIVACY_LABEL[ds.privacy_level] || ds.privacy_level} · 基于 ${ds.episode_count} 条真实轨迹</span>` : '');
  $$('.src-chip', bar).forEach(b => b.addEventListener('click', async () => {
    if (b.dataset.src === (Store.sourceId ?? ds?.id)) return;
    Store.sourceId = b.dataset.src;
    if (!Store.situation) Store.situation = buildSituation();
    await runLandscape();
  }));
}
function renderProfile() {
  const block = $('#profileBlock');
  const ls = Store.landscape;
  if (!ls) { block.hidden = true; return; }
  block.hidden = false;
  $('#mechanismReading').textContent = ls.profile.mechanism_reading || '';
  $('#factorTags').innerHTML = (ls.profile.root_factors || []).map(f => `<span class="factor-tag">${esc(f)}</span>`).join('') || '<i class="dim">未能抽象出根因素</i>';
  const editableList = (items, key) => (items || []).map((x, i) =>
    `<span class="edit-item">${esc(x)}<button class="edit-del" data-key="${key}" data-i="${i}" title="删掉这条">×</button></span>`
  ).join('') || '<i class="dim">无</i>';
  $('#constraintList').innerHTML = editableList(ls.profile.constraints, 'constraints');
  $('#goalList').innerHTML = editableList(ls.profile.goals, 'goals');
  $('#regenBtn').hidden = false;
  $$('.edit-del', block).forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.key;
    Store.situation[key].splice(Number(b.dataset.i), 1);
    runLandscape();
  }));
}
$('#regenBtn').addEventListener('click', () => runLandscape());

/* 资料更新后的过期检测：数据源条数变了，就提醒重新生成（不拿旧地形冒充新分析） */
async function checkFreshness() {
  const bar = $('#staleBar');
  if (!bar) return;
  if (!Backend.online || !Store.landscape?.data_source) { bar.hidden = true; return; }
  try {
    const r = await api('/sources');
    const cur = Store.landscape.data_source;
    const fresh = (r.sources || []).find(s => s.id === cur.id);
    if (fresh && cur.episode_count !== undefined && fresh.episode_count !== undefined
        && fresh.episode_count !== cur.episode_count) {
      $('#staleInfo').textContent = `「${cur.label}」生成地形时是 ${cur.episode_count} 条，现在 ${fresh.episode_count} 条`;
      bar.hidden = false;
      return;
    }
    bar.hidden = true;
  } catch { bar.hidden = true; }
}
$('#staleRefresh')?.addEventListener('click', () => {
  $('#staleBar').hidden = true;
  runLandscape();
});

function costBasisHTML(basis) {
  if (!basis) return '';
  if (basis.kind === 'user_quote' && basis.quote)
    return `<span class="basis basis-quote">因为你说过：“${esc(basis.quote)}”</span>`;
  if (basis.kind === 'era') return '<span class="basis basis-era">时代差异 · AI 类比</span>';
  if (basis.kind === 'unknown') return '<span class="basis basis-unknown">证据不足</span>';
  return '<span class="basis">结构对比</span>';
}

/* ── 知识网络：地图是主角；悬停预览，点击固定选中看详情 ── */
const SHORT_LABEL = {
  persist: '守住已有', explore_then_persist: '先试再定', explore_then_switch: '先试再转',
  direct_switch: '直接换道', dual_track: '双轨并行', abandon: '止损退出', unknown: '另一种走法',
};
const net = { nodes: [], links: [], raf: 0, pointer: null, drag: null, downAt: null, active: false, selected: null, paths: [] };

function netBuild(paths) {
  const W = 860, H = 480;
  net.paths = paths;
  const now = { id: 'NOW', kind: 'now', label: 'NOW · 你', x: 90, y: H / 2, ax: 90, ay: H / 2, vx: 0, vy: 0, r: 9 };
  net.nodes = [now];
  net.links = [];
  const n = paths.length;
  paths.forEach((p, i) => {
    const py = n === 1 ? H / 2 : 80 + i * ((H - 160) / (n - 1));
    const pn = {
      id: `path-${i}`, kind: 'path', pathIndex: i,
      label: SHORT_LABEL[p.id] || p.title, sub: p.title,
      x: 380, y: py, ax: 380, ay: py, vx: 0, vy: 0, r: 7,
    };
    net.nodes.push(pn);
    net.links.push({ a: now, b: pn, pi: i });
    const cases = (p.supporting_cases || []).slice(0, 4);
    cases.forEach((c, j) => {
      const ang = (j - (cases.length - 1) / 2) * 0.5;
      const cn = {
        id: `case-${i}-${j}`, kind: 'case', pathIndex: i, caseInfo: { ...c, pathTitle: p.title },
        label: c.display_name, sub: String(c.year),
        x: 640, y: py + ang * 130, ax: 640 + Math.sin(ang) * 40, ay: py + ang * 130,
        vx: 0, vy: 0, r: 4.5,
      };
      net.nodes.push(cn);
      net.links.push({ a: pn, b: cn, pi: i });
    });
  });
}
function netStep() {
  const K_ANCHOR = 0.012, K_REPEL = 900, DAMP = 0.86;
  for (const a of net.nodes) {
    a.vx += (a.ax - a.x) * K_ANCHOR;
    a.vy += (a.ay - a.y) * K_ANCHOR;
    for (const b of net.nodes) {
      if (a === b) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx * dx + dy * dy || 1;
      if (d2 < 160 * 160) {
        const f = K_REPEL / d2;
        a.vx += dx * f * 0.01; a.vy += dy * f * 0.01;
      }
    }
    /* ⚠️ 节点不再躲避指针 —— 避让让「点中一个小节点」变成追着跑，实测是负资产。
       物理只保留锚点弹簧 + 节点间斥力：布局稳定后静止，点击可预期。 */
    if (net.drag === a && net.pointer) { a.vx = 0; a.vy = 0; a.x = net.pointer.x; a.y = net.pointer.y; }
    a.vx *= DAMP; a.vy *= DAMP;
    a.x += a.vx; a.y += a.vy;
    a.x = Math.max(20, Math.min(840, a.x));
    a.y = Math.max(20, Math.min(460, a.y));
  }
}
function netDraw() {
  const svg = $('#terrainNet');
  if (!svg || !net.nodes.length) return;
  const curved = (a, b) => {
    const mx = (a.x + b.x) / 2;
    return `M${a.x},${a.y} Q${mx},${a.y} ${b.x},${b.y}`;
  };
  const sel = net.selected;
  const selNodeId = sel ? sel.id : '';
  const selPi = sel ? sel.pathIndex : -1;
  svg.innerHTML =
    net.links.map((l) => {
      const { a, b, pi } = l;
      /* 两层线：可见细线 + 透明加粗的点击层（细线太难点中） */
      const hi = selPi === pi ? ' hi' : '';
      return `<path class="net-hit" data-pi="${pi}" d="${curved(a, b)}"/>` +
             `<path class="net-link${hi}" d="${curved(a, b)}"/>`;
    }).join('') +
    net.nodes.map(nd => `
      <g class="net-node ${nd.kind}${nd.id === selNodeId ? ' sel' : ''}" data-id="${nd.id}" transform="translate(${nd.x},${nd.y})"
         tabindex="0" role="button" aria-label="${esc(nd.label)}${nd.sub ? '：' + esc(nd.sub) : ''}">
        <circle class="hit-area" r="${Math.max(nd.r + 9, 15)}"/>
        <circle class="dot" r="${nd.r}"/>
        <text y="${-nd.r - 8}" text-anchor="middle">${esc(nd.label)}</text>
        ${nd.sub && nd.kind !== 'case' ? `<text class="net-sub" y="${nd.r + 16}" text-anchor="middle">${esc(nd.sub)}</text>` : ''}
      </g>`).join('');
}
function netLoop() {
  if (!net.active) return;
  netStep(); netDraw();
  net.raf = requestAnimationFrame(netLoop);
}
function netStop() { net.active = false; if (net.raf) cancelAnimationFrame(net.raf); net.raf = 0; }
function netStart() { if (net.active || REDUCED) { if (REDUCED) netDraw(); return; } net.active = true; netLoop(); }

/* ── 选中与详情面板（一次只展示当前选中对象；面板是覆盖层，地图不缩放不跳动） ── */
function netClearSelection() {
  net.selected = null;
  const d = $('#netDetail');
  if (d) d.hidden = true;
  netDraw();
}
function pathDetailHTML(p, i) {
  const cs = (p.costs || []).slice(0, 3).map(c =>
    `<p class="nd-cost"><b>可能的代价</b>：${esc(c.text)}<br>${costBasisHTML(c.basis)}</p>`).join('');
  /* 这条分支为什么会出现 —— 把「你的回答 → 根因素 → 聚类」的链条摊开，不让它显得凭空冒出来 */
  const meta = Store.landscape?.meta ?? {};
  const factors = (Store.landscape?.profile?.root_factors ?? []).join('、');
  const n = (p.supporting_cases || []).length;
  const why = `这是别人实际走过的路，不是你的选项。`
    + `匹配到 ${meta.persons_recalled ?? '若干'} 位和你根因素相近的人，其中 ${n} 位走了这条`
    + `${meta.clustering ? `（按根因素相似度 ≥ ${meta.clustering.threshold} 聚类）` : ''}。`
    + (factors ? `共同的结构：${factors}。` : '');
  return `
    <button class="net-detail-close" id="netDetailClose" aria-label="关闭详情">×</button>
    <p class="nd-kind">这条走法</p>
    <h4 class="serif">${esc(p.title)}</h4>
    <p class="nd-line">${esc(p.one_line || '')}</p>
    <p class="nd-why">${esc(why)}</p>
    ${(p.protects || []).length ? `<p class="nd-sub"><b>保护了什么</b></p><ul class="plain-list">${p.protects.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${cs}
    ${p.caveat ? `<p class="caveat">⚠ ${esc(p.caveat)}</p>` : ''}
    <button class="link-btn" id="netGoCases">${n} 个真实案例走过这条路 →</button>`;
}
function caseDetailHTML(nd) {
  const c = nd.caseInfo;
  return `
    <button class="net-detail-close" id="netDetailClose" aria-label="关闭详情">×</button>
    <p class="nd-kind">真实走过的人</p>
    <h4 class="serif">${esc(c.display_name)}</h4>
    <p class="nd-line">${c.year} · ${esc(c.outcome_hint || '')}</p>
    <p class="nd-rel">他走的正是「${esc(c.pathTitle)}」这条 —— 和你此刻的处境是同一类结构。</p>
    <button class="link-btn" id="netGoCase">读他的人生 →</button>`;
}
function showNetDetail(html) {
  const el = $('#netDetail');
  el.innerHTML = html;
  el.hidden = false;
  $('#netDetailClose')?.addEventListener('click', netClearSelection);
  $('#netGoCases')?.addEventListener('click', () => {
    const sel = net.selected; if (!sel) return;
    const p = net.paths[sel.pathIndex]; if (!p) return;
    Store.currentCases = (p.supporting_cases || []).map(c => ({ ...c, pathTitle: p.title }));
    persist();
    showPage('p5');
  });
  $('#netGoCase')?.addEventListener('click', () => {
    const sel = net.selected; if (!sel || sel.type !== 'case') return;
    const nd = net.nodes.find(n => n.id === sel.id); if (!nd) return;
    const p = net.paths[nd.pathIndex];
    Store.currentCases = ((p?.supporting_cases) || [nd.caseInfo]).map(c => ({ ...c, pathTitle: p?.title ?? nd.caseInfo.pathTitle }));
    persist();
    showPage('p5');
    const i = Store.currentCases.findIndex(c => c.episode_id === nd.caseInfo.episode_id);
    if (i > -1) loadCase(i);
  });
}
function netSelectPath(i) {
  const p = net.paths[i];
  if (!p) return;
  net.selected = { type: 'path', id: `path-${i}`, pathIndex: i };
  showNetDetail(pathDetailHTML(p, i));
  netDraw();
}
function netSelectCase(nd) {
  net.selected = { type: 'case', id: nd.id, pathIndex: nd.pathIndex };
  showNetDetail(caseDetailHTML(nd));
  netDraw();
}

(function netEvents() {
  const svg = $('#terrainNet');
  const tip = $('#netTip');
  const wrap = svg.closest('.net-stage');
  const toLocal = e => {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * 860, y: (e.clientY - r.top) / r.height * 480 };
  };
  const placeTip = e => {
    const r = wrap.getBoundingClientRect();
    tip.style.left = `${e.clientX - r.left}px`;
    tip.style.top = `${e.clientY - r.top}px`;
  };
  /* 悬停预览延迟隐藏：从节点移到提示框上时不消失 */
  let tipTimer = 0;
  const scheduleHideTip = () => { clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.hidden = true; }, 240); };
  tip.addEventListener('pointerenter', () => clearTimeout(tipTimer));
  tip.addEventListener('pointerleave', () => scheduleHideTip());

  svg.addEventListener('pointermove', e => {
    net.pointer = toLocal(e);
    if (!tip.hidden) placeTip(e);
  });
  svg.addEventListener('pointerleave', () => { net.pointer = null; scheduleHideTip(); });

  /* ⚠️ 点击目标必须在 pointerdown 时记录：
     setPointerCapture 会把后续事件重定向到 svg 本身，
     pointerup 时 e.target 已经不是那个节点了（实测：点节点反而清空选中）。 */
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('.net-node');
    const nd = g ? net.nodes.find(x => x.id === g.dataset.id) : null;
    const hitLink = e.target.closest('.net-hit');
    net.downAt = toLocal(e);
    net.downTarget = nd ?? (hitLink ? { link: Number(hitLink.dataset.pi) } : null);
    if (nd) { net.drag = nd; net.pointer = net.downAt; svg.setPointerCapture(e.pointerId); }
  });
  svg.addEventListener('pointerup', e => {
    const down = net.downAt, target = net.downTarget;
    const wasDrag = net.drag;
    net.drag = null; net.downAt = null; net.downTarget = null;
    /* 位移区分点击与拖拽（不能看速度：拖拽中每帧速度都被清零） */
    const moved = down ? Math.hypot(toLocal(e).x - down.x, toLocal(e).y - down.y) : 99;
    if (moved >= 6) return;
    if (target && target.kind) {                    // 点中节点 → 固定选中
      if (target.kind === 'path') netSelectPath(target.pathIndex);
      else if (target.kind === 'case') netSelectCase(target);
      return;
    }
    if (target && target.link !== undefined) { netSelectPath(target.link); return; }  // 点连线 = 选这条走法
    if (!wasDrag) netClearSelection();              // 点空白退出选中
  });

  svg.addEventListener('pointerover', e => {
    const g = e.target.closest('.net-node');
    if (!g) { scheduleHideTip(); return; }
    clearTimeout(tipTimer);
    const nd = net.nodes.find(x => x.id === g.dataset.id);
    if (!nd) return;
    tip.textContent = nd.kind === 'case'
      ? `${nd.caseInfo.display_name} · ${nd.caseInfo.year} — ${nd.caseInfo.outcome_hint || ''}（点一下选中）`
      : nd.kind === 'path' ? `${nd.sub}（点一下选中看详情）` : '这是你此刻站的位置';
    placeTip(e);
    tip.hidden = false;
  });

  /* 键盘可达：Tab 聚焦节点，Enter / 空格选中 */
  svg.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest('.net-node');
    if (!g) return;
    e.preventDefault();
    const nd = net.nodes.find(x => x.id === g.dataset.id);
    if (!nd) return;
    if (nd.kind === 'path') netSelectPath(nd.pathIndex);
    else if (nd.kind === 'case') netSelectCase(nd);
  });

  /* 地图被横向滚动过 → 出现「恢复全图」 */
  const scroller = $('#netScroll');
  scroller?.addEventListener('scroll', () => {
    $('#netReset').hidden = !(scroller.scrollLeft > 8 || scroller.scrollTop > 8);
  }, { passive: true });
  $('#netReset')?.addEventListener('click', () => scroller.scrollTo({ left: 0, top: 0, behavior: 'smooth' }));
})();

function renderLandscape() {
  renderSourceBar();
  renderProfile();
  const ls = Store.landscape;
  const terrain = $('#terrainBlock');
  const note = $('#singlePathNote');
  if (!ls) {
    terrain.hidden = true;
    if (!$('#loadVeil').hidden) return;
    note.hidden = false;
    note.textContent = Backend.online
      ? '还没有你的处境 —— 先去「来时路」聊一聊，或在「后端连接设置」里用示例处境直接看。'
      : '离线模拟模式：决策地形需要后端支持（npm run server）。';
    return;
  }
  const paths = (ls.archetypes || []).slice(0, MAX_PATHS);
  note.hidden = !ls.single_path_only;
  if (ls.single_path_only)
    note.textContent = '候选中只找到这一种走法 —— 我们如实告诉你，而不是硬凑出别的路。';

  /* 地图是主角：不再平铺所有路径的长文 —— 详情等选中后再给 */
  terrain.hidden = false;
  net.selected = null;
  const d = $('#netDetail'); if (d) { d.hidden = true; d.innerHTML = ''; }
  const rst = $('#netReset'); if (rst) rst.hidden = true;
  netStop();
  netBuild(paths);
  netDraw();
  netStart();
}

/* ═══════════ 十二、真实案例（P5：沉浸式深阅读） ═══════════ */

function renderCaseList() {
  const list = $('#caseList');
  const back = $('#backToTerrain');
  back.hidden = !Store.currentCases.length;
  if (!Store.currentCases.length) {
    list.innerHTML = `<p class="kicker">05 · 真实案例</p><p class="case-empty">从「决策地形」里选一条路，<br>这里会列出走过它的真实人生。</p>`;
    return;
  }
  list.innerHTML = `<p class="kicker">05 · ${esc(Store.currentCases[0].pathTitle || '真实案例')}</p>` +
    (() => {
      const factors = (Store.landscape?.profile?.root_factors || []).slice(0, 3).join('、');
      return factors
        ? `<p class="case-why">为什么是这些人：他们和你共享相近的处境结构（你的根因素：${esc(factors)}）。点开每个人，看「哪里与你有关」。</p>`
        : '';
    })() +
    Store.currentCases.map((c, i) => {
      const mine = new Set(Store.landscape?.profile?.root_factors || []);
      const shared = (c.root_factors || []).filter(f => mine.has(f));
      return `<button class="case-item" data-case="${i}">
        <span class="case-name serif">${esc(c.display_name)}</span>
        <span class="case-year">${c.year}</span>
        <span class="case-hint">${esc(c.outcome_hint || '')}</span>
        ${shared.length ? `<span class="case-shared">与你的共同因素：${shared.map(esc).join('、')}</span>` : ''}
      </button>`;
    }).join('');
  $$('.case-item', list).forEach(b => b.addEventListener('click', () => loadCase(Number(b.dataset.case))));
}
$('#backToTerrain').addEventListener('click', () => showPage('p4'));

const EVIDENCE_LABEL = {
  facts: '史实', self_claims: '本人表述', interpretations: '后人解释',
  ai_inferences: 'AI 推断', unknowns: '未知 / 有争议',
};
const KIND_LABEL = { structure: '结构差异', evidence: '证据差异', era: 'AI 类比 · 时代差异', unknown: '未知' };

/* 案例头图：用这个案例自己的数据生成「回响」图形 —— 不是插画，是这段人生的形状 */
function caseHero(ep) {
  let seedNum = 0;
  for (const ch of ep.episode_id) seedNum = (seedNum * 31 + ch.charCodeAt(0)) % 9973;
  const rand = () => (seedNum = (seedNum * 73 + 41) % 9973) / 9973;
  const steps = Math.max(ep.prior_path?.length || 1, 1);
  const W = 720, H = 190, baseY = 120;
  let h = `<path class="hero-road" d="M30,${baseY} C${W * .3},${baseY - 40 * rand()} ${W * .6},${baseY + 30 * rand()} ${W - 40},${baseY - 30}"/>`;
  for (let i = 0; i <= steps; i++) {
    const x = 60 + i * ((W - 160) / steps);
    const y = baseY - 25 * Math.sin(i / steps * Math.PI) + (rand() - .5) * 18;
    const isDecision = i === steps;
    h += `<circle class="${isDecision ? 'hero-now' : 'hero-dot'}" cx="${x}" cy="${y}" r="${isDecision ? 6 : 3.5}"/>`;
  }
  /* 决策点之后荡开两圈回声：后来发生的一切，他当时都不知道 */
  const dx = W - 40, dy = baseY - 30;
  h += `<circle class="hero-ring" cx="${dx}" cy="${dy}" r="16"/><circle class="hero-ring r2" cx="${dx}" cy="${dy}" r="30"/>`;
  return `<svg class="case-hero" viewBox="0 0 ${W} ${H}" aria-hidden="true">${h}</svg>`;
}

/* 阅读进度条 */
addEventListener('scroll', () => {
  const bar = $('#readProgress');
  if (!$('#p5').classList.contains('is-active')) { bar.style.width = '0'; return; }
  const h = document.documentElement;
  const pct = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1);
  bar.style.width = `${Math.round(pct * 100)}%`;
}, { passive: true });

/* 章节渐次浮现 */
let revealObserver = null;
function observeReveal(root) {
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $$('.reveal', root).forEach(el => revealObserver.observe(el));
}

async function loadCase(i) {
  const c = Store.currentCases[i];
  if (!c || !Backend.online) return;
  $$('.case-item').forEach((b, j) => b.classList.toggle('on', j === i));
  const story = $('#caseStory');
  story.innerHTML = `<div class="case-loading">
    <svg viewBox="0 0 320 120" class="veil-svg" aria-hidden="true">
      <path d="M20,84 C90,84 120,40 180,52 S280,36 300,30" fill="none"/>
      <circle class="veil-dot" r="4"><animateMotion dur="2.4s" repeatCount="indefinite" path="M20,84 C90,84 120,40 180,52 S280,36 300,30"/></circle>
    </svg><p class="veil-text serif">正在翻开这个人的人生…</p></div>`;
  const s = Store.situation || {};
  try {
    const d = await api('/case', {
      episode_id: c.episode_id,
      source_id: Store.sourceId,
      stage: s.stage, options: s.options, constraints: s.constraints,
      goals: s.goals, risk: s.risk, reversibility: s.reversibility,
    });
    renderCase(d);
  } catch (e) {
    story.innerHTML = `<p class="kicker">案例加载失败</p><p>${esc(e.message)}</p>`;
  }
}

function renderCase(d) {
  const ep = d.episode;
  const tb = d.temporal_boundary;
  const layers = d.evidence_layers || {};
  const first = (ep.person.name || '？')[0];
  const listIf = (arr, cls = '') => (arr && arr.length)
    ? `<ul class="plain-list ${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
    : '<p class="dim">（没有记录）</p>';

  $('#caseStory').innerHTML = `
    ${caseHero(ep)}
    <p class="kicker">${esc(d.data_source?.label || '真实案例')} · ${PRIVACY_LABEL[d.data_source?.privacy_level] || ''}</p>
    <h2 class="serif reveal">${esc(ep.decision_state.dilemma || `${ep.person.name}的路口`)}</h2>
    <div class="portrait" aria-hidden="true">${esc(first)}</div>
    <p class="case-lead reveal">${esc(ep.person.name)}，${esc(ep.time.stage || '')}，${ep.time.year}${ep.time.age ? `，${ep.time.age} 岁` : ''}。</p>

    <div class="reveal">
      <h4>他怎么走到这个路口的</h4>
      ${listIf(ep.prior_path)}
    </div>

    <div class="year serif reveal">${ep.time.year}</div>

    <div class="temporal reveal">
      <div class="t-col">
        <h5>他当时已经知道什么</h5>
        ${listIf(tb.known_at_time)}
        <h5>他面对的选择</h5>
        ${listIf(ep.decision_state.options)}
      </div>
      <div class="t-col after">
        <h5>后来发生了什么（他当时不知道）</h5>
        <p><b>短期</b>：${esc(ep.outcomes.short_term || '')}</p>
        <p><b>中期</b>：${esc(ep.outcomes.mid_term || '')}</p>
        <p><b>长期</b>：${esc(ep.outcomes.long_term || '')}</p>
      </div>
    </div>
    <p class="tb-note serif reveal">${esc(tb.note || '')}</p>

    <div class="reveal">
      <h4>他做了什么</h4>
      ${listIf(ep.choice.actions)}
      ${ep.reflection?.self_comment ? `<blockquote class="serif">“${esc(ep.reflection.self_comment)}”</blockquote>` : ''}
    </div>

    <div class="reveal">
      <h4>哪里与你有关</h4>
      ${(() => {
        const mine = Store.landscape?.profile?.root_factors || [];
        const hf = d.episode.mechanism?.root_factors || [];
        const shared = hf.filter(f => mine.includes(f));
        const meta = Store.currentCases.find(x => x.episode_id === ep.episode_id);
        const lines = [];
        if (meta?.pathTitle)
          lines.push(`<p class="rel-line"><b>为什么给你看他</b>：他和你落在同一簇「${esc(meta.pathTitle)}」里——他当时实际就是这么做的${d.episode.mechanism?.archetype ? `（走法档案：${esc(SHORT_LABEL[d.episode.mechanism.archetype] || d.episode.mechanism.archetype)}）` : ''}。</p>`);
        lines.push(shared.length
          ? `<p class="rel-line"><b>你们共同卡在这些结构上</b>：${shared.map(esc).join('、')}<br><span class="dim">他的因素标注：${hf.map(esc).join('、')}｜你的：${mine.slice(0, 4).map(esc).join('、')}${mine.length > 4 ? '…' : ''}</span></p>`
          : (hf.length
            ? `<p class="rel-line">他的因素标注是「${hf.map(esc).join('、')}」，和你直接重叠的不多——他是按<b>同一条走法</b>分进来的，不是按"人像不像"。</p>`
            : '<p class="rel-line">这条案例目前还没有因素标注（数据工程未打标）。</p>'));
        if (d.episode.mechanism?.mechanism_short)
          lines.push(`<p class="rel-line">数据里给他的一句话概括：${esc(d.episode.mechanism.mechanism_short)}</p>`);
        lines.push(`<p class="rel-line">他当时站在「${esc(ep.time.stage || '他的阶段')}」，你现在是「${esc(Store.situation?.stage || Store.iState?.collected?.stage || '未说明')}」。</p>`);
        lines.push(`<p class="rel-line dim">因素为离线标注（${esc(d.episode.mechanism?.tagged_by || '—')}）；相似指处境结构，不代表他这个人和你像。</p>`);
        return lines.join('\n');
      })()}
    </div>

    <div class="reveal">
      <h4>哪里不能直接照搬</h4>
      <ul class="plain-list why-diff">
        ${(d.why_different || []).map(w => `<li class="kind-${esc(w.kind)}"><span class="kind-badge">${KIND_LABEL[w.kind] || w.kind}</span>${esc(w.text)}</li>`).join('') || '<li>（没有显著差异提示）</li>'}
      </ul>
    </div>

    <div class="reveal">
      <h4>可以借鉴什么</h4>
      <div class="borrow-mock">
        <span class="mock-badge">待后端字段</span>
        <p>这一栏等后端返回「可借鉴点」（从案例行动里提炼、且不与你的约束冲突的条目）。
        字段就绪前，这里不放任何编出来的内容 —— 空白比编造诚实。</p>
      </div>
    </div>

    <div class="reveal">
      <h4>还有什么不知道</h4>
      ${listIf(layers.unknowns, 'dim-list')}
      ${listIf(ep.reflection?.unknowns, 'dim-list')}
    </div>

    <div class="reveal">
      <h4>这个结论有多少依据</h4>
      <div class="layers">
        ${Object.entries(EVIDENCE_LABEL).map(([k, label]) => {
          const items = layers[k] || [];
          if (!items.length) return '';
          return `<div class="layer layer-${k}"><span class="layer-name">${label}${k === 'ai_inferences' ? ' ⚠' : ''}</span>${listIf(items)}</div>`;
        }).join('')}
      </div>
    </div>

    <div class="reveal">
      <h4>来源</h4>
      <ul class="plain-list sources">
        ${(d.evidence_detail || []).map(e => `<li>
          <span class="src-type">${esc(e.type)}</span>${esc(e.claim)}
          ${e.meta ? `<span class="src-meta"> —— ${esc(e.meta.title || e.source_id)}${e.meta.publisher ? ` · ${esc(e.meta.publisher)}` : ''}${e.meta.locator ? ` · ${esc(e.meta.locator)}` : ''}${e.meta.limitations ? ` · <i>局限：${esc(e.meta.limitations)}</i>` : ''}</span>` : ''}
          ${e.url ? ` <a href="${esc(e.url)}" target="_blank" rel="noopener">↗</a>` : ''}
        </li>`).join('') || '<li>（没有来源记录）</li>'}
      </ul>
    </div>
    <div class="story-actions">
      <button class="link-btn" id="storyBack">← 回到决策地形</button>
      <button class="link-btn" data-goto="p6">看完这个人的一生，回到自己 →</button>
    </div>`;
  $('#storyBack').addEventListener('click', () => showPage('p4'));
  $$('#caseStory [data-goto]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.goto)));
  observeReveal($('#caseStory'));
  scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════ 十三、回到自己（P6：逐步形成的个人行动记录） ═══════════
   回看 → 取舍 → 未知 → 行动记录。
   ⚠️ 不替用户作人生决定：行动记录只是一次小范围、可撤回的验证。 */

function chipFlow(container, items, { single = false, onPick = null } = {}) {
  container.innerHTML = items.map(t => `<button class="chip">${esc(t)}</button>`).join('');
  $$('.chip', container).forEach(ch => ch.addEventListener('click', () => {
    if (single) {
      const wasOn = ch.classList.contains('on');
      $$('.chip', container).forEach(x => x.classList.remove('on'));
      if (!wasOn) ch.classList.add('on');
    } else {
      ch.classList.toggle('on');
    }
    onPick?.(ch.classList.contains('on') ? ch.textContent : '');
  }));
}
const pickedChips = sel => $$(sel).map(c => c.textContent);

function renderSelfPage() {
  const ls = Store.landscape;
  const c = Store.iState?.collected || {};
  const recap = $('#meRecapText');
  const hasContext = !!(Store.summary || Object.keys(c).length);

  /* ① 回看：真实对话/地形里来的总结；没有上下文就给入口，不编造 */
  if (Store.summary) {
    const first = Store.summary.split(/(?<=。|！|？)/)[0] || Store.summary;
    recap.innerHTML = `刚才你聊到：<b>${esc(first)}</b>${Store.summary.length > first.length ? '…' : ''}`
      + ` 这份行动记录就从你自己的这些话里长出来。`;
  } else if (hasContext) {
    const bits = Object.values(c).filter(Boolean).slice(0, 2).join('；');
    recap.innerHTML = `你已经留下了一些来路：<b>${esc(bits)}</b>。先把「来时路」聊到出总结，这份记录会更完整。`;
  } else {
    recap.innerHTML = `这里还没有你的上下文 —— 先去<a href="javascript:void 0" class="me-goto" data-goto="p2">「来时路」聊一聊</a>，这份记录才真正属于你。`;
  }
  $$('.me-goto', recap).forEach(b => b.addEventListener('click', () => showPage(b.dataset.goto)));

  /* ② 取舍：来自真实地形的 protects / costs，不够就用通用兜底 */
  const protects = [...new Set((ls?.archetypes || []).flatMap(a => a.protects || []))].filter(t => t.length <= 24).slice(0, 5);
  const costs = [...new Set((ls?.archetypes || []).flatMap(a => (a.costs || []).map(x => x.text)))].filter(t => t.length <= 28).slice(0, 5);
  chipFlow($('#keepChips'), protects.length ? protects : ['已有的积累', '内心的笃定', '身边人的信任', '可支配的时间']);
  chipFlow($('#costChips'), costs.length ? costs : ['再次选错', '收入不稳定', '他人的眼光', '把兴趣变成压力']);

  /* ③ 未知：单选；选中后才生成行动记录 */
  const unknowns = (Store.situation?.unknowns || []).slice(0, 4);
  chipFlow($('#unknownChips'), unknowns.length ? unknowns : ['我是否真的喜欢新方向', '新方向的真实日常', '换道后的收入曲线'], {
    single: true,
    onPick: (text) => { if (text) buildMeCard(text); $('#meAct').hidden = !text; },
  });

  $('#meTrade').hidden = false;
  $('#meUnknown').hidden = false;
  $('#meAct').hidden = true;
  renderSavedList();
}

/* 自定义补充（取舍区的自由输入） */
$('#meAddText').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const t = e.target.value.trim();
  if (!t) return;
  e.target.value = '';
  const b = document.createElement('button');
  b.className = 'chip on'; b.type = 'button'; b.textContent = t;
  b.addEventListener('click', () => b.classList.toggle('on'));
  $('#costChips').appendChild(b);
});

/* ④ 行动记录：本地模板生成初稿，五行全部可编辑 */
function buildMeCard(unknown) {
  const cost = pickedChips('#costChips .chip.on')[0] || '最担心的代价';
  $('#meVerify').textContent = unknown;
  $('#meDo').textContent = `用两周业余时间，就「${unknown}」找一位正在走这条路的人聊一次，或完整做完一件最小的事`;
  $('#meTime').textContent = '两周 · 每周约 3 小时';
  $('#meSignal').textContent = `做过之后，「${cost}」这件事有没有变得更具体、没那么模糊；以及我还想不想继续`;
  $('#meWhen').textContent = '两周后的周日晚上，回到「来时路」把结果告诉 AI';
  const card = $('#meCard');
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}

/* 保存与恢复（localStorage） */
function readSaved() {
  try { return JSON.parse(localStorage.getItem('echopath.crossroads') || '[]'); } catch { return []; }
}
function renderSavedList() {
  const all = readSaved();
  const wrap = $('#meSavedWrap'), list = $('#savedList');
  wrap.hidden = !all.length;
  list.innerHTML = [...all].reverse().map(s => `
    <div class="saved-item">
      <span class="s-time">${new Date(s.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      <p class="s-verify serif">想验证：${esc(s.verify ?? s.chosen_unknowns?.[0] ?? '（早期记录）')}</p>
      <p class="s-meta">${esc(s.do ?? '')}${s.time ? ' · ' + esc(s.time) : ''}</p>
    </div>`).join('');
}
$('#saveCrossroadBtn').addEventListener('click', () => {
  const all = readSaved();
  all.push({
    at: new Date().toISOString(),
    verify: $('#meVerify').textContent.trim(),
    do: $('#meDo').textContent.trim(),
    time: $('#meTime').textContent.trim(),
    signal: $('#meSignal').textContent.trim(),
    when: $('#meWhen').textContent.trim(),
    keep: pickedChips('#keepChips .chip.on'),
    costs: pickedChips('#costChips .chip.on'),
    summary: Store.summary || '',
  });
  try {
    localStorage.setItem('echopath.crossroads', JSON.stringify(all));
    renderSavedList();
    const btn = $('#saveCrossroadBtn');
    btn.textContent = `已保存 · 共 ${all.length} 条（刷新不丢）`;
    setTimeout(() => { btn.textContent = '保存这次路口'; }, 2600);
  } catch { /* 忽略 */ }
});

/* ═══════════ 十四、后端连接设置窗口 ═══════════ */

const apiDialog = $('#apiDialog'), apiStatus = $('#apiStatus');
function setApiStatus(text, cls) { apiStatus.textContent = text; apiStatus.className = 'api-status' + (cls ? ' ' + cls : ''); }

$('#apiOpen').addEventListener('click', () => {
  $('#apiBase').value = savedBase() || Backend.base || 'http://localhost:3000/api';
  setApiStatus(Backend.online
    ? `当前：${Backend.base}（${Backend.keyConfigured ? 'AI Key 已配置' : '未配置 AI Key，对谈不可用'}）`
    : '当前未连接到后端。', Backend.online ? 'ok' : 'err');
  apiDialog.showModal();
});
$('#apiTest').addEventListener('click', async () => {
  const base = $('#apiBase').value.trim().replace(/\/$/, '');
  if (!base) { setApiStatus('先填地址。', 'err'); return; }
  setApiStatus('正在连接…');
  const h = await tryHealth(base);
  setApiStatus(h?.ok ? `连接成功（AI Key ${h.key_configured ? '已配置' : '未配置'}）` : '连不上 —— 后端起了吗？（在 xuejun-hackathon 里 npm run server）', h?.ok ? 'ok' : 'err');
});
$('#apiSave').addEventListener('click', async () => {
  const base = $('#apiBase').value.trim().replace(/\/$/, '');
  if (!base) { setApiStatus('先填地址。', 'err'); return; }
  try { localStorage.setItem('echopath.backend', base); } catch { /* 忽略 */ }
  setApiStatus('正在重连…');
  await detectBackend();
  refreshBackendHint();
  setApiStatus(Backend.online ? '已连接。回到「来时路」即可开始。' : '仍然连不上。', Backend.online ? 'ok' : 'err');
  if (Backend.online && Backend.keyConfigured && !Store.messages.length) startInterview();
});
$('#apiDemo').addEventListener('click', async () => {
  apiDialog.close();
  if (!Backend.online) { setStatus('后端不在线，示例也跑不了。', true); showPage('p2'); return; }
  Store.situation = {
    stage: '大三', options: ['守住现在的专业', '现在换道'],
    root_factors: ['沉没成本', '再次选错风险', '新路径验证不足'],
    constraints: ['家庭希望稳定'], goals: ['长期方向匹配'],
    fear: '再浪费几年发现还是不喜欢', risk: 'medium', reversibility: 'medium', unknowns: [],
  };
  Store.bestQuote = '拿了奖学金那天，反而觉得很空。';
  Store.summary = '我理解下来：你为现在的方向投入了两年，但拿奖学金那天反而觉得空；你怕的不是损失过去，而是再浪费几年发现还是不喜欢。我理解得对吗？';
  showPage('p4');          // 先切页，让加载仪式在 P4 露面
  await runLandscape();
});

/* ═══════════ 十五、API 调试台 ═══════════ */

const devDialog = $('#devDialog'), devOut = $('#devOut'), devMeta = $('#devMeta'), devBody = $('#devBody');

function devPayload(endpoint) {
  const s = Store.situation || buildSituation();
  switch (endpoint) {
    case 'POST /interview/answer':
      return { state: Store.iState || { turns: [], collected: {}, confidence: {}, asked: [], progressMarks: [] }, answer: '我在这里填一句回答', asked_field: Store.askedField };
    case 'POST /interview/finish':
      return { state: Store.iState || { turns: [], collected: {}, confidence: {}, asked: [], progressMarks: [] } };
    case 'POST /landscape':
      return { situation: s, user_quote: Store.bestQuote || '', source_id: Store.sourceId };
    case 'POST /case':
      return {
        episode_id: Store.currentCases[0]?.episode_id || 'lu_xun_1906_medicine_to_literature',
        source_id: Store.sourceId,
        stage: s.stage, options: s.options, constraints: s.constraints,
        goals: s.goals, risk: s.risk, reversibility: s.reversibility,
      };
    default:
      return {};
  }
}
function devRefreshBody() {
  const ep = $('#devEndpoint').value;
  const isGet = ep.startsWith('GET');
  devBody.disabled = isGet;
  devBody.value = isGet ? '' : JSON.stringify(devPayload(ep), null, 2);
  $('#devBase').textContent = Backend.base || '（未连接）';
}
function openDev() {
  devRefreshBody();
  devOut.textContent = '（还没有发过请求）';
  devMeta.textContent = '';
  devDialog.showModal();
}
$('#devOpenP2').addEventListener('click', openDev);
$('#devOpenP4').addEventListener('click', openDev);
$('#devEndpoint').addEventListener('change', devRefreshBody);
$('#devFill').addEventListener('click', devRefreshBody);
$('#devSend').addEventListener('click', async () => {
  const ep = $('#devEndpoint').value;
  const [method, path] = ep.split(' ');
  let bodyData;
  if (method === 'POST') {
    try { bodyData = JSON.parse(devBody.value || '{}'); }
    catch (e) { devMeta.textContent = `JSON 不合法：${e.message}`; devMeta.className = 'api-status err'; return; }
  }
  devOut.textContent = '发送中…';
  devMeta.textContent = '';
  const t0 = performance.now();
  try {
    const r = await api(path, bodyData);
    const ms = Math.round(performance.now() - t0);
    delete r.__ms;
    devOut.textContent = JSON.stringify(r, null, 2);
    devMeta.textContent = `200 · ${ms}ms`;
    devMeta.className = 'api-status ok';
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    devOut.textContent = JSON.stringify(e.raw || { message: e.message }, null, 2);
    devMeta.textContent = `${e.status || 'ERR'} · ${ms}ms · ${e.message}`;
    devMeta.className = 'api-status err';
  }
});

/* ═══════════ 十六、启动 ═══════════ */

/* ═══════════ 十六点五、品牌角色：提灯旅伴 ═══════════
   交互纪律：他表达陪伴，不暗示能预测未来 ——
   点亮的是"来路"（身后），从来不是前方的路。 */
(function palInit() {
  const pal = $('#pal');
  if (!pal) return;
  let litTimer = 0;
  const light = () => {
    pal.classList.add('lit');
    clearTimeout(litTimer);
    litTimer = setTimeout(() => pal.classList.remove('lit'), 2800);
  };
  pal.addEventListener('pointerdown', light);          // 鼠标与触摸同源
  pal.addEventListener('keydown', e => {               // 键盘可达
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); light(); }
  });
  if (!REDUCED) {
    /* 鼠标靠近时轻微转向（减少动态时完全关闭） */
    $('#p1').addEventListener('pointermove', e => {
      const r = pal.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      pal.style.setProperty('--pal-lean', `${Math.max(-1, Math.min(1, dx * 3)) * 4}deg`);
    });
  }
})();

/* ═══════════ 十七、导出 / 导入：把这次聊到的内容打成文件给别人用 ═══════════
   ⚠️ 后端是无状态的 —— 所有用户内容只在他自己的浏览器里。
   分享 = 导出 JSON 文件，对方导入即可看到完整记录（对话/字段/总结/地形/行动记录）。
   不经过任何服务器，文件给谁由用户自己决定。 */

function buildExportData() {
  return {
    version: 'echopath-share-v1',
    exportedAt: new Date().toISOString(),
    messages: Store.messages,
    iState: Store.iState,
    askedField: Store.askedField,
    summary: Store.summary,
    noDilemma: Store.noDilemma,
    bestQuote: Store.bestQuote,
    situation: Store.situation,
    landscape: Store.landscape,
    sourceId: Store.sourceId,
    currentCases: Store.currentCases,
    crossroads: readSaved(),
  };
}

$('#exportBtn').addEventListener('click', () => {
  const data = buildExportData();
  if (!data.messages.length && !data.summary && !data.crossroads.length) {
    setStatus('还没有可导出的内容 —— 先在便签里聊几句。', true);
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `来路记录-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('已导出成一个 JSON 文件，发给别人就能用（对方在便签里点「导入」）。');
  setTimeout(clearStatus, 4000);
});

/** 应用一份导入的记录（从文件 handlers 里拆出来，方便直接测） */
function applyImport(data) {
  if (!data || data.version !== 'echopath-share-v1' || typeof data !== 'object')
    throw new Error('不是这份 demo 导出的记录文件');
  Object.assign(Store, {
    messages: data.messages ?? [],
    iState: data.iState ?? null,
    askedField: data.askedField ?? '',
    summary: data.summary ?? '',
    noDilemma: !!data.noDilemma,
    bestQuote: data.bestQuote ?? '',
    situation: data.situation ?? null,
    landscape: data.landscape ?? null,
    sourceId: data.sourceId,
    currentCases: data.currentCases ?? [],
    mockMode: false,
  });
  if (Array.isArray(data.crossroads)) {
    try { localStorage.setItem('echopath.crossroads', JSON.stringify(data.crossroads)); } catch { /* 忽略 */ }
  }
  persist();
  renderHints([]);
  renderChat(); renderFieldPanel(); fillSummaryPage(); renderSavedList();
  drawRoad();
}

$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (Store.messages.length && !confirm('导入会覆盖你当前这次的对话和处境（已保存的路口会保留并合并）。继续吗？')) return;
    applyImport(data);
    setStatus('导入完成 —— 对话、处境和行动记录都恢复了。');
    setTimeout(clearStatus, 4000);
    showPage(Store.summary ? 'p3' : 'p2');
  } catch (err) {
    setStatus(`导入失败：${err.message}`, true);
  }
});

$('#noteToggle').addEventListener('click', () => $('#roadnote').classList.toggle('open'));

(async function init() {
  const had = restore();
  if (had) { renderChat(); renderFieldPanel(); fillSummaryPage(); }
  refreshBackendHint();
  setStatus('正在寻找后端…');
  await detectBackend();
  refreshBackendHint();
  clearStatus();
  if (had && Store.messages.length) { renderChat(); renderFieldPanel(); fillSummaryPage(); }
  if (Backend.online) await ensureSources();
  showPage('p1');
})();
