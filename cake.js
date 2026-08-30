/* ═══════════════════════════════════════════
   cake.js — 交互式生日蛋糕（Canvas）
   特性：3D 透视蛋糕、奶油滴落、蜡烛火焰物理动画、
        点击吹灭、全部熄灭后庆祝（彩带+烟花+文字）
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("cake-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const candles = [];      // 蜡烛
  let allOut = false;
  let celebrate = false;
  let floatY = 0, floatDir = 1;

  // 蛋糕主题色
  const CAKE_COLORS = {
    default: { body: "#ff9ecf", top: "#ffd166", dark: "#e0609e" },
    ocean:   { body: "#5ec8e8", top: "#a5f0e0", dark: "#2e8fb8" },
    gold:    { body: "#f5b04c", top: "#ffe9a8", dark: "#c97f1f" },
    forest:  { body: "#67d99b", top: "#d4f7a5", dark: "#2fa871" },
  };

  const CANDLE_COLORS = ["#ff6ec7", "#4dd7fe", "#ffd166", "#a78bfa", "#ff5e7e", "#7ef9d8"];

  function initCandles() {
    candles.length = 0;
    const positions = [-190, -95, 0, 95, 190];
    positions.forEach(function (x, i) {
      candles.push({
        x: x,
        lit: true,
        color: CANDLE_COLORS[i % CANDLE_COLORS.length],
        flameSeed: Math.random() * 100,
        smoke: [],
      });
    });
    allOut = false;
    celebrate = false;
    document.getElementById("cake-caption").textContent = "点击火焰 👆";
  }

  /* ── 绘制 ── */
  function drawCake() {
    const pal = CAKE_COLORS[document.body.dataset.theme] || CAKE_COLORS.default;

    // 影子
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W / 2, 545, 210, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();
    ctx.restore();

    // 底层蛋糕（最大）
    layer(W / 2, 440, 220, 78, pal.body, pal.dark);
    // 中层
    layer(W / 2, 360, 160, 66, pal.body, pal.dark);
    // 顶层
    layer(W / 2, 282, 104, 54, pal.top, "#e6b84d");

    // 奶油滴落装饰（顶层的边缘）
    ctx.fillStyle = "#fff8f0";
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.34;
      const dx = Math.cos(a) * 104, dy = Math.sin(a) * 104;
      ctx.beginPath();
      ctx.ellipse(W / 2 + dx, 282 + dy, 9, 18 + (i % 3) * 7, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 中层的糖珠
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI;
      const dx = Math.cos(a) * 150, dy = Math.sin(a) * 20;
      ctx.beginPath();
      ctx.arc(W / 2 + dx, 366 + dy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function layer(cx, cy, rx, ry, color, dark) {
    ctx.save();
    // 主体
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // 侧面（下半椭圆拉伸形成圆柱感）
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(cx - rx, cy, rx * 2, ry * 1.6);
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 1.6, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // 侧面阴影（圆柱感）
    const grad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.18)");
    grad.addColorStop(0.35, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - rx, cy, rx * 2, ry * 1.6);
    // 顶部高光
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.96, ry * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    ctx.restore();
  }

  function drawCandle(c) {
    const cx = W / 2 + c.x, cy = 232;
    // 蜡烛体（细条纹）
    ctx.save();
    ctx.fillStyle = "#ffffff";
    roundRect(cx - 7, cy - 62, 14, 62, 6);
    ctx.fill();
    ctx.fillStyle = c.color;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 4; i++) {
      roundRect(cx - 7 + i * 3.6, cy - 62, 3.6, 62, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 烛芯
    ctx.strokeStyle = "#5a4632";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 62);
    ctx.lineTo(cx, cy - 70);
    ctx.stroke();

    // 火焰
    if (c.lit) {
      const t = performance.now() / 1000;
      const flick = Math.sin(t * 9 + c.flameSeed) * 1.6
        + Math.sin(t * 23 + c.flameSeed * 2) * 0.9;
      const fh = 34 + flick * 0.5;
      const fx = cx + flick * 0.4;
      const fy = cy - 70;

      // 外层光晕
      const glow = ctx.createRadialGradient(fx, fy - fh / 2, 0, fx, fy - fh / 2, 26);
      glow.addColorStop(0, "rgba(255,190,80,0.5)");
      glow.addColorStop(1, "rgba(255,150,50,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fx, fy - fh / 2, 26, 0, Math.PI * 2);
      ctx.fill();

      // 外焰（橙）
      ctx.beginPath();
      ctx.moveTo(fx - 8, fy);
      ctx.quadraticCurveTo(fx - 9, fy - fh * 0.55, fx, fy - fh);
      ctx.quadraticCurveTo(fx + 9, fy - fh * 0.55, fx + 8, fy);
      ctx.closePath();
      ctx.fillStyle = "#ff9f1c";
      ctx.fill();

      // 内焰（黄）
      ctx.beginPath();
      ctx.moveTo(fx - 4.5, fy);
      ctx.quadraticCurveTo(fx - 5, fy - fh * 0.5, fx, fy - fh * 0.72);
      ctx.quadraticCurveTo(fx + 5, fy - fh * 0.5, fx + 4.5, fy);
      ctx.closePath();
      ctx.fillStyle = "#ffe066";
      ctx.fill();

      // 焰心（白）
      ctx.beginPath();
      ctx.moveTo(fx - 2, fy);
      ctx.quadraticCurveTo(fx - 2.2, fy - fh * 0.4, fx, fy - fh * 0.52);
      ctx.quadraticCurveTo(fx + 2.2, fy - fh * 0.4, fx + 2, fy);
      ctx.closePath();
      ctx.fillStyle = "#fffbe8";
      ctx.fill();
    } else {
      // 熄灭后冒烟
      if (Math.random() < 0.35) {
        c.smoke.push({ x: cx + (Math.random() - 0.5) * 3, y: cy - 72, life: 1 });
      }
      for (let i = c.smoke.length - 1; i >= 0; i--) {
        const s = c.smoke[i];
        s.y -= 1.2;
        s.x += Math.sin(s.life * 5) * 0.6;
        s.life -= 0.018;
        ctx.globalAlpha = Math.max(0, s.life) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3 + (1 - s.life) * 4, 0, Math.PI * 2);
        ctx.fillStyle = "#cccccc";
        ctx.fill();
        if (s.life <= 0) c.smoke.splice(i, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 蛋糕轻微浮动
    ctx.save();
    ctx.translate(0, floatY);
    drawCake();
    for (const c of candles) drawCandle(c);
    ctx.restore();
  }

  /* ── 动画循环 ── */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    // 浮动
    floatY += floatDir * dt * 0.012;
    if (floatY > 7) floatDir = -1;
    if (floatY < -7) floatDir = 1;
    draw();
    requestAnimationFrame(loop);
  }

  /* ── 交互：点击火焰吹灭 ── */
  function onTap(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    // 找到被点击的蜡烛火焰
    for (const c of candles) {
      const cx = W / 2 + c.x, cy = 232 + floatY - 70;
      const dx = px - cx, dy = py - cy;
      if (Math.abs(dx) < 30 && dy > -40 && dy < 22) {
        if (c.lit) {
          c.lit = false;
          if (window.SFX) window.SFX.blow();
        }
        checkAllOut();
        return;
      }
    }
    // 点击蛋糕其他位置 → 撒彩带
    if (window.Confetti) window.Confetti.burstAt(px, py, 40);
  }

  function checkAllOut() {
    const litCount = candles.filter(function (c) { return c.lit; }).length;
    if (litCount === 0 && !celebrate) {
      celebrate = true;
      document.getElementById("cake-caption").textContent = "🎉 愿望一定会实现！";
      // 庆祝：彩带 + 烟花 + 大文字 + 音乐欢呼
      if (window.Confetti) {
        window.Confetti.burst(240);
        setTimeout(function () { window.Confetti.cannons("both"); }, 250);
        setTimeout(function () { window.Confetti.rain(140); }, 500);
      }
      if (window.Fireworks) {
        window.Fireworks.barrage();
        setTimeout(function () { window.Fireworks.bigText("生日快乐！"); }, 400);
      }
      if (window.SFX) window.SFX.fanfare();
      // 自动重置蜡烛（下次还能再吹）
      setTimeout(function () {
        candles.forEach(function (c) { c.lit = true; c.smoke.length = 0; });
        celebrate = false;
        document.getElementById("cake-caption").textContent = "点击火焰 👆";
      }, 9000);
    }
  }

  /* ── 主题色跟随 ── */
  function applyTheme() {
    const pal = CAKE_COLORS[document.body.dataset.theme] || CAKE_COLORS.default;
    return pal; // 颜色在 drawCake 里实时读取
  }

  canvas.addEventListener("pointerdown", onTap);
  initCandles();
  requestAnimationFrame(loop);

  window.Cake = { init: initCandles, applyTheme: applyTheme };
})();
