// Cozy Jigsaw — sounds, made with Web Audio (no files): a soft wooden click when a piece fits,
// a little sparkle, a gentle "not here" thud, and a warm chord when the picture is finished.
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
    // Wooden "tock": a short filtered noise tap plus a low body.
    click() {
      if (!ok()) return; const t = ctx.currentTime;
      const n = noise(0.05), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 1.4; g.gain.value = 0.9;
      n.connect(f); f.connect(g); g.connect(master); n.start(t);
      tone(210, t, 0.09, 0.35); tone(420, t, 0.05, 0.12, 'triangle');
    },
    sparkle() {
      if (!ok()) return; const t = ctx.currentTime + 0.04;
      tone(1568, t, 0.25, 0.06); tone(2093, t + 0.06, 0.3, 0.05); tone(2637, t + 0.12, 0.35, 0.035);
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
