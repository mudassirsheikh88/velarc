/* VELARC — interactions and scroll timelines (no dependencies) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t * t;
  const eIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const SVGNS = 'http://www.w3.org/2000/svg';

  const root = document.documentElement;
  const body = document.body;
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqReduce.matches;
  let W = innerWidth, H = innerHeight;
  const isMobile = () => W < 700;

  /* ------------------------------------------------------------------
     LAND MASK  ->  dots
     ------------------------------------------------------------------ */
  const LAND = (window.VELARC_LAND || []).map(r => r.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join(''));
  const isLand = (lat, lon) => {
    if (!LAND.length) return false;
    const y = Math.floor((90 - lat) / 1.5), x = Math.floor(((lon + 180) % 360) / 1.5);
    return LAND[clamp(y, 0, 119)]?.[clamp(x, 0, 239)] === '1';
  };
  const HUBS = [
    { n: 'Dubai', lat: 25.2, lon: 55.3 }, { n: 'Riyadh', lat: 24.7, lon: 46.7 }, { n: 'Rotterdam', lat: 51.9, lon: 4.5 },
    { n: 'Munich', lat: 48.1, lon: 11.6 }, { n: 'Mumbai', lat: 19.1, lon: 72.9 }, { n: 'Singapore', lat: 1.3, lon: 103.8 },
    { n: 'Sydney', lat: -33.9, lon: 151.2 }, { n: 'Los Angeles', lat: 34.0, lon: -118.2 }, { n: 'Houston', lat: 29.8, lon: -95.4 },
    { n: 'Cairo', lat: 30.0, lon: 31.2 }, { n: 'Shanghai', lat: 31.2, lon: 121.5 }, { n: 'Johannesburg', lat: -26.2, lon: 28.0 }
  ];
  const ROUTES = [[0, 1], [0, 4], [0, 9], [0, 2], [2, 3], [4, 5], [5, 10], [5, 6], [7, 8], [8, 2], [9, 11], [0, 10]];

  /* ------------------------------------------------------------------
     LOADER
     ------------------------------------------------------------------ */
  const drawFlatMap = (cv, opts = {}) => {
    const ctx = cv.getContext('2d'), d = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    const step = opts.step || Math.max(4, w / 130);
    const mw = Math.min(w, h * 2), mh = mw / 2, ox = (w - mw) / 2, oy = (h - mh) / 2;
    ctx.fillStyle = opts.color || 'rgba(255,255,255,.55)';
    for (let y = oy; y < oy + mh; y += step) for (let x = ox; x < ox + mw; x += step) {
      const lat = 90 - ((y - oy) / mh) * 180, lon = ((x - ox) / mw) * 360 - 180;
      if (lat < -60) continue;
      if (isLand(lat, lon)) { ctx.beginPath(); ctx.arc(x, y, opts.r || 1.1, 0, 7); ctx.fill(); }
    }
    if (opts.hubs) HUBS.slice(0, 8).forEach((hb, i) => {
      const x = ox + (hb.lon + 180) / 360 * mw, y = oy + (90 - hb.lat) / 180 * mh;
      ctx.fillStyle = i % 2 ? '#1a2bff' : '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    });
  };

  const finishLoading = () => { body.classList.remove('is-loading'); body.classList.add('is-loaded'); };
  (() => {
    const cv = $('.loader__map'), num = $('[data-count-loader]');
    if (reduced) { finishLoading(); return; }
    drawFlatMap(cv);
    const t0 = performance.now(), dur = 1900;
    const tick = t => {
      const k = clamp((t - t0) / dur), v = Math.round(eIO(k) * 100);
      num.textContent = String(v).padStart(2, '0');
      if (k < 1) requestAnimationFrame(tick); else setTimeout(finishLoading, 200);
    };
    requestAnimationFrame(tick);
  })();

  /* ------------------------------------------------------------------
     HEADER + MENU + CURSOR
     ------------------------------------------------------------------ */
  const hdr = $('[data-hdr]'), menuBtn = $('.hdr__menu'), menu = $('#menu'), menuLabel = $('[data-menu-label]');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open); menu.hidden = !open;
    menuLabel.textContent = open ? 'Close' : 'Menu';
    hdr.classList.toggle('is-menu', open); root.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const cursor = $('.cursor');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let mx = -99, my = -99, cx = -99, cy = -99;
  if (finePointer) {
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', e => cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, input, .pgrid li')));
  }

  /* ------------------------------------------------------------------
     TEXT HELPERS (word lighting, fills, counters)
     ------------------------------------------------------------------ */
  $$('[data-words]').forEach(el => { el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); });
  const numIO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; numIO.unobserve(en.target);
    const el = en.target, to = parseFloat(el.dataset.num), dec = +(el.dataset.dec || 0);
    if (reduced) { el.textContent = to.toFixed(dec); return; }
    const t0 = performance.now();
    const st = t => { const k = clamp((t - t0) / 1800); el.textContent = (eOut(k) * to).toFixed(dec); if (k < 1) requestAnimationFrame(st); };
    requestAnimationFrame(st);
  }), { threshold: .5 });
  $$('[data-num]').forEach(el => numIO.observe(el));

  /* ------------------------------------------------------------------
     HERO GLOBE
     ------------------------------------------------------------------ */
  const globe = (() => {
    const cv = $('.hero__globe'), ctx = cv.getContext('2d');
    let gx, gy, R, dpr, rot = -0.75, scl = 1, lift = 0;
    const pts = [];
    for (let lat = -58; lat <= 82; lat += 1.5) {
      const step = 1.5 / Math.max(.25, Math.cos(lat * Math.PI / 180));
      for (let lon = -180; lon < 180; lon += step) if (isLand(lat, lon)) pts.push(ll(lat, lon));
    }
    function ll(lat, lon) { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)]; }
    const hubV = HUBS.map(h => ll(h.lat, h.lon));
    const tilt = 0.42;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (isMobile()) { R = W * .82; gx = W * .62; gy = H * .34; }
      else { R = Math.min(H * .62, W * .42); gx = W * .73; gy = H * .6; }
    }
    function proj(v, r, ox, oy) {
      const c = Math.cos(rot), s = Math.sin(rot);
      const x = v[0] * c + v[2] * s, z = -v[0] * s + v[2] * c, y = v[1];
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      return [ox + x * r, oy + (y * ct - z * st) * r, y * st + z * ct];
    }
    function slerp(a, b, t) {
      const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d), so = Math.sin(om) || 1;
      const k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so, l = 1 + Math.sin(Math.PI * t) * .1 * om;
      return [(a[0] * k1 + b[0] * k2) * l, (a[1] * k1 + b[1] * k2) * l, (a[2] * k1 + b[2] * k2) * l];
    }
    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      const r = R * scl, ox = gx, oy = gy - lift * H;
      // atmosphere: warm top, cool bottom
      let g = ctx.createRadialGradient(ox, oy - r * .1, r * .9, ox, oy - r * .1, r * 1.35);
      g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(.12, 'rgba(255,128,48,.42)'); g.addColorStop(.4, 'rgba(255,110,30,.1)'); g.addColorStop(1, 'rgba(255,110,30,0)');
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, oy + r * .1); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      g = ctx.createRadialGradient(ox, oy + r * .1, r * .9, ox, oy + r * .1, r * 1.4);
      g.addColorStop(0, 'rgba(40,70,255,0)'); g.addColorStop(.12, 'rgba(48,80,255,.6)'); g.addColorStop(.4, 'rgba(30,50,255,.16)'); g.addColorStop(1, 'rgba(30,50,255,0)');
      ctx.save(); ctx.beginPath(); ctx.rect(0, oy - r * .1, W, H); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      // body
      g = ctx.createRadialGradient(ox - r * .2, oy - r * .3, r * .1, ox, oy, r);
      g.addColorStop(0, '#07090f'); g.addColorStop(.9, '#020203'); g.addColorStop(1, '#05060a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, r, 0, 7); ctx.fill();
      // rim
      const rg = ctx.createLinearGradient(ox, oy - r, ox, oy + r);
      rg.addColorStop(0, '#ffb070'); rg.addColorStop(.35, '#ff7a1a'); rg.addColorStop(.55, '#6f4dff'); rg.addColorStop(1, '#2f5bff');
      ctx.strokeStyle = rg; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(120,120,255,.9)'; ctx.shadowBlur = 26;
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
      // land dots
      for (let i = 0; i < pts.length; i++) {
        const [x, y, z] = proj(pts[i], r, ox, oy);
        if (z < 0.02) continue;
        const limb = 1 - z;
        const top = (oy - y) / r;
        if (limb > .55) ctx.fillStyle = top > 0 ? `rgba(255,150,80,${.25 + z})` : `rgba(110,140,255,${.25 + z})`;
        else ctx.fillStyle = `rgba(235,238,255,${.18 + z * .75})`;
        ctx.fillRect(x - .9, y - .9, 1.8, 1.8);
      }
      // routes + pulses
      const t = (time || 0) / 1000;
      ROUTES.forEach(([a, b], i) => {
        const A = hubV[a], B = hubV[b];
        ctx.beginPath(); let on = false;
        for (let s = 0; s <= 48; s++) {
          const [x, y, z] = proj(slerp(A, B, s / 48), r, ox, oy);
          if (z < -0.02) { on = false; continue; }
          on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true;
        }
        ctx.strokeStyle = 'rgba(255,122,26,.75)'; ctx.lineWidth = 1.1; ctx.stroke();
        const k = (t * .16 + i * .17) % 1, [px, py, pz] = proj(slerp(A, B, k), r, ox, oy);
        if (pz > 0) { ctx.fillStyle = '#ffd2a8'; ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(px, py, 2, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      });
      // hub chips
      ctx.font = '500 9px "JetBrains Mono", monospace';
      HUBS.forEach((h, i) => {
        const [x, y, z] = proj(hubV[i], r, ox, oy);
        if (z < .15) return;
        ctx.globalAlpha = clamp((z - .15) * 3);
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
        const lb = h.n.toUpperCase(), tw = ctx.measureText(lb).width;
        ctx.fillStyle = 'rgba(14,15,18,.9)'; ctx.fillRect(x - tw / 2 - 6, y - 22, tw + 12, 14);
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; ctx.strokeRect(x - tw / 2 - 5.5, y - 21.5, tw + 11, 13);
        ctx.fillStyle = '#fff'; ctx.fillText(lb, x - tw / 2, y - 12);
        ctx.globalAlpha = 1;
      });
    }
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    return {
      resize() { resize(); draw(performance.now()); },
      update(time, hp, dt) {
        if (!visible) return;
        if (!reduced) rot += dt * 0.000045 + 0;
        scl = 1 + hp * .28; lift = hp * .12;
        draw(time);
      },
      spin(v) { rot += v; }
    };
  })();

  /* ------------------------------------------------------------------
     JOURNEY — side scene (SVG) + services + top-down road (SVG)
     ------------------------------------------------------------------ */
  const J = {};
  (() => {
    J.sec = $('.journey'); J.stick = $('.journey__stick');
    J.side = $('.journey__side'); J.side.innerHTML = VScene.sideScene();
    J.giant = $('.journey__giant'); J.speed = $('.journey__speed'); J.speedNum = $('[data-speed]');
    J.svc = $('.svc'); J.track = $('.svc__track');
    J.road = $('.road'); J.roadSvg = $('.road__svg'); J.left = $('.road__left'); J.title = $('.road__title'); J.para = $('.road__para');
    J.feats = $$('.feat');
    const q = s => J.side.querySelector(s);
    J.truck = q('.truck'); J.truckInner = q('.truck-inner'); J.stack = q('.stack');
    J.stk = q('.stk-pos'); J.arm = q('.stk-arm'); J.outer = q('.stk-outer'); J.inner = q('.stk-inner'); J.cyl = q('.stk-cyl');
    J.spr = q('.spr-pos'); J.sprBeam = q('.spr-beam'); J.sprL = q('.spr-l'); J.sprR = q('.spr-r');
    J.loadEnd = q('.load-end'); J.loadSide = q('.load-side');
    J.spinT = $$('.truck .spin', J.side); J.spinS = $$('.spin-stk', J.side);
    // ribs + corner castings on the side container
    q('.bx-ribs').innerHTML = Array.from({ length: 29 }, (_, i) => `<path d="M${20 + i * 20} -142 V-12"/>`).join('');
    q('.bx-corners').innerHTML = [[0, -150], [588, -150], [0, -12], [588, -12]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="12"/>`).join('');
  })();

  // keyframes for the loading sequence: [t, bx, tipX, tipY]
  const PICK = { x: 1155, y: -334 }, DROP = { x: 550, y: -288 };
  const TX_FINAL = 230;
  const kStk = [
    [0.00, -800, null, -360], [0.16, 640, 1155, -360], [0.22, 640, 1155, -334], [0.30, 640, 1155, -430],
    [0.50, -20, 550, -440], [0.64, -20, 550, -440], [0.74, -20, 550, -288], [0.79, -20, 550, -340], [1.00, -980, null, -340]
  ];
  function stkAt(a) {
    let i = 0; while (i < kStk.length - 2 && a > kStk[i + 1][0]) i++;
    const A = kStk[i], B = kStk[i + 1], t = eIO(range(a, A[0], B[0]));
    const bx = lerp(A[1], B[1], t);
    // when tip x is null, keep the boom pose relative to the body
    const rel = 455;
    const ax = A[2] == null ? A[1] + 60 + rel : A[2];
    const bxx = B[2] == null ? B[1] + 60 + (B[1] < -900 ? 510 : rel) : B[2];
    return { bx, tx: lerp(ax, bxx, t), ty: lerp(A[3], B[3], t) };
  }

  function renderSide(p, mobile) {
    // ---------- phase A: loading (0 .. .34)
    const a = range(p, 0, .34);
    const { bx, tx, ty } = stkAt(a);
    const px = bx + 60, py = -160;
    const dx = tx - px, dy = ty - py, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    J.stk.setAttribute('transform', `translate(${bx} 0)`);
    q2(J.stk.querySelector('.stk-boom'), `translate(60 -160)`);
    J.arm.setAttribute('transform', `rotate(${ang})`);
    J.inner.setAttribute('x', Math.max(120, L - 260));
    const cylEnd = { x: Math.cos(ang * Math.PI / 180) * 150, y: Math.sin(ang * Math.PI / 180) * 150 };
    J.cyl.setAttribute('d', `M120 60 L${cylEnd.x} ${cylEnd.y + 8}`);
    J.spinS.forEach(s => s.setAttribute('transform', `rotate(${bx * 1.25})`));

    // container rotation from end view to side view
    const rot = eIO(range(a, .32, .48));
    const sw = lerp(150, 600, rot);
    const attached = a >= .22 && a < .745;
    let cxB, cyB; // container bottom-center
    if (a < .22) { cxB = PICK.x; cyB = -150; }
    else if (attached) { cxB = tx; cyB = ty + 184; }
    else { cxB = DROP.x; cyB = -104; }
    J.loadEnd.setAttribute('transform', `translate(${cxB - 75} ${cyB})`);
    J.loadEnd.style.opacity = 1 - range(a, .32, .4);
    const sx = sw / 600;
    J.loadSide.setAttribute('transform', `translate(${cxB - 300 * sx} ${cyB}) scale(${sx} 1)`);
    J.loadSide.style.opacity = range(a, .33, .41);
    // spreader
    J.spr.setAttribute('transform', `translate(${tx} ${ty})`);
    J.sprBeam.setAttribute('x', -sw / 2); J.sprBeam.setAttribute('width', sw);
    J.sprL.setAttribute('x', -sw / 2); J.sprR.setAttribute('x', sw / 2 - 16);
    const stkGone = range(a, .9, 1);
    J.spr.style.opacity = J.stk.style.opacity = 1 - stkGone;

    // truck arrives
    const tIn = eOut(range(a, .42, .64));
    let Tx = lerp(2300, TX_FINAL, tIn);
    // ---------- phase C/D: services + tilt
    const c = range(p, .40, .62);
    const spin = Tx * 1.75 - c * 5200;
    J.spinT.forEach(s => s.setAttribute('transform', `rotate(${-spin})`));
    J.truck.setAttribute('transform', `translate(${Tx} 0)`);
    const d = eIn(range(p, .612, .632));
    J.truckInner.setAttribute('transform', `scale(1 ${Math.max(.001, 1 - d)})`);
    J.loadSide.style.visibility = d > .98 ? 'hidden' : '';

    // ---------- camera
    const s0 = mobile ? W / 900 : Math.min(W / 1500, H / 640);
    const s1 = mobile ? (W * .92) / 860 : Math.min((W * .48) / 860, (H * .36) / 300);
    const gy0 = H * (mobile ? .8 : .86), gy1 = H * .42;
    const z = eIO(range(p, .335, .40));
    const camA = lerp(mobile ? 1000 : 900, mobile ? 640 : 660, eIO(range(a, .2, .55)));
    const camX = lerp(camA, TX_FINAL + 410, z);
    const sc = lerp(s0, s1, z);
    let gy = lerp(gy0, gy1, z);
    gy = lerp(gy, -40, eIO(range(p, .626, .65)));
    J.side.setAttribute('viewBox', `${camX - W / (2 * sc)} ${-gy / sc} ${W / sc} ${H / sc}`);
    J.stack.style.opacity = 1 - z;
    return { gy, z };
  }
  function q2(el, tr) { if (el.getAttribute('transform') !== tr) el.setAttribute('transform', tr); }

  /* ---- top-down road world ---- */
  const RD = {};
  function buildRoad() {
    const mobile = isMobile();
    const w = mobile ? Math.max(64, W * .17) : clamp(W * .13, 130, 220);
    const Xc = mobile ? W * .16 : W * .5;
    const yc = w / 2, R = w * .9, rc = R - w / 6, ro = w * .35, lane = w / 3;
    const big = 8 * Math.max(W, H);
    const yEnd = 6 * H;
    Object.assign(RD, { w, Xc, yc, R, rc, ro, lane, mobile });
    const leftPanel = `M${-big} ${w} H${Xc - w / 2 - rc} A${rc} ${rc} 0 0 1 ${Xc - w / 2} ${w + rc} V${big} H${-big} Z`;
    const rightPanel = `M${big} ${w} H${Xc + w / 2 + ro} A${ro} ${ro} 0 0 0 ${Xc + w / 2} ${w + ro} V${big} H${big} Z`;
    const route = `M${Xc - 1.6 * W} ${yc + lane} H${Xc - lane - R} A${R} ${R} 0 0 1 ${Xc - lane} ${yc + lane + R} V${yEnd}`;
    const dash = `${w * .26} ${w * .3}`;
    const hatch = Array.from({ length: 7 }, (_, i) => `<path d="M${Xc - w * .18 + i * w * .06} ${w} l${w * .03} ${-w * .18}"/>`).join('');
    J.roadSvg.innerHTML = `${VScene.defs}
      <rect x="${-big}" y="${-big}" width="${big * 2}" height="${big}" fill="#fff"/>
      <rect x="${-big}" y="0" width="${big * 2}" height="${big}" fill="#111214"/>
      <g stroke="#3d3f44" stroke-width="${Math.max(2, w * .018)}" stroke-dasharray="${dash}" fill="none">
        <path d="M${-big} ${yc - w / 6} H${big}"/>
        <path d="M${-big} ${yc + w / 6} H${Xc - w / 2 - rc * .6}"/><path d="M${Xc + w / 2 + ro} ${yc + w / 6} H${big}"/>
        <path d="M${Xc - w / 6} ${w + rc * .8} V${big}"/><path d="M${Xc + w / 6} ${w + rc * .8} V${big}"/>
      </g>
      <path d="M${Xc - w * .2} ${w} L${Xc + w * .2} ${w} L${Xc} ${w + w * .38} Z" fill="none" stroke="#5a5c62" stroke-width="1.5"/>
      <g stroke="#5a5c62" stroke-width="1.2">${Array.from({ length: 6 }, (_, i) => `<path d="M${Xc - w * .14 + i * w * .055} ${w + 2} l${w * .05} ${w * .1}"/>`).join('')}</g>
      <path d="${leftPanel}" fill="#fff"/><path d="${rightPanel}" fill="#fff"/>
      <path class="route" d="${route}" fill="none" stroke="none"/>
      <g class="tt">${VScene.truckTop()}</g>`;
    RD.route = $('.route', J.roadSvg); RD.tt = $('.tt', J.roadSvg);
    RD.L = RD.route.getTotalLength();
    RD.h0 = 1.6 * W - lane - R;
    RD.sArc = RD.h0 + Math.PI * R / 2;
    RD.s0 = Math.max(0, RD.h0 - (mobile ? .55 : 1.0) * W);
    RD.s1 = RD.L - H * 1.2;
    RD.z0 = clamp((mobile ? .8 : .48) * W / (w * 1.55), 1.4, 4);
    RD.k = (w * 1.55) / 700;
    // feature positions (world)
    const fx = mobile ? Xc + w / 2 + 16 : Xc + w / 2 + W * .09;
    const fw = mobile ? W - fx - 16 : Math.min(280, W - fx - W * .06);
    RD.fx = fx; RD.fw = fw;
    RD.fy = J.feats.map((_, i) => w + H * (mobile ? .62 : .62) + i * H * (mobile ? .72 : .62));
    J.feats.forEach(f => f.style.setProperty('--feat-w', fw + 'px'));
    if (mobile) { J.title.style.left = (Xc + w / 2 + 16) + 'px'; J.title.style.right = '16px'; }
    else { J.title.style.left = ''; J.title.style.right = ''; }
  }

  function renderRoad(p) {
    const e = range(p, .665, 1);
    const tilt = eOut(range(p, .655, .7));
    const s = e < .4 ? lerp(RD.s0, RD.sArc, e / .4) : lerp(RD.sArc, RD.s1, (e - .4) / .6);
    const P = RD.route.getPointAtLength(s), P2 = RD.route.getPointAtLength(Math.min(RD.L, s + 2));
    const ang = Math.atan2(P2.y - P.y, P2.x - P.x) * 180 / Math.PI;
    RD.tt.setAttribute('transform', `translate(${P.x} ${P.y}) rotate(${ang}) scale(${RD.k} ${RD.k * Math.max(.02, tilt)})`);
    const f = clamp(ang / 90);
    const ff = eIO(f);
    const z = lerp(RD.z0, 1, eIO(range(e, 0, .26)));
    const camX = lerp(P.x + W * (RD.mobile ? .1 : .12) / z, RD.Xc + (RD.mobile ? W * .34 : 0), ff);
    const camY = lerp(RD.yc + H * .02, P.y, ff);
    const vw = W / z, vh = H / z, vx = camX - vw / 2, vy = camY - vh / 2;
    J.roadSvg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    // features follow the world
    J.feats.forEach((el, i) => {
      const sx = (RD.fx - vx) * z, sy = (RD.fy[i] - vy) * z;
      el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${z.toFixed(3)})`;
    });
    // left column appears once the white panels are on screen
    const panelTop = (RD.w - vy) * z;
    const hdrH = RD.mobile ? 64 : 96;
    const ty = RD.mobile ? panelTop + H * .05 : Math.max(hdrH, panelTop + H * .06);
    J.title.style.transform = `translateY(${(ty - hdrH).toFixed(1)}px)`;
    J.left.style.opacity = range(H * .92 - panelTop, 0, H * .12).toFixed(3);
    J.para.style.opacity = range(H * .45 - panelTop, 0, H * .2).toFixed(3);
    J.road.style.opacity = range(p, .646, .654);
    J.road.classList.toggle('is-on', p > .64);
    // header theme over the road
    const topWorld = vy + 40 / z;
    return topWorld > RD.w ? 'light' : topWorld < 0 ? 'light' : 'dark';
  }

  let lastSy = 0, speed = 0;
  function renderJourney(p, dy, dt) {
    const mobile = isMobile();
    const { gy } = renderSide(p, mobile);
    // giant word
    const gOn = range(p, .35, .41) * (1 - range(p, .6, .64));
    J.giant.style.opacity = gOn;
    J.giant.style.transform = `translateX(${(-range(p, .34, .64) * J.giant.scrollWidth * .5).toFixed(1)}px)`;
    J.giant.style.setProperty('--giant-top', `${Math.max(40, gy - J.giant.offsetHeight * .92)}px`);
    // services panel sits on the ground line
    const svcOn = range(p, .37, .405) * (1 - range(p, .605, .63));
    J.svc.style.opacity = svcOn;
    J.svc.classList.toggle('is-on', svcOn > .5);
    J.svc.style.height = `${Math.max(0, H - Math.max(gy, 0))}px`;
    const c = range(p, .40, .62);
    const max = Math.max(0, J.track.scrollWidth - W + 40);
    J.track.style.transform = `translateX(${(-eIO(c) * max).toFixed(1)}px)`;
    // road
    let theme = 'light';
    if (p > .64) theme = renderRoad(p);
    else { J.road.style.opacity = 0; J.road.classList.remove('is-on'); if (p > .635) theme = 'dark'; }
    // speedometer
    const v = Math.abs(dy) / Math.max(dt, 1) * 1000;
    speed = lerp(speed, Math.min(99, v / 30), .08);
    J.speed.style.opacity = range(p, .36, .4) * (1 - range(p, .98, 1));
    J.speedNum.textContent = String(Math.round(speed)).padStart(2, '0');
    J.speed.classList.toggle('on-dark', theme === 'dark');
    return theme;
  }

  /* ------------------------------------------------------------------
     WHY — top-down truck zooming out on a blue night highway
     ------------------------------------------------------------------ */
  const WY = {};
  (() => {
    WY.sec = $('.why'); WY.cv = $('.why__bg'); WY.ctx = WY.cv.getContext('2d');
    WY.truck = $('.why__truck'); WY.title = $('.why__title'); WY.feats = $$('.wf'); WY.clouds = $$('.why__clouds i');
    WY.truck.innerHTML = `${VScene.defs}<g transform="rotate(-90)">${VScene.truckTop()}</g>`;
    WY.truck.setAttribute('viewBox', '-70 -360 140 720');
    WY.glints = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + .3, a: Math.random() * .6 + .1 }));
    WY.cloudFrom = [[-1.1, .1], [1.1, -.1], [-.9, .9], [.9, .8], [0, 1.2], [-.2, -1.1]];
  })();
  function resizeWhy() { const d = Math.min(devicePixelRatio || 1, 2); WY.cv.width = W * d; WY.cv.height = H * d; WY.ctx.setTransform(d, 0, 0, d, 0, 0); }
  let roadOffset = 0;
  function renderWhy(q, dt) {
    const ctx = WY.ctx;
    const base = (H * .92) / 700;
    const zs = q < .12 ? lerp(2.6, 2.2, eOut(range(q, 0, .12))) : q < .45 ? lerp(2.2, 1, eIO(range(q, .12, .45))) : q < .8 ? lerp(1, .42, eIO(range(q, .45, .8))) : lerp(.42, .2, eIO(range(q, .8, 1)));
    const ts = base * zs;
    const ty = lerp(H * 1.1, 0, eOut(range(q, 0, .14))) + (q > .45 ? -H * .04 * range(q, .45, .8) : 0);
    WY.truck.style.setProperty('--ts', ts.toFixed(4));
    WY.truck.style.setProperty('--ty', ty.toFixed(1) + 'px');
    // background
    const g = ctx.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .5, Math.max(W, H) * .8);
    g.addColorStop(0, '#0d2fa8'); g.addColorStop(.6, '#071c78'); g.addColorStop(1, '#041253');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!reduced) roadOffset += dt * .25 * zs;
    // lane lines scale with zoom
    const sp = 190 * ts, cx0 = W / 2;
    ctx.strokeStyle = 'rgba(160,190,255,.2)'; ctx.lineWidth = Math.max(1, 5 * ts);
    ctx.setLineDash([70 * ts, 90 * ts]); ctx.lineDashOffset = -roadOffset * ts / base;
    for (let k = -6; k <= 6; k++) { const x = cx0 + (k + .5) * sp; if (x < -10 || x > W + 10) continue; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.setLineDash([]);
    // light trail from the tail lamps
    const tailY = H / 2 + ty + 350 * ts, half = 40 * ts;
    if (tailY < H + 50) {
      const tg = ctx.createLinearGradient(0, tailY, 0, H);
      tg.addColorStop(0, 'rgba(255,255,255,.55)'); tg.addColorStop(.25, 'rgba(140,170,255,.25)'); tg.addColorStop(1, 'rgba(140,170,255,0)');
      ctx.fillStyle = tg;
      [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(W / 2 + sg * half - 6 * ts, tailY); ctx.lineTo(W / 2 + sg * half * 2.4 - 30 * ts, H + 10); ctx.lineTo(W / 2 + sg * half * 2.4 + 30 * ts, H + 10); ctx.lineTo(W / 2 + sg * half + 6 * ts, tailY); ctx.fill(); });
    }
    // glints
    WY.glints.forEach(p => {
      const y = ((p.y * H + roadOffset * .6 * p.r) % H);
      ctx.fillStyle = `rgba(200,220,255,${p.a * .5})`; ctx.fillRect(p.x * W, y, p.r, p.r);
    });
    // title
    const tt = range(q, .17, .29) * (1 - range(q, .39, .46));
    WY.title.style.setProperty('--tt', tt.toFixed(3));
    // features
    WY.feats.forEach((f, i) => f.classList.toggle('on', q > .5 + i * .045 && q < .84));
    // clouds
    const cl = range(q, .8, 1);
    WY.clouds.forEach((c, i) => {
      const [fx, fy] = WY.cloudFrom[i];
      const k = eOut(clamp(cl * 1.25 - i * .04));
      const x = W / 2 + fx * W * (1 - k) - c.offsetWidth / 2 + (i - 2.5) * W * .05;
      const y = H / 2 + fy * H * (1 - k) - c.offsetHeight / 2;
      c.style.opacity = clamp(k * 1.4);
      c.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) scale(${(.6 + k * .8).toFixed(3)})`;
    });
    $('.why__clouds').style.background = `rgba(255,255,255,${eIn(range(q, .9, 1)).toFixed(3)})`;
    return q > .93 ? 'light' : 'dark';
  }

  /* ------------------------------------------------------------------
     INSIGHTS thumbnails, CTA rings, footer
     ------------------------------------------------------------------ */
  const THUMBS = [
    `<rect width="320" height="220" fill="#1b1e24"/><rect x="0" y="150" width="320" height="70" fill="#0d0e10"/><g fill="#2c3038"><rect x="40" y="60" width="40" height="90" rx="4"/><rect x="140" y="60" width="40" height="90" rx="4"/><rect x="240" y="60" width="40" height="90" rx="4"/></g><g fill="#ff7a1a"><rect x="48" y="72" width="24" height="4"/><rect x="148" y="72" width="24" height="4"/><rect x="248" y="72" width="24" height="4"/></g><g fill="#3d6bff"><rect x="52" y="90" width="16" height="30" rx="2"/><rect x="152" y="90" width="16" height="30" rx="2"/><rect x="252" y="90" width="16" height="30" rx="2"/></g>`,
    `<rect width="320" height="220" fill="#d9c7a6"/><path d="M0 220 L130 90 H190 L320 220Z" fill="#2a2c30"/><path d="M160 92 V220" stroke="#e8e8e8" stroke-width="3" stroke-dasharray="14 12"/><circle cx="250" cy="50" r="22" fill="#ffd28a"/><path d="M0 110 Q80 90 130 92 L0 130Z" fill="#c4ae88"/>`,
    `<rect width="320" height="220" fill="#f3a35a"/><circle cx="160" cy="200" r="120" fill="#ff7a1a"/><circle cx="160" cy="200" r="60" fill="#ffd28a"/><path d="M0 170 Q160 140 320 175 V220 H0Z" fill="#b4672d"/>`,
    `<rect width="320" height="220" fill="#8fb6d8"/><rect y="140" width="320" height="80" fill="#2c5a8a"/><g><rect x="40" y="100" width="60" height="40" fill="#c8562a"/><rect x="100" y="100" width="60" height="40" fill="#1f3566"/><rect x="160" y="100" width="60" height="40" fill="#cfd2d6"/><rect x="70" y="60" width="60" height="40" fill="#cfd2d6"/><rect x="130" y="60" width="60" height="40" fill="#c8562a"/></g><path d="M240 140 V30 H300 M270 30 V140" stroke="#1b1e24" stroke-width="6" fill="none"/>`
  ];
  const insThumb = $('[data-ins-thumb]');
  insThumb.innerHTML = THUMBS[0];
  $$('.ins__list a').forEach(a => a.addEventListener('pointerenter', () => { insThumb.innerHTML = THUMBS[+a.dataset.thumb]; }));

  const rings = $('.cta__rings');
  const ringEls = Array.from({ length: 16 }, () => { const c = document.createElementNS(SVGNS, 'circle'); rings.appendChild(c); return c; });
  let ringT = 0;
  const drawRings = () => ringEls.forEach((c, i) => { const r = ((i * 44 + ringT) % (16 * 44)) + 30; c.setAttribute('r', r); c.style.opacity = 1 - r / (16 * 44 + 30); });
  drawRings();

  $('.cta__form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#email'), msg = $('.cta__msg');
    msg.textContent = inp.checkValidity() && inp.value ? 'Thanks. A fleet engineer will be in touch.' : 'Please enter a valid work email.';
  });

  const MQ = [
    ['Ports & terminals', 'Cold chain', 'Construction', 'Retail distribution', 'Mining', 'Waste & recycling', 'E-commerce', 'Food & beverage'],
    ['Long-haul tractors', 'Regional tractors', 'Urban rigid trucks', 'Depot charging', 'Corridor charging', 'Fleet software', 'Route studies', 'Roadside service']
  ];
  const mqTrack = $('[data-mq]');
  const setMQ = i => { const items = MQ[i].map(t => `<span>${t}</span>`).join(''); mqTrack.innerHTML = items + items; };
  setMQ(0);
  $$('.ftr__tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.ftr__tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); setMQ(+b.dataset.tab);
  }));

  function drawStipple() {
    const cv = $('.ftr__stipple'), ctx = cv.getContext('2d'), d = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = '#111214';
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.floor(w * h / 14);
    for (let i = 0; i < n; i++) { const x = rnd() * w, y = Math.pow(rnd(), .55) * h; if (rnd() < y / h) ctx.fillRect(x, y, 1.2, 1.2); }
  }

  /* ------------------------------------------------------------------
     MEASURE + FRAME LOOP
     ------------------------------------------------------------------ */
  const secs = {};
  const fills = $$('[data-fill] .fill');
  const words = $$('[data-words]');
  function measure() {
    W = innerWidth; H = innerHeight;
    const top = el => el.getBoundingClientRect().top + scrollY;
    secs.hero = [top($('.hero')), $('.hero').offsetHeight];
    secs.journey = [top(J.sec), J.sec.offsetHeight];
    secs.why = [top(WY.sec), WY.sec.offsetHeight];
    secs.fills = fills.map(el => [top(el), el.offsetHeight]);
    secs.words = words.map(el => [top(el), el.offsetHeight]);
    globe.resize(); buildRoad(); resizeWhy();
    drawFlatMap($('.ftr__map'), { color: 'rgba(17,18,20,.55)', step: Math.max(4, $('.ftr__map').clientWidth / 110), r: 1, hubs: true });
    drawStipple();
  }
  const pin = ([t, h], y) => clamp((y - t) / Math.max(1, h - H));
  const view = ([t, h], y, a = .85, b = .4) => clamp((y + H * a - t) / (H * (a - b) + h * .6));

  function themeAt(y) {
    const els = document.elementsFromPoint(W / 2, y);
    for (const el of els) { if (el.closest('.hdr, .cursor, .menu')) continue; const s = el.closest('[data-theme]'); if (s) return s.dataset.theme; }
    return 'dark';
  }

  let sy = scrollY, prev = performance.now(), prevSy = sy;
  function frame(now) {
    const dt = Math.min(64, now - prev); prev = now;
    const target = scrollY;
    sy = reduced ? target : lerp(sy, target, .16);
    if (Math.abs(sy - target) < .4) sy = target;
    const dy = sy - prevSy; prevSy = sy;

    if (finePointer && !reduced) { cx = lerp(cx, mx, .22); cy = lerp(cy, my, .22); cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; }

    // hero
    const hp = pin(secs.hero, sy);
    root.style.setProperty('--hp', hp.toFixed(4));
    $('.hero__glow').style.setProperty('--glow', `${(100 - eOut(range(hp, .35, 1)) * 70).toFixed(2)}%`);
    if (!reduced) { globe.spin(dy * .0006); globe.update(now, hp, dt); }

    // text fills + word lighting
    if (!reduced) fills.forEach((el, i) => el.style.setProperty('--p', view(secs.fills[i], sy, .9, .45).toFixed(3)));
    if (!reduced) words.forEach((el, i) => {
      const k = view(secs.words[i], sy, .92, .5), ws = el.children, n = Math.floor(k * ws.length * 1.08);
      for (let j = 0; j < ws.length; j++) ws[j].classList.toggle('on', j < n);
    });

    // journey
    let theme = null;
    const jp = pin(secs.journey, sy);
    const inJ = sy >= secs.journey[0] - 2 && sy <= secs.journey[0] + secs.journey[1] - H;
    if (!reduced && sy > secs.journey[0] - H && sy < secs.journey[0] + secs.journey[1]) { const t = renderJourney(jp, dy, dt); if (inJ) theme = t; }
    // why
    const wq = pin(secs.why, sy);
    const inW = sy >= secs.why[0] - 2 && sy <= secs.why[0] + secs.why[1] - H;
    if (!reduced && sy > secs.why[0] - H && sy < secs.why[0] + secs.why[1]) { const t = renderWhy(wq, dt); if (inW) theme = t; }

    // CTA rings
    if (!reduced) { ringT += dt * .02; drawRings(); }

    // header
    hdr.classList.toggle('is-compact', target > H * .35);
    hdr.classList.toggle('on-light', (theme || themeAt(40)) === 'light');

    requestAnimationFrame(frame);
  }

  function staticRender() {
    root.classList.add('is-static');
    measure();
    globe.update(0, 0, 0);
    renderSide(.245, isMobile());
    J.svc.style.height = ''; J.svc.style.opacity = 1;
    J.road.style.opacity = 1;
    renderRoad(.84);
    renderWhy(.6, 0);
    fills.forEach(el => el.style.setProperty('--p', 1));
    $$('.w').forEach(w => w.classList.add('on'));
    $$('.wf').forEach(f => f.classList.add('on'));
  }

  /* ------------------------------------------------------------------
     PORTRAITS + NAVIGATION
     ------------------------------------------------------------------ */
  // Illustrated portraits by default. Set data-photo="assets/people/<name>.jpg" on a .tq__pic to use a licensed photo instead.
  $$('[data-portrait]').forEach(el => {
    el.innerHTML = VScene.PORTRAITS[el.dataset.portrait] || '';
    if (!el.dataset.photo) return;
    const img = new Image();
    img.alt = el.closest('.tq__who')?.querySelector('.tq__name')?.textContent || '';
    img.onload = () => { el.innerHTML = ''; el.appendChild(img); };
    img.src = el.dataset.photo;
  });
  const tqIO = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('is-active', en.isIntersecting)), { rootMargin: '-40% 0px -40% 0px' });
  $$('.tq').forEach(el => tqIO.observe(el));

  // Anchors inside pinned scenes can't be scrolled to directly, so each target maps to a scroll position.
  function targetY(hash) {
    const top = el => el.getBoundingClientRect().top + scrollY;
    const stat = root.classList.contains('is-static');
    const jAt = f => secs.journey[0] + (secs.journey[1] - H) * f;
    switch (hash) {
      case '#top': return 0;
      case '#about': return top($('.intro__body')) + (isMobile() ? H * .2 : H * .05);
      case '#lineup': return stat ? top(J.svc) : jAt(.43);
      case '#charge': return stat ? top(J.svc) : jAt(.53);
      case '#fleet': return stat ? top(J.road) : jAt(.84);
      default: { const el = hash.length > 1 && document.getElementById(hash.slice(1)); return el ? top(el) : null; }
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash === '#' ) { e.preventDefault(); return; }
    if (hash === '#main') return;
    const y = targetY(hash);
    if (y == null) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
    try { history.replaceState(null, '', hash); } catch (_) {}
  });
  const navLinks = $$('.hdr__nav a');
  function markCurrent(y) {
    const order = ['#about', '#lineup', '#charge', '#fleet', '#insights', '#contact'];
    let cur = null;
    order.forEach(h => { const t = targetY(h); if (t != null && y >= t - H * .4) cur = h; });
    if (y < H * .5) cur = null;
    navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === cur));
  }
  let markT = 0;
  addEventListener('scroll', () => { clearTimeout(markT); markT = setTimeout(() => markCurrent(scrollY), 80); }, { passive: true });
  if (location.hash) setTimeout(() => { const y = targetY(location.hash); if (y != null) scrollTo(0, y); }, 300);

  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measure(); if (reduced) staticRender(); }, 120); }, { passive: true });
  addEventListener('load', () => { measure(); if (reduced) staticRender(); });
  document.fonts?.ready.then(() => measure());
  mqReduce.addEventListener?.('change', e => { reduced = e.matches; if (reduced) { finishLoading(); staticRender(); } else location.reload(); });

  measure();
  if (reduced) staticRender();
  requestAnimationFrame(frame);
})();
