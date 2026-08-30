/* ═══════════════════════════════════════════
   fireworks.js — 高级烟花粒子系统
   类型：球形 / 双层 / 环形 / 心形 / 柳条 / 彗星 / 渐变爆裂
   特性：物理（重力/阻力）、拖尾、发光合成、点击引爆、自动发射
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;

  const rockets = [];   // 上升的火箭
  const particles = []; // 爆裂粒子
  let running = true;

  const PALETTES = [
    ["#ff6ec7", "#ffd166", "#7c5cff", "#ffffff"],
    ["#4dd7fe", "#7ef9d8", "#ffffff", "#2e6bff"],
    ["#ffd166", "#ff9f1c", "#ff6b35", "#fff3b0"],
    ["#ff5e7e", "#ff9e9e", "#ffd166", "#ffffff"],
    ["#a78bfa", "#7c5cff", "#4dd7fe", "#ffffff"],
  ];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2); // 手机限 1.5 倍渲染
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 粒子规模系数：小屏手机自动减半，保证流畅
  function scale() {
    return Math.min(1, Math.max(0.5, W / 1400));
  }

  /* ── 工具 ── */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── 火箭（升空阶段） ── */
  function launch(x, y, opts) {
    opts = opts || {};
    const targetY = opts.targetY !== undefined
      ? opts.targetY
      : y !== undefined ? y : H * rnd(0.18, 0.45);
    rockets.push({
      x: x !== undefined ? x : W * rnd(0.15, 0.85),
      y: H + 12,
      targetY: targetY,
      vy: -(rnd(7.5, 11.5)),
      vx: x !== undefined ? 0 : rnd(-1.2, 1.2),
      color: opts.color || pick(PALETTES[Math.floor(Math.random() * PALETTES.length)]),
      type: opts.type || pick(["ball", "ball", "double", "ring", "heart", "willow", "comet", "gradient"]),
      trail: [],
      sparkColor: opts.sparkColor || "#fff3b0",
      size: opts.size || 1,
      sound: opts.sound !== false,
    });
  }

  /* ── 爆裂粒子 ── */
  function explode(r) {
    const cx = r.x, cy = r.y;
    const pal = r.color;
    const baseN = Math.round((90 + Math.floor(Math.random() * 60)) * scale());

    function push(p) { p.life = 1; particles.push(p); }

    switch (r.type) {
      case "ring": {
        const n = Math.round(130 * scale());
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          const sp = rnd(3.4, 4.2);
          push({
            x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: pick(pal), size: rnd(1.6, 2.6) * r.size,
            drag: 0.985, gravity: 0.035, life: rnd(0.9, 1.25), fade: 0.9,
          });
        }
        break;
      }
      case "heart": {
        const n = Math.round(150 * scale());
        for (let i = 0; i < n; i++) {
          // 心形参数方程
          const t = (i / n) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const sp = rnd(3.1, 3.7);
          const ang = Math.atan2(-hy, hx);
          push({
            x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            color: pick(pal), size: rnd(1.8, 2.8) * r.size,
            drag: 0.982, gravity: 0.04, life: rnd(1.1, 1.5), fade: 0.9,
            phase: t, heart: true,
          });
        }
        break;
      }
      case "double": {
        // 外层大球 + 内层小球
        const n1 = Math.round(110 * scale()), n2 = Math.round(60 * scale());
        for (let i = 0; i < n1; i++) {
          const a = rnd(0, Math.PI * 2), sp = rnd(3.2, 4.6);
          push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: pick(pal), size: rnd(1.8, 3) * r.size, drag: 0.984, gravity: 0.03,
            life: rnd(0.9, 1.3), fade: 0.92 });
        }
        setTimeout(function () {
          for (let i = 0; i < n2; i++) {
            const a = rnd(0, Math.PI * 2), sp = rnd(1.4, 2.3);
            push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              color: pick(pal), size: rnd(1.4, 2.2) * r.size, drag: 0.98, gravity: 0.028,
              life: rnd(0.7, 1), fade: 0.92 });
          }
        }, 220);
        break;
      }
      case "willow": {
        // 柳条：慢速下垂、长寿命
        const n = Math.round(120 * scale());
        for (let i = 0; i < n; i++) {
          const a = rnd(0, Math.PI * 2), sp = rnd(1.2, 3.4);
          push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.4,
            color: pick(pal), size: rnd(1.2, 2) * r.size, drag: 0.99, gravity: 0.018,
            life: rnd(1.8, 2.6), fade: 0.985 });
        }
        break;
      }
      case "comet": {
        // 彗星：高速粒子簇向一个方向冲
        const dir = rnd(0, Math.PI * 2);
        for (let i = 0; i < Math.round(70 * scale()); i++) {
          const spread = rnd(-0.35, 0.35);
          const a = dir + spread, sp = rnd(4, 8.5);
          push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: pick(pal), size: rnd(1.6, 2.8) * r.size, drag: 0.978, gravity: 0.05,
            life: rnd(0.7, 1.15), fade: 0.9 });
        }
        break;
      }
      case "gradient": {
        // 渐变爆裂：每颗粒子颜色随距离变
        for (let i = 0; i < baseN; i++) {
          const a = rnd(0, Math.PI * 2), sp = rnd(2, 5.2);
          const mix = Math.min(1, sp / 5.2);
          push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: mix < 0.5 ? pal[0] : pal[1], size: rnd(1.6, 3) * r.size,
            drag: 0.984, gravity: 0.032, life: rnd(0.9, 1.4), fade: 0.91 });
        }
        break;
      }
      case "ball":
      default: {
        for (let i = 0; i < baseN; i++) {
          const a = rnd(0, Math.PI * 2), sp = Math.pow(Math.random(), 0.6) * 5.4;
          push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: pick(pal), size: rnd(1.6, 3) * r.size, drag: 0.984, gravity: 0.03,
            life: rnd(0.9, 1.4), fade: 0.91 });
        }
        // 中心闪光
        push({ x: cx, y: cy, vx: 0, vy: 0, color: "#ffffff", size: 5, drag: 0.99, gravity: 0, life: 0.25, fade: 0.85 });
        break;
      }
    }

    // 轻微震动提示（仅作用于烟花画布层，不影响输入框等 UI；交互触发的烟花才有）
    if (r.sound !== false) {
      canvas.classList.remove("boom-shake");
      void canvas.offsetWidth; // 重启动画
      canvas.classList.add("boom-shake");
      // 音效
      if (window.SFX) window.SFX.boom(r.size, r.type);
    }
  }

  /* ── 更新 ── */
  function update() {
    // 火箭
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy *= 0.995;
      r.trail.push({ x: r.x, y: r.y, a: 1 });
      if (r.trail.length > 8) r.trail.shift();
      if (r.y <= r.targetY || r.vy > -1) {
        explode(r);
        rockets.splice(i, 1);
      }
    }
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.fade * 0.016;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 2600) particles.splice(0, particles.length - 2600);
  }

  /* ── 绘制 ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // 火箭 + 拖尾
    for (const r of rockets) {
      for (let i = 0; i < r.trail.length; i++) {
        const t = r.trail[i];
        const a = (i / r.trail.length) * 0.8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, i * 0.55 + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 214, 130, " + a.toFixed(3) + ")";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8e1";
      ctx.fill();
    }

    // 粒子（发光：两层绘制）
    for (const p of particles) {
      const a = Math.max(0, Math.min(1, p.life));
      // 外发光层
      ctx.globalAlpha = a * 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // 核心层
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // 高光
      ctx.globalAlpha = a * 0.9;
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function loop() {
    if (running) { update(); draw(); }
    requestAnimationFrame(loop);
  }

  /* ── 交互：点击任意位置放烟花（排除交互元素与输入聚焦状态） ── */
  function isInteractive(el) {
    if (!el || !el.closest) return false;
    // 输入框聚焦时不放烟花，避免干扰输入
    if (document.activeElement) {
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    }
    // 按钮、输入框、链接、蛋糕画布、弹窗、侧边导航等不触发烟花
    return !!el.closest("button, input, textarea, select, a, #cake-canvas, .modal-mask, #side-nav, .msg-dots");
  }

  function onPointer(e) {
    if (isInteractive(e.target)) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    launch(x, y, { targetY: y, type: pick(["ball", "double", "ring", "comet", "gradient"]) });
  }
  // 用 click 而非 pointerdown：手机上滑动/滚动页面不会误触发放烟花
  document.addEventListener("click", onPointer);

  /* ── 自动烟花（静默绽放：不发声、不震动画面） ── */
  let autoTimer = null;
  function startAuto() {
    stopAuto();
    const tick = function () {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        setTimeout(function () {
          launch(undefined, undefined, {
            type: pick(["ball", "double", "ring", "willow", "heart", "gradient", "comet"]),
            sound: false,
          });
        }, i * 350);
      }
      autoTimer = setTimeout(tick, rnd(2200, 4000));
    };
    autoTimer = setTimeout(tick, 1200);
  }
  function stopAuto() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  }

  /* ── 大文字烟花 ── */
  function bigText(text) {
    const el = document.getElementById("big-text");
    el.innerHTML = '<span class="big-word">' + text + "</span>";
    el.classList.add("show");
    setTimeout(function () { el.classList.remove("show"); }, 2500);
  }

  /* ── 全屏齐放（sound=false 时静默：不发声、不震动） ── */
  function barrage(sound) {
    const n = Math.min(26, Math.floor(W / 60));
    for (let i = 0; i < n; i++) {
      setTimeout(function () {
        launch(undefined, undefined, {
          type: pick(["ball", "double", "ring", "heart", "comet", "gradient"]),
          sound: sound !== false,
        });
      }, i * 120);
    }
  }

  window.addEventListener("resize", resize);
  resize();
  loop();
  startAuto();

  window.Fireworks = {
    launch: launch,
    explode: explode,
    bigText: bigText,
    barrage: barrage,
    startAuto: startAuto,
    stopAuto: stopAuto,
    setRunning: function (v) { running = v; },
  };
})();
