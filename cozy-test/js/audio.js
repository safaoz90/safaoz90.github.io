// Cozy Jigsaw — sounds, made with Web Audio (no files): a soft keyboard-like click when a piece fits,
// a faint shimmer, a gentle "not here" thud, and a warm chord when the picture is finished.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  let ctx = null, master = null;
  const ok = () => {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return CJ.Audio.on;
  };
  function noise(dur) {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }
  function tone(freq, t, dur, vol, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  CJ.Audio = {
    on: true,
    init() { ok(); },
    // Soft "thock", like a tactile mechanical keyboard key: a muffled press, then a quieter release.
    click() {
      if (!ok()) return; const t = ctx.currentTime;
      const key = (at, vol, cut) => {
        const n = noise(0.018), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 0.7; g.gain.value = vol;
        n.connect(f); f.connect(g); g.connect(master); n.start(at);
      };
      key(t, 0.55, 1700);
      tone(160, t, 0.035, 0.14);
      key(t + 0.045, 0.22, 1300);
    },
    // A very quiet shimmer under the sparkle.
    sparkle() {
      if (!ok()) return; const t = ctx.currentTime + 0.06;
      tone(1760, t, 0.22, 0.012); tone(2349, t + 0.05, 0.26, 0.009);
    },
    nope() {
      if (!ok()) return; const t = ctx.currentTime;
      tone(140, t, 0.12, 0.25); tone(110, t + 0.03, 0.12, 0.15);
    },
    done() {
      if (!ok()) return; const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.9, 0.12, 'triangle'));
      [1568, 2093].forEach((f, i) => tone(f, t + 0.5 + i * 0.08, 0.6, 0.04));
    },
  };
  // A light tap on the phone when a piece fits (Capacitor Haptics inside the app).
  CJ.haptic = function () {
    try {
      const H = root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins.Haptics;
      if (H) H.impact({ style: 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(8);
    } catch (_) {}
  };
})(typeof window !== 'undefined' ? window : globalThis);
