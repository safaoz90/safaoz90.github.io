// Cozy Jigsaw — the game around the puzzle: home (daily puzzle + seasons), a season's levels,
// playing a level, hints, the shop and settings.
(function (root) {
  const CJ = root.CJ, St = CJ.State, R = CJ.RULES;
  const app = document.getElementById('app');
  const D = St.data;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const season = (id) => CJ.SEASONS.find((s) => s.id === id);
  const product = (id) => R.PRODUCTS.find((p) => p.id === id);
  let pz = null, cur = null; // current puzzle and what it is ({ kind: 'level' | 'daily', ... })

  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    ghost: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 15l5-5 4 4 3-3 4 4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    film: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/></svg>',
  };
  const hintChip = () => `<button class="chip-hints" data-act="shop" aria-label="Your hints">${I.bulb}<b>${D.hints}</b></button>`;

  // ---------------------------------------------------------------- music
  // Season sound and music play only while a puzzle is open; menus are quiet.
  const music = (sid) => { if (D.music && sid && cur && cur.key) CJ.Ambience.play(sid); else CJ.Ambience.stop(); };
  let started = false;
  document.addEventListener('pointerdown', () => { if (started) return; started = true; CJ.Audio.init(); if (cur && cur.key) music(cur.season.id); }, { once: true });

  // ---------------------------------------------------------------- screens
  function leave() { if (pz) { pz.destroy(); pz = null; } closeSheet(); }

  function home() {
    leave(); cur = null; music(null);
    const d = St.daily(), si = St.streakInfo(), done = St.dailyDone();
    const week = R.DAILY_REWARD.map((r, i) => `<li class="${i < si.inWeek ? 'won' : ''}${!done && i === si.inWeek % 7 ? ' today' : ''}"><i>${i < si.inWeek ? I.check : '+' + r}</i></li>`).join('');
    const seasons = CJ.SEASONS.filter(St.visible).map((s) => {
      const n = St.doneCount(s.id), owned = St.ownsSeason(s.id);
      return `<button class="season-card" data-act="season" data-id="${s.id}" style="--tint:${s.color}">
        <img src="${s.levels[0].tile}" alt="">
        <div><h3>${s.name}${s.special ? ' <span class="pill">Limited time</span>' : ''}</h3><p>${s.tag}</p>
        <div class="bar-prog"><span style="width:${(n / s.levels.length) * 100}%"></span></div><small>${n} / ${s.levels.length}${owned ? ' · all open' : ''}</small></div></button>`;
    }).join('');
    app.innerHTML = `
      <header class="top"><h1>Cozy Jigsaw</h1><div class="top-r">${hintChip()}<button class="ib" data-act="settings" aria-label="Settings">${I.gear}</button></div></header>
      <div class="scroll">
        <section class="daily-card${done ? ' solved' : ''}">
          <img src="${d.tile}" alt="">
          <div class="daily-body"><p class="eyebrow">${I.cal} Daily puzzle · ${d.pieces} pieces</p>
            <h2>${done ? 'Solved today!' : 'Today\'s puzzle'}</h2>
            <p class="muted">${done ? 'Come back tomorrow for a new one.' : `Solve it for <b>+${si.nextReward} hint${si.nextReward > 1 ? 's' : ''}</b>. 7 days in a row: +10.`}</p>
            ${done ? '' : '<button class="btn" data-act="daily">Play</button>'}</div>
          <ol class="week" aria-label="Daily streak">${week}</ol>
        </section>
        <h2 class="sec">Seasons</h2>
        <div class="seasons">${seasons}</div>
      </div>`;
  }

  function seasonScreen(sid) {
    leave();
    const s = season(sid), owned = St.ownsSeason(sid), p = product(s.product);
    cur = { season: s }; music(null);
    const tiles = s.levels.map((l) => {
      const done = St.isDone(sid, l.n), open = St.isOpen(sid, l.n), started = !!St.board(`${sid}-${l.n}`);
      return `<button class="tile${done ? ' done' : open ? ' open' : ' locked'}" data-act="level" data-n="${l.n}" aria-label="Level ${l.n}, ${l.pieces} pieces${done ? ', solved' : open ? '' : ', locked'}">
        <img src="${l.tile}" alt="" loading="lazy">
        <span class="tn">${l.n}</span>${done ? `<span class="tc">${I.check}</span>` : open ? `<span class="tp">${started ? 'Continue' : l.pieces + ' pcs'}</span>` : `<span class="tl">${I.lock}<small>${l.pieces}</small></span>`}</button>`;
    }).join('');
    app.innerHTML = `
      <header class="top"><button class="ib" data-act="home" aria-label="Back">${I.back}</button><div class="grow"><h1>${s.name}</h1><p class="muted">${St.doneCount(sid)} of ${s.levels.length} solved</p></div>${hintChip()}</header>
      <div class="scroll" style="--tint:${s.color}">
        ${owned ? '' : `<button class="unlock-all" data-act="buy" data-product="${s.product}"><span>${s.special ? `Open all ${s.levels.length} Halloween puzzles` : `Open all ${s.levels.length} levels now`}</span><b>${p.price}</b></button>`}
        <div class="tiles">${tiles}</div>
      </div>`;
    const nx = St.next(sid); if (nx) { const t = app.querySelector(`.tile[data-n="${nx.n}"]`); if (t) t.scrollIntoView({ block: 'center' }); }
  }

  function playScreen(spec) {
    leave();
    cur = spec; music(spec.season.id);
    const key = spec.key, title = spec.kind === 'daily' ? 'Daily puzzle' : `${spec.season.name} · ${spec.n}`;
    app.innerHTML = `
      <header class="bar">
        <button class="ib" data-act="${spec.kind === 'daily' ? 'home' : 'season'}" data-id="${spec.season.id}" aria-label="Back">${I.back}</button>
        <div class="grow"><div class="title">${esc(title)}</div><div class="sub"><span class="prog"></span></div></div>
        <button class="ib ghost-b${D.ghost ? ' on' : ''}" aria-label="Faint picture on the board">${I.ghost}</button>
        <button class="ib eye-b" aria-label="Hold to see the picture">${I.eye}</button>
        <button class="ib hint-b" data-act="hint" aria-label="Hint">${I.bulb}<span class="badge"></span></button>
      </header>
      <section class="game"><p class="loading">Loading the picture…</p></section>`;
    const host = app.querySelector('.game'), prog = app.querySelector('.prog');
    const show = (st) => {
      prog.textContent = `${st.placed.length} / ${st.total}`;
      refreshBadge();
    };
    const img = new Image();
    img.onload = () => {
      if (cur !== spec) return;
      host.innerHTML = '';
      const saved = Object.assign({}, St.board(key) || {}, { ghost: D.ghost });
      pz = CJ.Puzzle(host, {
        image: img, n: Math.round(Math.sqrt(spec.pieces)), seed: spec.seed, saved,
        onChange(st) { show(st); if (!pz || !pz.done) St.setBoard(key, st); },
        onDone() { finished(spec); },
      });
      show(pz.state());
    };
    img.onerror = () => { host.innerHTML = '<p class="loading">This picture could not be loaded.</p>'; };
    img.src = spec.img;
    const eye = app.querySelector('.eye-b');
    eye.onpointerdown = () => { pz && pz.peek(true); eye.classList.add('on'); };
    eye.onpointerup = eye.onpointerleave = eye.onpointercancel = () => { pz && pz.peek(false); eye.classList.remove('on'); };
    app.querySelector('.ghost-b').onclick = (e) => { if (!pz) return; D.ghost = pz.ghost(); St.save(); e.currentTarget.classList.toggle('on', D.ghost); };
  }

  function finished(spec) {
    let reward = 0;
    if (spec.kind === 'daily') reward = St.finishDaily(spec.day); else St.finish(spec.key);
    const s = spec.season, nx = spec.kind === 'level' ? s.levels.find((l) => l.n === spec.n + 1) : null;
    const nextOpen = nx && St.isOpen(s.id, nx.n);
    // The card comes after the finish shine; skip it if the player has already left this puzzle.
    setTimeout(() => {
      const game = app.querySelector('.game');
      if (cur !== spec || !game) return;
      game.appendChild(card);
    }, 1700);
    const card = document.createElement('div');
    card.className = 'done-card';
    card.innerHTML = `<h2>${spec.kind === 'daily' ? 'Daily puzzle solved!' : 'Beautiful!'}</h2>
      ${reward ? `<p class="reward">${I.bulb} +${reward} hint${reward > 1 ? 's' : ''}${St.streakInfo().inWeek === 7 ? ' · a whole week!' : ''}</p>` : ''}
      <p class="credit">Photo: ${esc(spec.by || '')} · ${esc(spec.src || '')}</p>
      <div class="row">
        <button class="btn soft" data-act="${spec.kind === 'daily' ? 'home' : 'season'}" data-id="${s.id}">${spec.kind === 'daily' ? 'Home' : s.name}</button>
        ${nx ? (nextOpen ? `<button class="btn" data-act="level" data-season="${s.id}" data-n="${nx.n}">Next level</button>` : `<button class="btn" data-act="buy" data-product="${s.product}">Open all · ${product(s.product).price}</button>`) : ''}
      </div>`;
  }

  function openLevel(sid, n) {
    const s = season(sid), l = s.levels.find((x) => x.n === n);
    if (!St.isOpen(sid, n)) return sheetLocked(s, l);
    playScreen({ kind: 'level', key: `${sid}-${n}`, season: s, n, img: l.img, pieces: l.pieces, by: l.by, src: l.src, seed: (CJ.SEASONS.indexOf(s) + 1) * 1000 + n });
  }
  function openDaily() {
    const d = St.daily();
    playScreen({ kind: 'daily', key: d.key, day: d.day, season: d.season, img: d.img, pieces: d.pieces, by: d.by, src: d.src, seed: 77 + d.day.split('-').reduce((a, b) => a * 31 + +b, 0) % 100000 });
  }

  // ---------------------------------------------------------------- sheets
  const layer = document.createElement('div'); layer.className = 'layer'; document.body.appendChild(layer);
  function openSheet(html, cls = '') {
    layer.innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet ${cls}" role="dialog" aria-modal="true"><button class="ib x" data-act="close" aria-label="Close">✕</button>${html}</div>`;
    requestAnimationFrame(() => layer.classList.add('open'));
  }
  function closeSheet() { layer.classList.remove('open'); layer.innerHTML = ''; }

  function sheetLocked(s, l) {
    const p = product(s.product), prev = s.levels.find((x) => x.n === l.n - 1);
    openSheet(`<h2>Level ${l.n} is locked</h2>
      <p class="muted">${s.special ? `Halloween's first puzzle is free to try. Open all ${s.levels.length} to play on.` : `Solve level ${prev.n} to open it, or open all of ${s.name} now.`}</p>
      <button class="btn big" data-act="buy" data-product="${p.id}">Open all of ${s.name} · ${p.price}</button>
      ${s.special ? '' : `<button class="btn soft big" data-act="level" data-season="${s.id}" data-n="${(St.next(s.id) || prev).n}">Play level ${(St.next(s.id) || prev).n}</button>`}`);
  }
  function sheetHint() {
    openSheet(`<h2>Need a hint?</h2><p class="muted">The 3 free hints for this puzzle are used.</p>
      ${D.hints > 0 ? `<button class="btn big" data-act="hint-own">${I.bulb} Use one of my hints (${D.hints})</button>` : ''}
      <button class="btn ${D.hints > 0 ? 'soft ' : ''}big" data-act="hint-video">${I.film} Watch a short video for a hint</button>
      <button class="btn soft big" data-act="shop">Get more hints</button>`, 'hint-sheet');
  }
  function sheetShop() {
    const seasons = CJ.SEASONS.filter((s) => St.visible(s)).map((s) => { const p = product(s.product); return `<div class="offer"><img src="${s.levels[0].tile}" alt=""><p><b>${s.name}</b><br><span class="muted">All ${s.levels.length} levels, kept forever</span></p>${St.owns(p.id) ? '<span class="owned">Yours</span>' : `<button class="btn sm" data-act="buy" data-product="${p.id}">${p.price}</button>`}</div>`; }).join('');
    const hints = R.PRODUCTS.filter((p) => p.kind === 'hints').map((p) => `<button class="pack" data-act="buy" data-product="${p.id}"><span>${I.bulb}</span><b>${p.hints}</b><small>hints</small><em>${p.price}</em></button>`).join('');
    openSheet(`<h2>Shop</h2><p class="muted">You have <b>${D.hints}</b> hints. Every puzzle also has 3 free ones.</p>
      <div class="packs">${hints}</div><h3>Seasons</h3>${seasons}
      <button class="btn soft" data-act="restore">Restore purchases</button>
      <p class="fine">${CJ.Platform.native ? 'Paid once through your Apple Account; no subscriptions.' : 'Purchases are simulated in this browser version.'}</p>`, 'shop');
  }
  function sheetSettings() {
    const sw = (k, label) => `<label class="set-row"><span>${label}</span><input type="checkbox" class="switch" data-set="${k}"${D[k] ? ' checked' : ''}></label>`;
    openSheet(`<h2>Settings</h2>${sw('music', 'Season sounds')}${sw('sound', 'Click sounds')}
      <button class="btn soft" data-act="restore">Restore purchases</button>
      <p class="links"><a href="${CJ.Platform.site}/cozy-privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="${CJ.Platform.site}/cozy-terms.html" target="_blank" rel="noopener">Terms</a> · <a href="${CJ.Platform.site}/cozy-credits.html" target="_blank" rel="noopener">Photo credits</a></p>
      <p class="fine">Photos from Unsplash and Pixabay, by the photographers credited after each puzzle.</p>`, 'settings');
    layer.querySelectorAll('[data-set]').forEach((el) => { el.onchange = () => { D[el.dataset.set] = el.checked; St.save(); CJ.Audio.on = D.sound; if (el.dataset.set === 'music') music(cur && cur.season ? cur.season.id : null); }; });
  }
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.classList.add('out'), 2400); setTimeout(() => el.remove(), 2900); }

  // ---------------------------------------------------------------- actions
  const ACT = {
    home, close: closeSheet,
    season: (b) => seasonScreen(b.dataset.id),
    level: (b) => { closeSheet(); openLevel(b.dataset.season || cur.season.id, +b.dataset.n); },
    daily: openDaily,
    settings: sheetSettings,
    shop: sheetShop,
    // A hint is only spent when a piece really moves (not while a piece is being dragged, not when done).
    hint() {
      if (!pz || pz.done || !pz.canHint()) return;
      if (St.freeLeft(cur.key) > 0 || D.hints > 0) { if (pz.hint()) St.useHint(cur.key); refreshBadge(); return; }
      sheetHint();
    },
    'hint-own'() { closeSheet(); if (pz && pz.canHint() && D.hints > 0 && pz.hint()) { D.hints--; St.save(); } refreshBadge(); },
    async 'hint-video'(b) {
      b.disabled = true;
      const r = await CJ.Platform.showRewarded('hint');
      b.disabled = false;
      if (!r.rewarded && !r.unavailable) return; // closed early: no hint
      closeSheet();
      if (r.unavailable) toast('No video right now, so this hint is on us!');
      if (pz && !pz.hint()) { D.hints++; St.save(); toast('Saved as a hint for later.'); } // watched, but nothing to place right now
      refreshBadge();
    },
    async buy(b) {
      const id = b.dataset.product; b.disabled = true;
      const r = await CJ.Platform.purchase(id);
      b.disabled = false;
      if (!r.ok) { if (r.reason && r.reason !== 'cancelled') toast('The purchase did not go through. Please try again.'); return; }
      St.grant(id);
      const p = product(id);
      closeSheet();
      if (p.kind === 'hints') { toast(`+${p.hints} hints!`); refreshBadge(); const c = app.querySelector('.chip-hints b'); if (c) c.textContent = D.hints; return; }
      toast(`${season(p.season).name} is all yours!`);
      seasonScreen(p.season);
    },
    async restore(b) {
      b.disabled = true;
      try { const ids = await CJ.Platform.restore(); ids.forEach((id) => St.grant(id)); toast(ids.length ? 'Purchases restored.' : 'Nothing to restore.'); }
      catch (_) { toast('Could not reach the App Store. Please try again.'); }
      b.disabled = false;
    },
  };
  function refreshBadge() {
    const badge = app.querySelector('.hint-b .badge'); if (!badge || !cur || !cur.key) return;
    const f = St.freeLeft(cur.key);
    badge.textContent = f > 0 ? f : D.hints > 0 ? D.hints : '▶';
    badge.className = 'badge' + (f > 0 ? '' : D.hints > 0 ? ' own' : ' ad');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const f = ACT[b.dataset.act]; if (f) { e.preventDefault(); f(b); }
  });

  // ---------------------------------------------------------------- start
  CJ.Audio.on = D.sound;
  CJ.Platform.start();
  CJ.Platform.owned().then((ids) => { if (ids.length) { ids.forEach((id) => St.grant(id)); } }).catch(() => {});
  const q = new URLSearchParams(location.search);
  if (q.get('season')) { if (q.get('n')) openLevel(q.get('season'), +q.get('n')); else seasonScreen(q.get('season')); }
  else if (q.has('daily')) openDaily();
  else home();
  CJ.app = { get pz() { return pz; }, home, seasonScreen, openLevel, openDaily, sheetShop };
})(window);
