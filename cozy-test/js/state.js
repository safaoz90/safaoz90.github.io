// Cozy Jigsaw — the player's progress and the rules around it (all numbers in CJ.RULES).
// Saved in localStorage. Levels: solve one to open the next; a season pack opens a whole season.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  const R = (CJ.RULES = {
    FREE_HINTS: 3, // per level
    DAILY_REWARD: [1, 1, 2, 2, 3, 3, 10], // hints for day 1..7 of a streak, then it starts again
    DAILY_PIECES: [64, 100], // the daily puzzle is a medium one
    PRODUCTS: [
      { id: 'cozy.season.winter', kind: 'season', season: 'winter', price: '$2.99' },
      { id: 'cozy.season.spring', kind: 'season', season: 'spring', price: '$2.99' },
      { id: 'cozy.season.summer', kind: 'season', season: 'summer', price: '$2.99' },
      { id: 'cozy.season.fall', kind: 'season', season: 'fall', price: '$2.99' },
      { id: 'cozy.season.halloween', kind: 'season', season: 'halloween', price: '$2.99' },
      { id: 'cozy.hints.50', kind: 'hints', hints: 50, price: '$2.99' },
      { id: 'cozy.hints.100', kind: 'hints', hints: 100, price: '$4.99' },
      { id: 'cozy.hints.300', kind: 'hints', hints: 300, price: '$8.99' },
    ],
  });
  const KEY = 'cozy_save_v1';
  const fresh = () => ({ v: 1, done: {}, boards: {}, hintsUsed: {}, hints: 0, owned: {}, daily: {}, streak: { day: null, count: 0 }, music: true, sound: true, ghost: true, seenIntro: false, played: 0 });
  let S = fresh();
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
  const season = (id) => CJ.SEASONS.find((s) => s.id === id);
  const lk = (sid, n) => `${sid}-${n}`;

  // A special season (Halloween) is shown during its dates, or always once bought.
  function inSeason(s, now = new Date()) {
    if (!s.special) return true;
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return md >= s.special.from && md <= s.special.to;
  }

  CJ.State = {
    get data() { return S; },
    save,
    dayKey,
    owns: (id) => !!S.owned[id],
    ownsSeason: (sid) => !!S.owned[season(sid).product],
    visible: (s) => inSeason(s) || !!S.owned[s.product],
    isDone: (sid, n) => !!S.done[lk(sid, n)],
    doneCount: (sid) => season(sid).levels.filter((l) => S.done[lk(sid, l.n)]).length,
    // Open: level 1 (a special season's first puzzle is a free preview), the level after a solved one,
    // or any level of a season that was bought.
    isOpen(sid, n) {
      const s = season(sid);
      if (n === 1 || S.owned[s.product]) return true;
      if (s.special) return false;
      return !!S.done[lk(sid, n - 1)];
    },
    // The next level to play in a season: the first open one not solved yet.
    next(sid) { const s = season(sid); return s.levels.find((l) => !S.done[lk(sid, l.n)] && this.isOpen(sid, l.n)) || null; },
    board: (key) => S.boards[key] || null,
    setBoard(key, st) { S.boards[key] = st; save(); },
    finish(key) { S.done[key] = true; delete S.boards[key]; S.played++; save(); },
    // Hints: 3 free per level, then the player's own hints, then a video.
    freeLeft: (key) => Math.max(0, R.FREE_HINTS - (S.hintsUsed[key] || 0)),
    useHint(key) {
      if (this.freeLeft(key) > 0) { S.hintsUsed[key] = (S.hintsUsed[key] || 0) + 1; save(); return 'free'; }
      if (S.hints > 0) { S.hints--; save(); return 'own'; }
      return null;
    },
    addHints(n) { S.hints += n; save(); },
    grant(product) {
      const p = R.PRODUCTS.find((x) => x.id === product); if (!p) return;
      if (p.kind === 'hints') S.hints += p.hints; else S.owned[product] = true;
      save();
    },
    // The daily puzzle: a medium board from any season's photos, the same for everyone that day.
    daily(key = dayKey()) {
      const all = CJ.SEASONS.filter((s) => !s.special).flatMap((s) => s.levels.map((l) => ({ s, l })));
      let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const pick = all[h % all.length];
      return { key: 'daily-' + key, day: key, img: pick.l.img, tile: pick.l.tile, by: pick.l.by, src: pick.l.src, pieces: R.DAILY_PIECES[h % R.DAILY_PIECES.length], season: pick.s };
    },
    dailyDone: (key = dayKey()) => !!S.daily[key],
    // Streak: days in a row with the daily puzzle solved. Returns the hints won today.
    finishDaily(key = dayKey()) {
      if (S.daily[key]) return 0;
      S.daily[key] = true;
      const st = S.streak;
      st.count = st.day === addDays(key, -1) ? st.count + 1 : 1;
      st.day = key;
      const reward = R.DAILY_REWARD[(st.count - 1) % 7];
      S.hints += reward; delete S.boards['daily-' + key]; S.played++;
      save();
      return reward;
    },
    // This week's strip: which of the 7 streak days are won, and what each pays.
    streakInfo(key = dayKey()) {
      const st = S.streak, alive = st.day === key || st.day === addDays(key, -1);
      const count = alive ? st.count : 0, inWeek = count % 7 === 0 && count ? 7 : count % 7;
      const doneToday = !!S.daily[key];
      return { count, inWeek, doneToday, nextReward: R.DAILY_REWARD[doneToday ? count % 7 : count % 7] };
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
