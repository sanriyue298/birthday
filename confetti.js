/* ═══════════════════════════════════════════
   confetti.js — 彩带/纸屑系统
   特性：飘落彩带、侧边喷射、中心大爆炸、3D 翻转纸片
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;

  const pieces = [];
  const COLORS = ["#ff6ec7", "#ffd166", "#7c5cff", "#4dd7fe", "#7ef9d8", "#ff5e7e", "#ffffff", "#ff9f1c"];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePiece(opts) {
    opts = opts || {};
    const shapes = ["rect", "rect", "circle", "ribbon"];
    return {
      x: opts.x !== undefined ? opts.x : Math.random() * W,
      y: opts.y !== undefined ? opts.y : -20,
      vx: opts.vx !== undefined ? opts.vx : Math.random() * 2 - 1,
      vy: opts.vy !== undefined ? opts.vy : Math.random() * 2.2 + 1.2,
      size: opts.size || Math.random() * 8 + 5,
      color: opts.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: opts.shape || shapes[Math.floor(Math.random() * shapes.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.22,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.08 + 0.03,
      sway: Math.random() * 0.5 + 0.2,
      life: 1,
      decay: opts.decay !== undefined ? opts.decay : 0.0018,
    };
  }

  function update() {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * p.sway;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= p.decay;
      if (p.y > H + 30 || p.life <= 0) pieces.splice(i, 1);
    }
    if (pieces.length > 1200) pieces.splice(0, pieces.length - 1200);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      const a = Math.max(0, Math.min(1, p.life * 2));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "ribbon") {
        ctx.fillRect(-p.size, -p.size * 0.22, p.size * 2, p.size * 0.44);
      } else {
        // 3D 翻转效果：宽度随旋转变化
        const w = p.size * Math.abs(Math.cos(p.rot));
        ctx.fillRect(-w / 2, -p.size * 0.5, w, p.size);
      }
      ctx.restore();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  /* ── 公共 API ── */
  const FX = {
    /** 从顶部飘落 */
    rain: function (count, opts) {
      count = count || 120;
      for (let i = 0; i < count; i++) pieces.push(makePiece(opts));
    },
    /** 从两侧喷出 */
    cannons: function (sides) {
      const n = 90;
      for (let i = 0; i < n; i++) {
        const fromLeft = sides === "left" || (sides === "both" && i % 2 === 0);
        const x = fromLeft ? -10 : W + 10;
        const angle = fromLeft ? Math.random() * 1.2 - 0.3 : Math.PI - (Math.random() * 1.2 - 0.3);
        const sp = 8 + Math.random() * 9;
        pieces.push(makePiece({
          x: x, y: H * (0.25 + Math.random() * 0.5),
          vx: Math.cos(angle) * sp,
          vy: Math.sin(angle) * sp - 3,
          decay: 0.004,
        }));
      }
    },
    /** 中心大爆炸 */
    burst: function (count) {
      count = count || 200;
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 12;
        pieces.push(makePiece({
          x: cx, y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          decay: 0.003,
        }));
      }
    },
    /** 指向某点爆炸 */
    burstAt: function (x, y, count) {
      count = count || 120;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 9;
        pieces.push(makePiece({
          x: x, y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 2,
          decay: 0.0035,
        }));
      }
    },
  };

  window.addEventListener("resize", resize);
  resize();
  loop();

  window.Confetti = FX;
})();
