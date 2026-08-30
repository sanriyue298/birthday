/* ═══════════════════════════════════════════
   music.js — Web Audio 合成音效与《生日快乐》曲
   特性：无需任何音频文件，纯振荡器合成；
        支持旋律 + 琶音伴奏 + 和声；爆炸/吹蜡烛/彩带音效
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let musicPlaying = false;
  let musicTimer = null;
  let melodyIndex = 0;
  let melodyOn = false;

  /* 生日快乐（简谱），bpm 约 110 */
  // 每项 [音名, 拍数]
  const MELODY = [
    ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2],
  ];

  // 伴奏和弦（每小节根音）
  const CHORDS = [
    ["C4", "E4", "G4"], ["C4", "E4", "G4"], ["F4", "A4", "C5"], ["G4", "B4", "D5"],
    ["C4", "E4", "G4"], ["C4", "E4", "G4"], ["G4", "B4", "D5"], ["C4", "E4", "G4"],
  ];

  const NOTE_FREQ = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
    F5: 698.46, G5: 783.99, A5: 880.00,
  };

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.5;
      musicGain.connect(master);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.65;
      sfxGain.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, gainNode, vol, glideTo) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  /* ── 烟花爆炸音效 ── */
  function sfxBoom(size, type) {
    try {
      ensureCtx();
      const t = ctx.currentTime;
      const vol = Math.min(0.5, 0.18 + size * 0.1);
      // 低频轰鸣
      tone(120, t, 0.5, "sine", sfxGain, vol, 40);
      // 噪声爆炸（用随机频率的短音模拟）
      for (let i = 0; i < 10; i++) {
        tone(200 + Math.random() * 900, t + Math.random() * 0.06, 0.12, "triangle", sfxGain, vol * 0.25);
      }
    } catch (e) { /* 忽略音频错误 */ }
  }

  /* ── 火箭上升呼啸 ── */
  function sfxWhoosh() {
    try {
      ensureCtx();
      const t = ctx.currentTime;
      tone(300, t, 0.6, "sawtooth", sfxGain, 0.06, 1200);
    } catch (e) {}
  }

  /* ── 蜡烛熄灭 ── */
  function sfxBlow() {
    try {
      ensureCtx();
      const t = ctx.currentTime;
      tone(500, t, 0.09, "sine", sfxGain, 0.2, 120);
    } catch (e) {}
  }

  /* ── 彩带/欢呼 ── */
  function sfxFanfare() {
    try {
      ensureCtx();
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone(f, t + i * 0.09, 0.3, "triangle", sfxGain, 0.22);
      });
    } catch (e) {}
  }

  /* ── 许愿流星 ── */
  function sfxWish() {
    try {
      ensureCtx();
      const t = ctx.currentTime;
      tone(880, t, 0.8, "sine", sfxGain, 0.12, 2200);
    } catch (e) {}
  }

  /* ── 生日歌主旋律调度 ── */
  function scheduleMelody() {
    if (!musicPlaying || !ctx) return;
    ensureCtx();
    const beat = 60 / 105; // bpm 105
    let t = ctx.currentTime + 0.06;

    for (let i = 0; i < MELODY.length; i++) {
      const [note, beats] = MELODY[i];
      const dur = beats * beat;
      // 主旋律（双振荡器叠加，更饱满）
      tone(NOTE_FREQ[note], t, dur * 0.95, "triangle", musicGain, 0.32);
      tone(NOTE_FREQ[note] * 2, t, dur * 0.9, "sine", musicGain, 0.05);

      // 低音伴奏（按小节）
      const bar = Math.floor(i / 3) % CHORDS.length;
      const chord = CHORDS[bar];
      if (i % 3 === 0) {
        tone(NOTE_FREQ[chord[0]] / 2, t, beat * 3, "sine", musicGain, 0.14);
      }
      // 琶音装饰
      const arp = chord[(i + 1) % 3];
      tone(NOTE_FREQ[arp], t + dur * 0.5, dur * 0.45, "triangle", musicGain, 0.05);

      t += dur;
    }
    // 循环
    musicTimer = setTimeout(scheduleMelody, (t - ctx.currentTime) * 1000 - 60);
  }

  window.SFX = {
    boom: sfxBoom,
    whoosh: sfxWhoosh,
    blow: sfxBlow,
    fanfare: sfxFanfare,
    wish: sfxWish,
  };

  window.Music = {
    toggle: function () {
      ensureCtx();
      if (musicPlaying) {
        musicPlaying = false;
        if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
        // 淡出
        const g = musicGain.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime);
        g.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        return false;
      }
      musicPlaying = true;
      const g = musicGain.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(0.0001, ctx.currentTime);
      g.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5);
      scheduleMelody();
      return true;
    },
    isPlaying: function () { return musicPlaying; },
    unlock: function () { ensureCtx(); },
  };
})();
