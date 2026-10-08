// Cozy Jigsaw — prototype screen: one photo, play. ?dev shows a piece-count picker for testing
// (in the game each level has a fixed size, see docs/PLAN.md).
// (The seasons map, shop and daily puzzle come in milestone 3.)
(function (root) {
  const CJ = root.CJ;
  const app = document.getElementById('app');
  const SIZES = [6, 8, 10, 12, 15];
  const q = new URLSearchParams(location.search);
  let n = +(q.get('n') || 6), pz = null, hints = 3;
  const KEY = () => 'cj_proto_' + n;

  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    ghost: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 15l5-5 4 4 3-3 4 4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  };

  function start() {
    const img = new Image();
    img.onload = () => play(img);
    img.src = q.get('img') || 'content/dev/eiffel.jpg';
  }
  function play(img) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY())); } catch (_) {}
    hints = saved && saved.hints != null ? saved.hints : 3;
    app.innerHTML = `
      <header class="bar">
        <button class="ib" aria-label="Back">${I.back}</button>
        <div class="grow"><div class="title">Eiffel Tower</div><div class="sub"><span class="prog"></span></div></div>
        <button class="ib ghost-b" aria-label="Faint picture on the board">${I.ghost}</button>
        <button class="ib eye-b" aria-label="Hold to see the picture">${I.eye}</button>
        <button class="ib hint-b" aria-label="Hint">${I.bulb}<span class="badge"></span></button>
      </header>
      <div class="picker"${q.has('dev') ? '' : ' hidden'}>${SIZES.map((k) => `<button data-n="${k}" class="${k === n ? 'on' : ''}">${k * k}</button>`).join('')}</div>
      <section class="game"></section>`;
    const host = app.querySelector('.game');
    host.style.cssText = 'flex:1;display:flex;min-height:0;position:relative';
    const prog = app.querySelector('.prog'), badge = app.querySelector('.hint-b .badge');
    const show = (st) => { prog.textContent = `${st.placed.length} / ${st.total}`; badge.textContent = hints > 0 ? hints : 'Ad'; badge.classList.toggle('ad', hints <= 0); };
    pz = CJ.Puzzle(host, {
      image: img, n, seed: 1000 + n, saved,
      onChange(st) { show(st); try { localStorage.setItem(KEY(), JSON.stringify(Object.assign(st, { hints }))); } catch (_) {} },
      onDone() {
        const card = document.createElement('div');
        card.className = 'done-card';
        card.innerHTML = `<h2>Beautiful!</h2><p>${n * n} pieces done.</p><div class="row"><button class="btn soft" data-a="again">Play again</button><button class="btn" data-a="next">Next size</button></div>`;
        host.appendChild(card);
        card.addEventListener('click', (e) => {
          const a = e.target.dataset.a; if (!a) return;
          localStorage.removeItem(KEY());
          if (a === 'next') n = SIZES[(SIZES.indexOf(n) + 1) % SIZES.length];
          pz.destroy(); play(img);
        });
      },
    });
    show(pz.state());
    app.querySelector('.ghost-b').classList.toggle('on', pz.state().ghost);
    app.querySelector('.ghost-b').onclick = (e) => e.currentTarget.classList.toggle('on', pz.ghost());
    const eye = app.querySelector('.eye-b');
    eye.onpointerdown = () => { pz.peek(true); eye.classList.add('on'); };
    eye.onpointerup = eye.onpointerleave = eye.onpointercancel = () => { pz.peek(false); eye.classList.remove('on'); };
    app.querySelector('.hint-b').onclick = () => {
      CJ.Audio.init();
      if (hints <= 0) { alert('In the game this plays a short video for a hint.'); hints = 1; }
      if (pz.hint()) { hints--; show(pz.state()); }
    };
    app.querySelector('.picker').onclick = (e) => { const b = e.target.closest('[data-n]'); if (!b) return; n = +b.dataset.n; pz.destroy(); play(img); };
  }
  start();
  CJ.app = { get pz() { return pz; } };
})(window);
