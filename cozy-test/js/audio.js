// Cozy Jigsaw — sounds from recorded files (assets/sounds), played with Web Audio:
//   pick (a piece is lifted), snap (it fits), nope (wrong spot), done (picture finished),
//   and a calm background recording per season that loops seamlessly and fades between seasons.
// Which file plays for what is set in CJ.SOUNDS (js/sounds.js).
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  const AC = root.AudioContext || root.webkitAudioContext;
  let ctx = null, fx = null, amb = null;
  const buffers = new Map(), loading = new Map();
  function ensure() {
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      fx = ctx.createGain(); fx.gain.value = 0.7; fx.connect(ctx.destination);
      amb = ctx.createGain(); amb.gain.value = 1; amb.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function load(url) {
    if (buffers.has(url)) return Promise.resolve(buffers.get(url));
    if (!loading.has(url)) loading.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => { buffers.set(url, buf); return buf; }).catch(() => null));
    return loading.get(url);
  }
  function play(name, vol = 1) {
    if (!CJ.Audio.on || !ensure()) return;
    const S = CJ.SOUNDS || {}, list = [].concat(S[name] || []); if (!list.length) return;
    const url = list[Math.floor(Math.random() * list.length)];
    const go = (buf) => { if (!buf) return; const src = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol * (S.volume && S.volume[name] != null ? S.volume[name] : 1); src.buffer = buf; src.playbackRate.value = 0.97 + Math.random() * 0.06; src.connect(g); g.connect(fx); src.start(); };
    const b = buffers.get(url); if (b) go(b); else load(url).then(go);
  }
  CJ.Audio = {
    on: true,
    init() { if (ensure()) Object.values(CJ.SOUNDS || {}).flat().filter((u) => typeof u === 'string').forEach(load); },
    pick() { play('pick', 0.6); },
    click() { play('snap'); },
    sparkle() {},
    nope() { play('nope', 0.8); },
    done() { play('done'); },
  };

  // ---------------------------------------------------------------- season background
  let cur = null, music = null;
  // Calm piano under every season, much quieter than the background; starts once and keeps going.
  function startMusic() {
    if (music || !CJ.SOUNDS || !CJ.SOUNDS.music) return;
    music = { pending: true };
    load(CJ.SOUNDS.music).then((buf) => {
      if (!buf || !music || !music.pending) return;
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf; src.loop = true; g.gain.value = 0.0001; src.connect(g); g.connect(amb); src.start();
      g.gain.setTargetAtTime(0.06, ctx.currentTime, 2);
      music = { src, g };
    });
  }
  function stopMusic() { if (!music) return; const m = music; music = null; if (m.g) { m.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5); setTimeout(() => { try { m.src.stop(); } catch (_) {} }, 2500); } }
  CJ.Ambience = {
    volume: 0.16, // background level: quiet, under the clicks
    play(sid) {
      if (!ensure()) return;
      if (cur && cur.sid === sid) return;
      const url = (CJ.SOUNDS && CJ.SOUNDS.ambience && CJ.SOUNDS.ambience[sid]) || null;
      this.stop(true);
      startMusic();
      if (!url) return;
      const me = { sid }; cur = me;
      load(url).then((buf) => {
        if (cur !== me || !buf) return;
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = buf; src.loop = true; g.gain.value = 0.0001; src.connect(g); g.connect(amb);
        src.start(0, Math.random() * Math.max(0, buf.duration - 5));
        g.gain.setTargetAtTime(this.volume, ctx.currentTime, 1.2);
        me.src = src; me.g = g;
      });
    },
    stop(keepMusic) {
      if (!keepMusic) stopMusic();
      if (!cur) return;
      const c = cur; cur = null;
      if (c.g) { c.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5); setTimeout(() => { try { c.src.stop(); } catch (_) {} }, 2500); }
    },
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  // A light tap on the phone when a piece fits (replaced by js/platform.js inside the app).
  CJ.haptic = function () { try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {} };
})(typeof window !== 'undefined' ? window : globalThis);
