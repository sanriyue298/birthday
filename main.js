/* ═══════════════════════════════════════════
   main.js — 主逻辑
   设置（名字/日期/主题）、倒计时、打字机祝福、
   许愿流星、气球、导航、音乐控制
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };

  const DEFAULT_NAME = "亲爱的";
  const STORAGE_KEY = "bday_settings_v1";
  const WISH_KEY = "bday_wishes_v1";

  /* ═══════════ 设置 ═══════════ */
  let settings = loadSettings();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({ name: DEFAULT_NAME, date: "", theme: "default" }, JSON.parse(raw));
    } catch (e) {}
    return { name: DEFAULT_NAME, date: "", theme: "default" };
  }
  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function applySettings() {
    document.body.dataset.theme = settings.theme;
    $("birthday-name").textContent = settings.name;
    $("countdown-name").textContent = settings.name;
    $("set-name").value = settings.name;
    $("set-date").value = settings.date;
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.theme === settings.theme);
    });
    updateCountdown();
    updateCountdownMsg();
  }

  /* ═══════════ 加载屏 ═══════════ */
  window.addEventListener("load", function () {
    setTimeout(function () {
      $("loader").classList.add("hidden");
      // 首次进入：静默欢迎烟花（不震动、不发声，避免干扰随后弹出的设置窗口）
      if (window.Fireworks) {
        window.Fireworks.barrage(false);
        setTimeout(function () { window.Fireworks.bigText("🎉 欢迎"); }, 300);
      }
      if (window.Confetti) setTimeout(function () { window.Confetti.rain(90); }, 500);
    }, 1600);
  });

  /* ═══════════ 倒计时 ═══════════ */
  function getNextBirthday(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const now = new Date();
    let target = new Date(now.getFullYear(), month, day, 0, 0, 0);
    // 如果今天就是生日或已过，则取明年
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (target < today) target = new Date(now.getFullYear() + 1, month, day, 0, 0, 0);
    return target;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function updateCountdown() {
    const target = getNextBirthday(settings.date);
    if (!target) return;
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    $("cd-days").textContent = pad(days);
    $("cd-hours").textContent = pad(hours);
    $("cd-mins").textContent = pad(mins);
    $("cd-secs").textContent = pad(secs);
  }

  function updateCountdownMsg() {
    const target = getNextBirthday(settings.date);
    const el = $("countdown-msg");
    if (!target) {
      el.textContent = "💡 点击右上角 ⚙️ 设置生日日期，开启倒计时！";
      return;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = target.getTime() === today.getTime();
    if (isToday) {
      el.textContent = "🎂🎉 就是今天！" + settings.name + " 生日快乐！！";
    } else {
      el.textContent = "🎂 一起期待那一天的到来吧！";
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  /* ═══════════ 打字机祝福轮播 ═══════════ */
  const MESSAGES = [
    "🎈 祝你生日快乐，愿每一天都像今天一样闪闪发光！",
    "🌟 愿所有的美好和幸运，都奔向你！",
    "💖 愿你的世界永远充满爱与欢笑！",
    "🍰 今天的主角是你，尽情享受吧！",
    "🌈 愿你眼里有光，心中有爱，未来可期！",
    "🦄 独一无二的你，值得世间所有的温柔！",
    "🎁 惊喜和礼物会迟到，但祝福从不缺席！",
    "✨ 新的一岁，愿你成为更好的自己！",
  ];

  let msgIndex = 0;
  let typing = false;

  function typeMessage(text, el) {
    typing = true;
    // 按 Unicode 码点切分，避免 emoji 被代理对截断
    const chars = Array.from(text);
    let i = 0;
    el.innerHTML = "";
    (function step() {
      if (i <= chars.length) {
        el.textContent = chars.slice(0, i).join("");
        i++;
        setTimeout(step, 46);
      } else {
        typing = false;
      }
    })();
  }

  function showMessage(index) {
    const el = $("msg-text");
    const text = MESSAGES[index % MESSAGES.length];
    typeMessage(text, el);
    document.querySelectorAll("#msg-dots span").forEach(function (d, i) {
      d.classList.toggle("active", i === index % MESSAGES.length);
    });
  }

  function buildDots() {
    const dots = $("msg-dots");
    dots.innerHTML = "";
    MESSAGES.forEach(function (_, i) {
      const s = document.createElement("span");
      s.addEventListener("click", function () {
        msgIndex = i;
        showMessage(i);
      });
      dots.appendChild(s);
    });
  }

  function rotateMessage() {
    msgIndex++;
    showMessage(msgIndex);
  }

  buildDots();
  showMessage(0);
  setInterval(function () {
    if (!typing) rotateMessage();
  }, 5200);

  /* ═══════════ 许愿 ═══════════ */
  function loadWishes() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; } catch (e) { return []; }
  }
  function saveWishes(list) {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function renderWishes() {
    const box = $("wish-history");
    box.innerHTML = "";
    const list = loadWishes();
    list.slice(-5).reverse().forEach(function (w, i) {
      const div = document.createElement("div");
      div.className = "wish-item" + (i === 0 && list.length > 0 ? " star" : "");
      div.textContent = w;
      box.appendChild(div);
    });
  }

  $("btn-wish").addEventListener("click", function () {
    const input = $("wish-input");
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    const list = loadWishes();
    list.push(text);
    saveWishes(list);
    input.value = "";

    // 特效：流星 + 彩带 + 音效
    if (window.StarsFX) window.StarsFX.spawnMeteor();
    setTimeout(function () { if (window.StarsFX) window.StarsFX.spawnMeteor(); }, 400);
    if (window.Confetti) window.Confetti.burstAt(window.innerWidth / 2, window.innerHeight * 0.35, 60);
    if (window.SFX) window.SFX.wish();
    renderWishes();

    // 按钮反馈
    const btn = $("btn-wish");
    btn.textContent = "🌟 已许愿！";
    setTimeout(function () { btn.textContent = "✨ 许愿"; }, 1400);
  });

  renderWishes();

  /* ═══════════ 气球 ═══════════ */
  const BALLOON_EMOJI = ["🎈", "🎈", "🎀", "🎁", "🌟", "🎊", "💖", "🪅"];
  function spawnBalloon() {
    const layer = $("balloons-layer");
    const el = document.createElement("div");
    el.className = "balloon";
    el.textContent = BALLOON_EMOJI[Math.floor(Math.random() * BALLOON_EMOJI.length)];
    el.style.left = Math.random() * 96 + "%";
    el.style.fontSize = 30 + Math.random() * 30 + "px";
    const dur = 14 + Math.random() * 14;
    el.style.animationDuration = dur + "s";
    el.style.animationDelay = (-Math.random() * dur) + "s";
    layer.appendChild(el);
    // 清理
    setTimeout(function () { el.remove(); }, dur * 1000 + 2000);
  }
  // 气球数量按屏幕宽度自适应（手机少一些，保证流畅）
  const balloonCount = window.innerWidth < 768 ? 5 : 9;
  for (let i = 0; i < balloonCount; i++) spawnBalloon();
  setInterval(spawnBalloon, window.innerWidth < 768 ? 9000 : 6000);

  /* ═══════════ 音乐按钮 ═══════════ */
  const musicBtn = $("btn-music");
  function refreshMusicIcon() {
    musicBtn.innerHTML = "<span>" + (window.Music.isPlaying() ? "🔊" : "🔇") + "</span>";
  }
  musicBtn.addEventListener("click", function () {
    const on = window.Music.toggle();
    refreshMusicIcon();
    if (on) {
      // 播放时来一发彩带
      if (window.Confetti) window.Confetti.cannons("both");
      if (window.Fireworks) window.Fireworks.launch(undefined, undefined, { type: "ring" });
    }
  });
  refreshMusicIcon();

  /* ═══════════ 大按钮：放烟花 ═══════════ */
  $("btn-boom").addEventListener("click", function () {
    if (window.Fireworks) window.Fireworks.barrage();
    if (window.SFX) window.SFX.whoosh();
  });

  /* ═══════════ 导航 ═══════════ */
  const navBtns = document.querySelectorAll(".nav-btn[data-target]");
  navBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      // 高亮当前
      navBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });

  // 滚动时高亮导航
  const sections = ["hero", "countdown", "cake", "wish", "messages"];
  window.addEventListener("scroll", function () {
    const pos = window.scrollY + window.innerHeight * 0.45;
    let current = "hero";
    for (const id of sections) {
      const sec = document.getElementById(id);
      if (sec && sec.offsetTop <= pos) current = id;
    }
    navBtns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.target === current);
    });
  }, { passive: true });

  /* ═══════════ 设置弹窗 ═══════════ */
  const modal = $("settings-modal");
  $("btn-settings").addEventListener("click", function () {
    applySettings();
    modal.classList.add("show");
  });
  $("btn-cancel-settings").addEventListener("click", function () {
    modal.classList.remove("show");
  });
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.classList.remove("show");
  });

  document.querySelectorAll(".theme-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".theme-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      settings.theme = btn.dataset.theme;
      applySettings();
    });
  });

  $("btn-save-settings").addEventListener("click", function () {
    settings.name = ($("set-name").value.trim() || DEFAULT_NAME).slice(0, 12);
    settings.date = $("set-date").value;
    saveSettings();
    applySettings();
    modal.classList.remove("show");
    // 保存后庆祝一下
    if (window.Confetti) window.Confetti.burst(150);
    if (window.Fireworks) window.Fireworks.bigText("🎉 设置完成");
  });

  /* ═══════════ 初始化 ═══════════ */
  applySettings();

  // 首次访问：自动弹出设置
  if (!localStorage.getItem(STORAGE_KEY)) {
    setTimeout(function () { modal.classList.add("show"); }, 2300);
  }

  // 键盘 Esc 关闭弹窗
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") modal.classList.remove("show");
  });

  // 页面可见时恢复自动烟花
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && window.Fireworks) window.Fireworks.startAuto();
  });
})();
