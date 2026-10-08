// Cozy Jigsaw — the puzzle itself: board, loose pieces, the tray of pieces at the bottom, dragging,
// snapping with a click and a sparkle, wrong drops that stay visibly loose, zoom, hints and saving.
//
//   const pz = CJ.Puzzle(host, { image, n, seed, saved, onChange(state), onPlace(piece), onDone() })
//   pz.hint() → true when a piece was placed · pz.peek(on) · pz.ghost(on) · pz.state() · pz.destroy()
//
// Board coordinates run from 0 to B (1000) across the square board; the photo is cropped to a square.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  const B = 1000;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  CJ.Puzzle = function (host, opts) {
    const { image, n } = opts;
    const cut = CJ.cut(n, B, opts.seed || 7);
    const s = cut.s, M = s * 0.3; // piece cell size, room for tabs around it
    const P = cut.pieces;
    const dpr = Math.min(3, root.devicePixelRatio || 1);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const imgX = (image.naturalWidth - side) / 2, imgY = (image.naturalHeight - side) / 2, k = side / B;

    // ---------------------------------------------------------------- DOM
    host.classList.add('pz');
    host.innerHTML = `<div class="pz-area"><canvas class="pz-board"></canvas></div>
      <div class="pz-filters" role="tablist"></div>
      <div class="pz-tray"><div class="pz-strip"></div></div>
      <canvas class="pz-drag"></canvas>`;
    const area = host.querySelector('.pz-area'), cv = host.querySelector('.pz-board'), g = cv.getContext('2d');
    const dragCv = host.querySelector('.pz-drag'), dg = dragCv.getContext('2d');
    const tray = host.querySelector('.pz-tray'), strip = host.querySelector('.pz-strip'), filters = host.querySelector('.pz-filters');
    const hitCtx = document.createElement('canvas').getContext('2d');

    // ---------------------------------------------------------------- state
    const saved = opts.saved || {};
    P.forEach((p) => { p.state = 'tray'; p.lx = 0; p.ly = 0; p.z = 0; });
    (saved.placed || []).forEach((id) => { if (P[id]) P[id].state = 'placed'; });
    Object.entries(saved.loose || {}).forEach(([id, [x, y]]) => { const p = P[id]; if (p && p.state === 'tray') { p.state = 'loose'; p.lx = x; p.ly = y; } });
    let zTop = 1, done = false, peekOn = false, ghostOn = saved.ghost != null ? saved.ghost : true, filter = 'edge';
    let W = 0, H = 0, base = 1, zoom = 1, ox = 0, oy = 0;
    let anims = [], sparks = [], drag = null, raf = 0, finishT = 0;
    const order = P.map((p) => p.id);
    { const rnd = CJ.rng((opts.seed || 7) * 31 + n); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }

    // ---------------------------------------------------------------- piece pictures
    // Each piece is drawn once into its own canvas: the photo clipped to the piece, a soft bevel and an outline.
    let R = 1;
    function sprite(p) {
      const size = Math.ceil((s + 2 * M) * R);
      const c = document.createElement('canvas'); c.width = c.height = size;
      const x = c.getContext('2d');
      x.scale(R, R); x.translate(M, M);
      x.save(); x.clip(p.path);
      // Source rectangle of the photo under this piece (clamped to the photo).
      let bx0 = Math.max(0, p.x - M), by0 = Math.max(0, p.y - M), bx1 = Math.min(B, p.x + s + M), by1 = Math.min(B, p.y + s + M);
      x.drawImage(image, imgX + bx0 * k, imgY + by0 * k, (bx1 - bx0) * k, (by1 - by0) * k, bx0 - p.x, by0 - p.y, bx1 - bx0, by1 - by0);
      const lw = s * 0.035;
      x.lineWidth = lw; x.strokeStyle = 'rgba(255,255,255,.55)'; x.save(); x.translate(-lw * 0.35, -lw * 0.35); x.stroke(p.path); x.restore();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.save(); x.translate(lw * 0.35, lw * 0.35); x.stroke(p.path); x.restore();
      x.restore();
      x.lineWidth = s * 0.012; x.strokeStyle = 'rgba(40,30,20,.35)'; x.stroke(p.path);
      p.img = c;
    }
    // Main colour of each piece, for the colour filters.
    function colours() {
      const m = document.createElement('canvas'), q = 4; m.width = m.height = n * q;
      const x = m.getContext('2d'); x.drawImage(image, imgX, imgY, side, side, 0, 0, n * q, n * q);
      const d = x.getImageData(0, 0, n * q, n * q).data;
      P.forEach((p) => {
        let r = 0, gg = 0, b = 0, cnt = 0;
        for (let yy = p.r * q; yy < p.r * q + q; yy++) for (let xx = p.c * q; xx < p.c * q + q; xx++) { const i = (yy * n * q + xx) * 4; r += d[i]; gg += d[i + 1]; b += d[i + 2]; cnt++; }
        r /= cnt; gg /= cnt; b /= cnt;
        const mx = Math.max(r, gg, b) / 255, mn = Math.min(r, gg, b) / 255, l = (mx + mn) / 2, sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
        let h = 0;
        if (mx !== mn) { const R_ = r / 255, G_ = gg / 255, B_ = b / 255, dd = mx - mn; h = mx === R_ ? ((G_ - B_) / dd) % 6 : mx === G_ ? (B_ - R_) / dd + 2 : (R_ - G_) / dd + 4; h = (h * 60 + 360) % 360; }
        p.rgb = `rgb(${r | 0},${gg | 0},${b | 0})`;
        p.group = l < 0.22 ? 'dark' : sat < 0.16 ? (l > 0.62 ? 'light' : 'grey') : h >= 170 && h < 265 ? 'blue' : h >= 65 && h < 170 ? 'green' : h >= 265 && h < 335 ? 'purple' : 'warm';
      });
    }

    // ---------------------------------------------------------------- layout
    function layout() {
      const r = area.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const hr = host.getBoundingClientRect();
      dragCv.width = Math.round(hr.width * dpr); dragCv.height = Math.round(hr.height * dpr); dragCv.style.width = hr.width + 'px'; dragCv.style.height = hr.height + 'px';
      const pad = 14;
      base = (Math.min(W, H) - 2 * pad) / B;
      clampView();
      const want = Math.min(k, base * dpr * 2.4);
      if (Math.abs(want - R) / R > 0.15 || !P[0].img) { R = want; P.forEach(sprite); buildTray(); }
      draw();
    }
    function clampView() {
      const bw = B * base * zoom;
      const cx = (W - B * base) / 2, cy = (H - B * base) / 2;
      if (zoom === 1) { ox = cx; oy = cy; return; }
      ox = Math.min(14, Math.max(W - bw - 14, ox)); oy = Math.min(14, Math.max(H - bw - 14, oy));
    }
    const sc = () => base * zoom;
    const toBoard = (x, y) => ({ x: (x - ox) / sc(), y: (y - oy) / sc() });
    const areaPt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    // ---------------------------------------------------------------- drawing
    function drawPiece(x, p, bx, by, scale, lift) {
      const z = scale;
      if (lift) { x.shadowColor = 'rgba(60,40,20,.35)'; x.shadowBlur = lift * z * 0.08 * dpr; x.shadowOffsetY = lift * z * 0.03 * dpr; }
      x.drawImage(p.img, (bx - M) * z, (by - M) * z, (s + 2 * M) * z, (s + 2 * M) * z);
      if (lift) { x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0; }
    }
    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.save(); g.translate(ox, oy);
      const z = sc();
      // Board: a soft card with the faint picture (ghost) on it.
      g.shadowColor = 'rgba(80,60,40,.12)'; g.shadowBlur = 18; g.shadowOffsetY = 4;
      g.fillStyle = '#efe9df'; g.beginPath(); g.roundRect(-6, -6, B * z + 12, B * z + 12, 14); g.fill();
      g.shadowColor = 'transparent';
      if (ghostOn && !done) { g.globalAlpha = 0.16; g.drawImage(image, imgX, imgY, side, side, 0, 0, B * z, B * z); g.globalAlpha = 1; }
      for (const p of P) if (p.state === 'placed') drawPiece(g, p, p.x, p.y, z, 0);
      // The finished picture without seams, and a shine sweeping across it.
      if (done) {
        const t = Math.min(1, (performance.now() - finishT) / 700);
        g.globalAlpha = ease(t); g.drawImage(image, imgX, imgY, side, side, 0, 0, B * z, B * z); g.globalAlpha = 1;
        const st = (performance.now() - finishT - 300) / 1200;
        if (st > 0 && st < 1) {
          const gx = (st * 1.6 - 0.3) * B * z, gr = g.createLinearGradient(gx - 80, 0, gx + 80, B * z * 0.4);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.save(); g.beginPath(); g.rect(0, 0, B * z, B * z); g.clip(); g.fillStyle = gr; g.fillRect(0, 0, B * z, B * z); g.restore();
        }
      }
      if (peekOn) { g.drawImage(image, imgX, imgY, side, side, 0, 0, B * z, B * z); }
      // Loose pieces, lifted with a shadow so it's clear they are not in place.
      const loose = P.filter((p) => p.state === 'loose' && p !== (drag && drag.p)).sort((a, b) => a.z - b.z);
      if (!peekOn) for (const p of loose) drawPiece(g, p, p.lx, p.ly, z, 3);
      // Glow around a piece that just clicked in.
      for (const a of anims) if (a.glow) {
        const t = (performance.now() - a.t0) / a.ms;
        g.save(); g.translate(a.p.x * z, a.p.y * z); g.scale(z, z);
        g.lineWidth = s * 0.06; g.strokeStyle = `rgba(255,236,170,${0.9 * (1 - t)})`; g.stroke(a.p.path); g.restore();
      }
      for (const sp of sparks) {
        const t = (performance.now() - sp.t0) / sp.ms; if (t < 0) continue;
        const r = (1 - t) * sp.r * z;
        g.fillStyle = `rgba(255,${210 + (sp.v * 40) | 0},120,${1 - t})`;
        g.beginPath(); g.arc((sp.x + sp.dx * ease(t)) * z, (sp.y + sp.dy * ease(t)) * z, Math.max(0.5, r), 0, Math.PI * 2); g.fill();
      }
      g.restore();
      drawDrag();
    }
    function drawDrag() {
      dg.setTransform(dpr, 0, 0, dpr, 0, 0);
      dg.clearRect(0, 0, dragCv.width, dragCv.height);
      const fly = anims.filter((a) => a.fly);
      if (!drag && !fly.length) return;
      const hr = host.getBoundingClientRect(), ar = cv.getBoundingClientRect();
      dg.save(); dg.translate(ar.left - hr.left + ox, ar.top - hr.top + oy);
      if (drag) drawPiece(dg, drag.p, drag.bx, drag.by, sc() * 1.04, 8);
      for (const a of fly) { const t = ease(Math.min(1, (performance.now() - a.t0) / a.ms)); drawPiece(dg, a.p, a.fx + (a.p.x - a.fx) * t, a.fy + (a.p.y - a.fy) * t, sc(), 6 * (1 - t)); }
      dg.restore();
    }
    function tick() {
      raf = 0;
      const now = performance.now();
      anims = anims.filter((a) => { if (now - a.t0 >= a.ms) { a.end && a.end(); return false; } return true; });
      sparks = sparks.filter((sp) => now - sp.t0 < sp.ms);
      draw();
      if (anims.length || sparks.length || (done && now - finishT < 1600)) raf = requestAnimationFrame(tick);
    }
    const animate = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // ---------------------------------------------------------------- tray
    const GROUPS = [['edge', 'Edges'], ['all', 'All'], ['blue', ''], ['green', ''], ['warm', ''], ['purple', ''], ['light', ''], ['grey', ''], ['dark', '']];
    function buildTray() {
      strip.innerHTML = '';
      for (const id of order) {
        const p = P[id], el = document.createElement('canvas'), sz = 78;
        el.width = el.height = sz * dpr; el.style.width = el.style.height = sz + 'px';
        el.className = 'pz-item'; el.dataset.id = id;
        el.getContext('2d').drawImage(p.img, 0, 0, sz * dpr, sz * dpr);
        el.addEventListener('pointerdown', (e) => trayDown(e, p));
        p.el = el; strip.appendChild(el);
      }
      refreshTray();
    }
    function groupColour(gid) { const ps = P.filter((p) => p.group === gid); return ps.length ? ps[Math.floor(ps.length / 2)].rgb : '#ccc'; }
    function refreshTray() {
      const left = P.filter((p) => p.state === 'tray');
      if (filter === 'edge' && !left.some((p) => p.edge)) filter = 'all';
      if (!['edge', 'all'].includes(filter) && !left.some((p) => p.group === filter)) filter = 'all';
      filters.innerHTML = GROUPS.filter(([id]) => id === 'all' || (id === 'edge' ? left.some((p) => p.edge) : left.some((p) => p.group === id)))
        .map(([id, label]) => `<button class="pz-chip${filter === id ? ' on' : ''}" data-f="${id}" aria-label="${label || id + ' pieces'}">${label || `<i style="background:${groupColour(id)}"></i>`}</button>`).join('');
      for (const p of P) if (p.el) p.el.hidden = p.state !== 'tray' || !(filter === 'all' || (filter === 'edge' ? p.edge : p.group === filter));
    }
    filters.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; refreshTray(); strip.scrollLeft = 0; });

    // ---------------------------------------------------------------- input
    const pointers = new Map();
    let pinch = null, pan = null, trayStart = null;

    function startDrag(p, e, from) {
      CJ.Audio.init();
      const pt = areaPt(e), cell = s * sc();
      // From the tray the piece sits just above the finger, so the finger doesn't hide it.
      const off = from === 'tray' ? { x: -(s / 2), y: -(s / 2) - Math.min(70, cell * 0.9) / sc() } : { x: p.lx - toBoard(pt.x, pt.y).x, y: p.ly - toBoard(pt.x, pt.y).y };
      const b = toBoard(pt.x, pt.y);
      drag = { p, from, off, bx: b.x + off.x, by: b.y + off.y, id: e.pointerId };
      if (from === 'tray') { p.state = 'dragging'; refreshTray(); }
      else p.state = 'dragging';
      // The finger is followed on the whole page (the tray item it started on disappears).
      const mv = (ev) => { if (drag && ev.pointerId === drag.id) moveDrag(ev); };
      const fin = (ev) => { if (!drag || ev.pointerId !== drag.id) return; root.removeEventListener('pointermove', mv); root.removeEventListener('pointerup', fin); root.removeEventListener('pointercancel', fin); endDragAt(ev); };
      root.addEventListener('pointermove', mv); root.addEventListener('pointerup', fin); root.addEventListener('pointercancel', fin);
      draw();
    }
    function moveDrag(e) {
      const pt = areaPt(e), b = toBoard(pt.x, pt.y);
      drag.bx = b.x + drag.off.x; drag.by = b.y + drag.off.y;
      drawDrag();
    }
    function endDrag(e) {
      const p = drag.p, tr = tray.getBoundingClientRect();
      const overTray = e.clientY > tr.top - 8;
      drag = null;
      if (overTray) { p.state = 'tray'; refreshTray(); draw(); changed(); return; }
      if (Math.hypot(p.x - drag_bx, p.y - drag_by) < s * 0.3) return place(p, drag_bx, drag_by);
      // Wrong place: it stays loose. Right on top of another slot, it is nudged off so the gap shows.
      let x = drag_bx, y = drag_by;
      const cc = Math.round(x / s), rr = Math.round(y / s);
      if (cc >= 0 && rr >= 0 && cc < n && rr < n && Math.hypot(x - cc * s, y - rr * s) < s * 0.3) {
        x = cc * s + s * 0.16; y = rr * s - s * 0.16; CJ.Audio.nope();
      }
      // Keep it on screen.
      const tl = toBoard(0, 0), br = toBoard(W, H);
      p.lx = Math.min(br.x - s * 0.6, Math.max(tl.x - s * 0.4, x)); p.ly = Math.min(br.y - s * 0.6, Math.max(tl.y - s * 0.4, y));
      p.state = 'loose'; p.z = ++zTop;
      draw(); changed();
    }
    let drag_bx = 0, drag_by = 0;
    const endDragAt = (e) => { drag_bx = drag.bx; drag_by = drag.by; endDrag(e); };

    function place(p, fx, fy, fly) {
      p.state = 'snapping';
      const finish = () => {
        p.state = 'placed'; refreshTray();
        CJ.Audio.click(); CJ.Audio.sparkle(); CJ.haptic();
        const now = performance.now();
        anims.push({ glow: true, p, t0: now, ms: 450 });
        for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, d = s * (0.45 + Math.random() * 0.4); sparks.push({ x: p.x + s / 2, y: p.y + s / 2, dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: s * (0.04 + Math.random() * 0.04), v: Math.random(), t0: now + Math.random() * 60, ms: 520 }); }
        opts.onPlace && opts.onPlace(p);
        changed();
        if (P.every((q) => q.state === 'placed')) finishAll();
        animate();
      };
      anims.push({ fly: true, p, fx, fy, t0: performance.now(), ms: fly || 110, end: finish });
      animate();
    }
    function finishAll() {
      done = true; finishT = performance.now();
      setTimeout(() => CJ.Audio.done(), 250);
      animate();
      setTimeout(() => opts.onDone && opts.onDone(), 1700);
    }

    function hitLoose(pt) {
      const b = toBoard(pt.x, pt.y);
      const loose = P.filter((p) => p.state === 'loose').sort((a, c) => c.z - a.z);
      return loose.find((p) => hitCtx.isPointInPath(p.path, b.x - p.lx, b.y - p.ly)) || null;
    }
    cv.addEventListener('pointerdown', (e) => {
      if (done) return;
      cv.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, areaPt(e));
      if (pointers.size === 2) {
        if (drag) { drag.p.state = drag.from === 'tray' ? 'tray' : 'loose'; drag = null; refreshTray(); }
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, ox, oy }; pan = null; return;
      }
      const pt = areaPt(e), p = hitLoose(pt);
      if (p) return startDrag(p, e, 'board');
      if (zoom > 1) pan = { x: pt.x, y: pt.y, ox, oy };
    });
    cv.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, areaPt(e));
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        const nz = Math.min(4, Math.max(1, pinch.z * d / pinch.d));
        // Keep the point between the fingers still while zooming.
        const bx = (pinch.mid.x - pinch.ox) / (base * pinch.z), by = (pinch.mid.y - pinch.oy) / (base * pinch.z);
        zoom = nz; ox = pinch.mid.x - bx * base * zoom; oy = pinch.mid.y - by * base * zoom; clampView(); draw(); return;
      }
      if (drag) return;
      if (pan) { const pt = areaPt(e); ox = pan.ox + pt.x - pan.x; oy = pan.oy + pt.y - pan.y; clampView(); draw(); }
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pinch && pointers.size < 2) { pinch = null; return; }
      pan = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const pt = areaPt(e), bx = (pt.x - ox) / sc(), by = (pt.y - oy) / sc();
      zoom = Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      ox = pt.x - bx * sc(); oy = pt.y - by * sc(); clampView(); draw();
    }, { passive: false });

    // From the tray: a mostly upward move picks the piece up; sideways moves scroll the tray.
    function trayDown(e, p) {
      if (done) return;
      trayStart = { x: e.clientX, y: e.clientY, p, id: e.pointerId, el: e.currentTarget };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    strip.addEventListener('pointermove', (e) => {
      if (drag) return;
      if (!trayStart || trayStart.id !== e.pointerId) return;
      const dx = e.clientX - trayStart.x, dy = e.clientY - trayStart.y;
      if (-dy > 10 && Math.abs(dy) > Math.abs(dx) * 0.8) { const p = trayStart.p; trayStart = null; startDrag(p, e, 'tray'); moveDrag(e); }
      else if (Math.abs(dx) > 12) trayStart = null;
    });
    const trayUp = () => { trayStart = null; };
    strip.addEventListener('pointerup', trayUp); strip.addEventListener('pointercancel', trayUp);

    // ---------------------------------------------------------------- saving
    function state() {
      const loose = {};
      P.forEach((p) => { if (p.state === 'loose') loose[p.id] = [Math.round(p.lx), Math.round(p.ly)]; });
      return { placed: P.filter((p) => p.state === 'placed' || p.state === 'snapping').map((p) => p.id), loose, ghost: ghostOn, total: P.length };
    }
    function changed() { opts.onChange && opts.onChange(state()); }

    // ---------------------------------------------------------------- hints
    // Places one good next piece: an edge piece while the border isn't finished, preferring one that
    // touches the pieces already in place.
    function hint() {
      if (done || drag) return false;
      const left = P.filter((p) => p.state === 'tray' || p.state === 'loose');
      if (!left.length) return false;
      const placed = new Set(P.filter((p) => p.state === 'placed').map((p) => p.id));
      const touches = (p) => [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dr, dc]) => { const r = p.r + dr, c = p.c + dc; return r >= 0 && c >= 0 && r < n && c < n && placed.has(r * n + c); });
      const edgesLeft = left.filter((p) => p.edge);
      const pool = edgesLeft.length ? edgesLeft : left;
      const best = pool.filter(touches);
      const p = (best.length ? best : pool)[0];
      let fx, fy;
      if (p.state === 'loose') { fx = p.lx; fy = p.ly; }
      else {
        const r = p.el.getBoundingClientRect(), a = cv.getBoundingClientRect();
        const vis = r.width > 0 && r.right > 0 && r.left < innerWidth;
        const b = vis ? toBoard(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top) : toBoard(W / 2, H + 60);
        fx = b.x - s / 2; fy = b.y - s / 2;
      }
      p.state = 'flying'; refreshTray();
      place(p, fx, fy, 650);
      return true;
    }

    // ---------------------------------------------------------------- start
    colours();
    const ro = new ResizeObserver(() => layout());
    ro.observe(host);
    layout();
    if (P.every((p) => p.state === 'placed')) { done = true; finishT = performance.now() - 2000; draw(); }

    return {
      hint,
      peek(on) { peekOn = !!on; draw(); },
      ghost(on) { ghostOn = on == null ? !ghostOn : !!on; draw(); changed(); return ghostOn; },
      state,
      get done() { return done; },
      get pieces() { return P; },
      // For tests: board point → page point.
      pagePoint(bx, by) { const a = cv.getBoundingClientRect(); return { x: a.left + ox + bx * sc(), y: a.top + oy + by * sc() }; },
      destroy() { ro.disconnect(); cancelAnimationFrame(raf); host.innerHTML = ''; host.classList.remove('pz'); },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
