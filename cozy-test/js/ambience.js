// Cozy Jigsaw — calm background sound for each season, made live with Web Audio (no files, no licences):
//   winter: a crackling fireplace · spring: birdsong and a breeze · summer: slow waves · fall: soft rain
//   halloween: a low wind and a music box. Each has a very quiet warm chord pad underneath.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  let ctx = null, out = null, cur = null, timers = [];
  const AC = root.AudioContext || root.webkitAudioContext;

  function init() {
    if (!AC) return false;
    if (!ctx) { ctx = new AC(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function noiseBuf(sec, brown) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function loopNoise(dest, { brown = false, type = 'lowpass', freq = 800, q = 0.7, vol = 0.2 } = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(4, brown); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(dest); src.start();
    return { src, f, g };
  }
  function lfo(param, rate, depth, center) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); param.value = center; o.start();
    return o;
  }
  const every = (min, max, fn) => { const t = setTimeout(() => { fn(); every(min, max, fn); }, min + Math.random() * (max - min)); timers.push(t); };
  function blip(dest, freq, t, dur, vol, type = 'sine', slide = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  // A slow, quiet chord pad that changes every ~8 s.
  function pad(dest, chords, vol = 0.035) {
    const g = ctx.createGain(); g.gain.value = vol; g.connect(dest);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(g);
    let i = 0;
    const play = () => {
      const t = ctx.currentTime, ch = chords[i++ % chords.length];
      ch.forEach((hz) => { [0, 3].forEach((det) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = 'triangle'; o.frequency.value = hz; o.detune.value = det; e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 2.5); e.gain.exponentialRampToValueAtTime(0.0001, t + 9); o.connect(e); e.connect(f); o.start(t); o.stop(t + 9.2); }); });
    };
    play(); const iv = setInterval(play, 8000); timers.push(iv);
  }

  const SCENES = {
    winter(d) {
      loopNoise(d, { brown: true, freq: 400, vol: 0.5 }); // the fire's low roar
      every(60, 420, () => { const t = ctx.currentTime; blip(d, 1800 + Math.random() * 2600, t, 0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.06, 'square', 0.5); }); // crackles
      every(2500, 7000, () => { const t = ctx.currentTime; for (let k = 0; k < 4; k++) blip(d, 900 + Math.random() * 1500, t + k * 0.03, 0.03, 0.04, 'square', 0.4); }); // a little pop
      pad(d, [[196, 247, 294], [175, 220, 262], [165, 196, 247], [175, 220, 294]]);
    },
    spring(d) {
      const w = loopNoise(d, { freq: 600, vol: 0.08 }); lfo(w.g.gain, 0.08, 0.05, 0.08);
      every(1800, 5200, () => { const t = ctx.currentTime, base = 2600 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4); for (let k = 0; k < n; k++) blip(d, base * (1 + Math.random() * 0.2), t + k * 0.11, 0.07, 0.035, 'sine', 1.25 + Math.random() * 0.3); });
      pad(d, [[262, 330, 392], [220, 277, 330], [247, 311, 370], [196, 247, 294]], 0.03);
    },
    summer(d) {
      const w = loopNoise(d, { freq: 500, vol: 0.12 }); lfo(w.g.gain, 1 / 7, 0.1, 0.13); lfo(w.f.frequency, 1 / 7, 350, 700);
      pad(d, [[220, 277, 330], [247, 294, 370], [196, 247, 294], [220, 262, 330]], 0.03);
    },
    fall(d) {
      loopNoise(d, { type: 'highpass', freq: 1200, vol: 0.06 }); // rain
      loopNoise(d, { brown: true, freq: 300, vol: 0.18 });
      every(300, 1100, () => blip(d, 2200 + Math.random() * 2400, ctx.currentTime, 0.04, 0.012, 'sine', 0.6)); // drops on leaves
      pad(d, [[175, 220, 262], [165, 196, 247], [147, 185, 220], [165, 208, 247]], 0.035);
    },
    halloween(d) {
      const w = loopNoise(d, { type: 'bandpass', freq: 500, q: 3, vol: 0.12 }); lfo(w.f.frequency, 0.06, 260, 520); lfo(w.g.gain, 0.09, 0.06, 0.1);
      const box = [523, 622, 784, 932, 1047, 784, 622, 698];
      let i = 0; every(650, 1100, () => blip(d, box[i++ % box.length], ctx.currentTime, 1.2, 0.03, 'triangle'));
      pad(d, [[147, 175, 220], [139, 165, 208], [131, 156, 196], [139, 175, 208]], 0.03);
    },
  };

  CJ.Ambience = {
    // Starts (or switches to) a season's sound. Call after a tap (browsers need one).
    play(sid) {
      if (!init()) return;
      if (cur && cur.sid === sid) return;
      this.stop(true);
      const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(out);
      cur = { sid, bus };
      (SCENES[sid] || SCENES.winter)(bus);
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(CJ.Ambience.volume, ctx.currentTime, 0.8);
    },
    stop(quick) {
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = [];
      if (cur) { const b = cur.bus; if (quick) b.disconnect(); else { out.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => b.disconnect(), 1500); } }
      cur = null;
    },
    volume: 0.55,
  };
  // Quiet when the app goes to the background.
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
})(typeof window !== 'undefined' ? window : globalThis);
