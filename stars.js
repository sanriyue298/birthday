/* ═══════════════════════════════════════════
   stars.js — 动态星空 + 流星背景
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;

  const stars = [];          // 静态星星
  const meteors = [];        // 流星
  const TWINKLE = 0.9;       // 闪烁星星比例

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildStars() {
    stars.length = 0;
    const count = Math.min(320, Math.floor((W * H) / 4200));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.3,
        base: Math.random() * Math.PI * 2,          // 相位
        speed: Math.random() * 0.02 + 0.005,        // 闪烁速度
        twinkle: Math.random() < TWINKLE,
        hue: Math.random() < 0.16
          ? (Math.random() < 0.5 ? 320 : 190)       // 偶尔粉/蓝色星星
          : 0,
        alpha: 0.4 + Math.random() * 0.6,
      });
    }
  }

  function spawnMeteor() {
    // 从屏幕上方偏侧出现
    const x = Math.random() * W * 0.75 + W * 0.1;
    const angle = Math.PI * 0.22 + Math.random() * Math.PI * 0.14; // 斜向
    const speed = 11 + Math.random() * 7;
    meteors.push({
      x: x,
      y: -20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      trail: [],
    });
  }

  function drawMeteor(m) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // 拖尾
    for (let i = 0; i < m.trail.length; i++) {
      const t = m.trail[i];
      const a = (i / m.trail.length) * m.life * 0.85;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 1.6 * (i / m.trail.length) + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180, 220, 255, " + a.toFixed(3) + ")";
      ctx.fill();
    }
    // 头部
    const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 14);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(160,200,255,0.55)");
    g.addColorStop(1, "rgba(160,200,255,0)");
    ctx.beginPath();
    ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 22) m.trail.shift();
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;
      if (m.life <= 0 || m.x > W + 60 || m.y > H + 60) meteors.splice(i, 1);
    }
  }

  let t = 0;
  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    // 静态星星（闪烁）
    for (const s of stars) {
      let a = s.alpha;
      if (s.twinkle) a *= 0.55 + 0.45 * Math.sin(t * s.speed + s.base);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      if (s.hue === 320) ctx.fillStyle = "rgba(255,150,220," + a.toFixed(3) + ")";
      else if (s.hue === 190) ctx.fillStyle = "rgba(150,220,255," + a.toFixed(3) + ")";
      else ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      ctx.fill();

      // 大星星加十字光芒
      if (s.r > 1.5 && a > 0.5) {
        ctx.strokeStyle = "rgba(255,255,255," + (a * 0.35).toFixed(3) + ")";
        ctx.lineWidth = 0.7;
        const len = s.r * 3.2;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }

    // 流星
    for (const m of meteors) drawMeteor(m);
    updateMeteors();
  }

  // 自动生成流星：随机间隔 2.5~7 秒
  function scheduleMeteor() {
    setTimeout(function () {
      if (!document.hidden) spawnMeteor();
      scheduleMeteor();
    }, 2500 + Math.random() * 4500);
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", function () { resize(); buildStars(); });
  resize();
  buildStars();
  loop();
  scheduleMeteor();

  // 暴露接口
  window.StarsFX = {
    spawnMeteor: spawnMeteor,
  };
})();
