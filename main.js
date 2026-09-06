/* =============================================================
   Renders the page from data.js and wires up interactions +
   the motion system (preloader, choreographed entrance,
   animated theme, pointer-reactive dot field, card reveals).
   Content lives in data.js.
   ============================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js"); // progressive-enhancement gate (also set inline in <head>)

  function prefersReduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- Theme palettes (mirror the CSS tokens exactly) ------ */
  var THEME = {
    light: { "--grad-top": "#cde4ff", "--grad-bottom": "#ffffff", "--dot": "#8b8b8b",
             "--c-heading": "#00489f", "--c-body": "#4e4e4e", "--c-text": "#1c1c1e",
             "--c-muted": "#6b6b6b", "--c-card": "#eef1f5", "--c-mark": "#eef1f5",
             "--c-border": "rgba(20,24,40,0.12)" },
    dark:  { "--grad-top": "#1b2a3c", "--grad-bottom": "#000000", "--dot": "#898989",
             "--c-heading": "#ffffff", "--c-body": "#d6d6d6", "--c-text": "#ededf2",
             "--c-muted": "#9aa3ad", "--c-card": "#14202e", "--c-mark": "#0e1621",
             "--c-border": "rgba(220,230,245,0.16)" },
  };
  var TWEEN_VARS = Object.keys(THEME.light);
  var ACCENT = [38, 136, 255]; // #2688ff

  /* ---- Colour utilities ----------------------------------- */
  function parseColor(str) {
    str = (str || "").trim();
    if (str.charAt(0) === "#") {
      var h = str.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
    }
    var m = str.match(/rgba?\(([^)]+)\)/);
    if (m) {
      var p = m[1].split(",").map(function (v) { return parseFloat(v); });
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    return [0, 0, 0, 1];
  }
  function fmtColor(c) {
    var r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
    return c[3] >= 1 ? "rgb(" + r + "," + g + "," + b + ")"
      : "rgba(" + r + "," + g + "," + b + "," + (Math.round(c[3] * 1000) / 1000) + ")";
  }
  function lerpC(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
  }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---- Theme control -------------------------------------- */
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    return (t === "light" || t === "dark") ? t : systemTheme();
  }
  var themeName = currentTheme();
  var themeRAF = null;
  var dotField = null;

  function clearTweenVars() { TWEEN_VARS.forEach(function (v) { root.style.removeProperty(v); }); }
  function cancelThemeTween() { if (themeRAF) { cancelAnimationFrame(themeRAF); themeRAF = null; } }

  function setTheme(theme, animate) {
    var prev = themeName;
    themeName = theme;
    try { localStorage.setItem("theme", theme); } catch (e) {}
    syncThemeDots();

    if (!animate || prefersReduced() || document.hidden || !window.requestAnimationFrame) {
      cancelThemeTween();
      clearTweenVars();
      root.setAttribute("data-theme", theme);
      if (dotField) dotField.setBase(THEME[theme]["--dot"]);
      return;
    }

    var cs = getComputedStyle(root);
    var from = TWEEN_VARS.map(function (v) {
      var val = cs.getPropertyValue(v).trim();
      return parseColor(val || THEME[prev][v]);
    });
    var to = TWEEN_VARS.map(function (v) { return parseColor(THEME[theme][v]); });
    var fromDot = parseColor(THEME[prev]["--dot"]);
    var toDot = parseColor(THEME[theme]["--dot"]);
    // non-tweened tokens follow via their own CSS transition
    root.setAttribute("data-theme", theme);

    cancelThemeTween();
    var start = performance.now(), dur = 420;
    (function step(now) {
      var t = Math.min((now - start) / dur, 1), e = easeInOut(t);
      for (var i = 0; i < TWEEN_VARS.length; i++) {
        root.style.setProperty(TWEEN_VARS[i], fmtColor(lerpC(from[i], to[i], e)));
      }
      if (dotField) dotField.setBase(fmtColor(lerpC(fromDot, toDot, e)));
      if (t < 1) { themeRAF = requestAnimationFrame(step); }
      else { themeRAF = null; clearTweenVars(); if (dotField) dotField.setBase(THEME[theme]["--dot"]); }
    })(start);
  }

  function syncThemeDots() {
    var active = currentTheme();
    document.querySelectorAll("#theme-toggle [data-theme-set]").forEach(function (dot) {
      var on = dot.getAttribute("data-theme-set") === active;
      if (on) dot.setAttribute("data-active", ""); else dot.removeAttribute("data-active");
      dot.setAttribute("aria-pressed", String(on));
    });
  }

  /* ---- Lock zoom (pinch, ctrl+wheel, keyboard, double-tap) - */
  (function lockZoom() {
    window.addEventListener("wheel", function (e) { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0", "_"].indexOf(e.key) !== -1) e.preventDefault();
    });
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) {
      document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
    });
    var lastTouch = 0;
    document.addEventListener("touchend", function (e) {
      var now = Date.now();
      if (now - lastTouch <= 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  })();

  /* ---- Small helpers -------------------------------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var PIN =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.9 6.4.5-4.9 4.1 1.6 6.2L12 15.9 6.5 18.7l1.6-6.2L3.2 8.4l6.4-.5z"/></svg>';

  var TONES = [
    "oklch(42% 0.07 258)", "oklch(38% 0.045 285)", "oklch(44% 0.055 230)",
    "oklch(40% 0.06 300)", "oklch(43% 0.05 250)",
  ];

  var ICONS = {
    linkedin:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.45V23H.25zM8.1 8.25h4.27v2.02h.06c.6-1.13 2.05-2.32 4.22-2.32 4.51 0 5.34 2.97 5.34 6.83V23h-4.45v-6.53c0-1.56-.03-3.56-2.17-3.56-2.17 0-2.5 1.7-2.5 3.45V23H8.1z"/></svg>',
    behance:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.3 6.9c.66 0 1.26.06 1.8.18.54.1 1 .3 1.38.55.38.26.68.6.89 1.04.2.43.3.97.3 1.6 0 .69-.15 1.26-.47 1.72-.31.45-.78.83-1.4 1.12.85.24 1.48.67 1.9 1.28.42.6.62 1.34.62 2.19 0 .69-.13 1.29-.4 1.79-.27.5-.63.92-1.09 1.24-.45.32-.98.56-1.57.71-.59.15-1.2.23-1.82.23H2V6.9zm-.36 4.85c.54 0 .98-.13 1.33-.38.34-.26.51-.67.51-1.25 0-.32-.06-.58-.17-.79-.12-.2-.28-.36-.48-.47-.2-.11-.43-.19-.69-.23-.26-.05-.53-.07-.81-.07H4.9v3.19zm.16 5.09c.3 0 .58-.03.85-.09.27-.05.5-.15.7-.28.2-.14.37-.32.49-.55.12-.23.18-.53.18-.89 0-.7-.2-1.2-.59-1.5-.39-.3-.92-.45-1.57-.45H4.9v3.76zM16.5 16.9c.37.36.9.54 1.6.54.5 0 .93-.13 1.29-.38.36-.25.58-.52.66-.8h2.36c-.38 1.17-.96 2.01-1.74 2.51-.78.5-1.73.75-2.83.75-.77 0-1.46-.12-2.08-.37-.62-.24-1.14-.59-1.57-1.04-.43-.45-.76-.98-.99-1.61-.23-.62-.35-1.31-.35-2.06 0-.73.12-1.4.36-2.02.24-.62.58-1.16 1.02-1.61.44-.45.96-.81 1.57-1.06.61-.26 1.28-.39 2.02-.39.82 0 1.54.16 2.15.48.61.32 1.11.74 1.5 1.28.39.53.67 1.14.84 1.83.17.68.23 1.4.18 2.15h-6.99c0 .77.19 1.34.55 1.71zM19.4 12c-.29-.32-.76-.5-1.38-.5-.4 0-.74.07-1 .21-.27.14-.48.31-.64.51-.16.2-.27.42-.33.64-.06.22-.1.42-.11.6h4.32c-.06-.68-.29-1.16-.58-1.46zM14.7 7.34h5.4V8.7h-5.4z"/></svg>',
    resume:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  };

  /* ---- Build hero ----------------------------------------- */
  function buildHero() {
    document.getElementById("hero-title").textContent = "Hi, I'm " + SITE.name;
    document.getElementById("hero-role").textContent = SITE.role;
    var wrap = document.getElementById("hero-copy");
    SITE.intro.forEach(function (para, i) {
      wrap.appendChild(el("p", "hero__p" + (i === 0 ? " hero__p--first" : ""), para));
    });
    buildHeroLinks();
  }

  function buildHeroLinks() {
    var nav = document.getElementById("hero-links");
    if (!nav) return;
    var links = SITE.heroLinks || [];
    if (!links.length) { nav.style.display = "none"; return; }
    var cols = { 1: el("div", "hero-links__col"), 2: el("div", "hero-links__col") };
    links.forEach(function (l) {
      var a = el("a", "hero-link" + (l.accent ? " hero-link--accent" : ""));
      a.href = l.href || "#";
      if (l.href && /^https?:\/\//i.test(l.href)) { a.target = "_blank"; a.rel = "noopener"; }
      a.appendChild(el("span", "hero-link__icon", ICONS[l.icon] || ""));
      a.appendChild(el("span", "hero-link__label", l.label));
      (cols[l.col === 2 ? 2 : 1]).appendChild(a);
    });
    nav.appendChild(cols[1]);
    nav.appendChild(cols[2]);
  }

  /* Split the headline into per-word spans (decorative), while
     keeping an unsplit accessible name on the <h1>. */
  function splitHeadline(node) {
    if (!node) return [];
    var text = (node.textContent || "").trim();
    node.setAttribute("aria-label", text);
    node.textContent = "";
    var words = text.split(" "), spans = [];
    words.forEach(function (word, i) {
      var w = el("span", "hl-word");
      w.setAttribute("aria-hidden", "true");
      w.textContent = word;
      node.appendChild(w);
      if (i < words.length - 1) node.appendChild(document.createTextNode(" "));
      spans.push(w);
    });
    return spans;
  }

  /* ---- Build one project card ----------------------------- */
  function buildCard(p, index) {
    var wrap = el("div", "group-wrap rise reveal");
    var group = el("div", "group");
    group.style.position = "relative";
    var a = el("a", "card");
    a.href = p.link || "#";
    if (p.link && p.link !== "#") { a.target = "_blank"; a.rel = "noopener"; }
    a.setAttribute("aria-label", p.title);
    var imgwrap = el("div", "card__imgwrap");
    if (p.image) {
      var img = el("img", "card__img");
      img.src = p.image; img.alt = p.title; img.loading = "lazy";
      imgwrap.appendChild(img);
    } else {
      var ph = el("div", "card__ph");
      ph.style.setProperty("--ph-tone", TONES[index % TONES.length]);
      ph.appendChild(el("span", "card__ph-index", String(index + 1).padStart(2, "0")));
      imgwrap.appendChild(ph);
    }
    a.appendChild(imgwrap);
    if (p.pinned) {
      var badge = el("div", "pin-badge", PIN);
      badge.setAttribute("title", "Pinned");
      a.appendChild(badge);
    }
    var zone = el("div", "card__btnzone");
    var btn = el("div", "card__btn");
    btn.appendChild(el("span", "card__btn-label", p.title));
    btn.appendChild(el("span", "card__btn-arrow", ARROW));
    zone.appendChild(btn);
    a.appendChild(zone);
    group.appendChild(a);
    var cap = el("div", "card__caption");
    cap.appendChild(el("span", "card__caption-title", p.title));
    cap.appendChild(el("span", "card__caption-tag", p.category || ""));
    group.appendChild(cap);
    wrap.appendChild(group);
    return wrap;
  }

  function buildFeed() {
    document.getElementById("feed-label").textContent = SITE.indexLabel;
    var tab = document.getElementById("feed-tab");
    tab.textContent = SITE.category;
    var grid = document.getElementById("feed-grid");
    PROJECTS.forEach(function (p, i) { grid.appendChild(buildCard(p, i)); });
    positionUnderline(tab);
  }

  function positionUnderline(tab) {
    var underline = document.getElementById("feed-underline");
    if (!underline || !tab) return;
    underline.style.width = tab.offsetWidth + "px";
    underline.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  function buildFooter() {
    var f = SITE.footer || {};
    var place = document.getElementById("footer-place");
    var quip = document.getElementById("footer-quip");
    if (place) place.textContent = f.place || "";
    if (quip) quip.textContent = f.quip || "";
    var socials = document.getElementById("footer-socials");
    (f.links || []).forEach(function (l) {
      var li = el("li");
      var a = el("a", null, l.label);
      a.href = l.href || "#";
      if (l.href && l.href !== "#") { a.target = "_blank"; a.rel = "noopener"; }
      li.appendChild(a);
      socials.appendChild(li);
    });
    var li = el("li");
    var top = el("button", "footer__top", "Back to top");
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" }); });
    li.appendChild(top);
    socials.appendChild(li);
    var mark = document.getElementById("footer-mark");
    if (mark) mark.textContent = f.mark || SITE.name || "";
  }

  /* ---- Card scroll reveal (staggered, replays on scroll) --- */
  function observeReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      // stagger cards entering together, by their document order in this batch
      var entering = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      entering.forEach(function (e, i) {
        e.target.style.setProperty("--delay", (i * 0.09).toFixed(2) + "s");
        e.target.classList.add("in");
        if (!e.target.classList.contains("rise")) io.unobserve(e.target);
      });
      entries.forEach(function (e) {
        if (!e.isIntersecting && e.target.classList.contains("rise")) e.target.classList.remove("in");
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (i) { io.observe(i); });
  }

  /* =============================================================
     Pointer-reactive dot field (canvas) — replaces the CSS dots
     inside the hero. Dots spring away from the cursor with a soft
     falloff and pick up an accent tint that fades with distance.
     ============================================================= */
  function DotField(hero) {
    var canvas = el("canvas", "dotfield");
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var SPACING = 68, DOTR = 2, RADIUS = 130, FALL = 0.85;
    var dots = [], w = 0, h = 0, rect = { left: 0, top: 0 };
    var base = parseColor(THEME[themeName]["--dot"]);
    var pointer = { x: -9999, y: -9999, active: false };
    var rafId = null, running = false, inView = true, restimer = null;

    function measure() {
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = canvas.getBoundingClientRect();
      dots = [];
      for (var y = 50; y < h; y += SPACING) {
        for (var x = 44; x < w; x += SPACING) {
          dots.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0 });
        }
      }
    }
    function alphaAt(yr) { return yr < 0.52 ? 1 : yr > 0.82 ? 0 : 1 - (yr - 0.52) / 0.30; }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      var moving = false;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var a = alphaAt(d.hy / h);
        if (a <= 0) continue;
        // spring to home
        d.vx += (d.hx - d.x) * 0.055;
        d.vy += (d.hy - d.y) * 0.055;
        // repulsion from pointer
        var prox = 0;
        if (pointer.active) {
          var dx = d.x - pointer.x, dy = d.y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RADIUS) {
            prox = 1 - dist / RADIUS;
            var f = Math.pow(prox, FALL) * 5.2;
            var inv = dist || 0.0001;
            d.vx += (dx / inv) * f;
            d.vy += (dy / inv) * f;
          }
        }
        d.vx *= 0.86; d.vy *= 0.86;
        d.x += d.vx; d.y += d.vy;
        if (Math.abs(d.vx) + Math.abs(d.vy) > 0.05 || Math.abs(d.hx - d.x) + Math.abs(d.hy - d.y) > 0.5) moving = true;
        var col = prox > 0.01 ? lerpC(base, [ACCENT[0], ACCENT[1], ACCENT[2], 1], Math.min(prox * 1.3, 1)) : base;
        ctx.beginPath();
        ctx.arc(d.x, d.y, DOTR, 0, 6.2832);
        ctx.fillStyle = "rgba(" + Math.round(col[0]) + "," + Math.round(col[1]) + "," + Math.round(col[2]) + "," + a.toFixed(3) + ")";
        ctx.fill();
      }
      if (running && (moving || pointer.active)) { rafId = requestAnimationFrame(frame); }
      else { rafId = null; } // idle: stop until the pointer wakes it
    }
    function wake() { if (running && rafId === null) rafId = requestAnimationFrame(frame); }
    function start() { if (!running) { running = true; wake(); } }
    function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    function onMove(e) {
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= -RADIUS && pointer.x <= w + RADIUS && pointer.y >= -RADIUS && pointer.y <= h + RADIUS;
      if (pointer.active && running) wake();
    }
    function onLeave() { pointer.active = false; wake(); }
    function onScroll() { rect = canvas.getBoundingClientRect(); }
    function onResize() { clearTimeout(resimer); resimer = setTimeout(function () { measure(); wake(); }, 150); }
    var resimer = null;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (inView) { start(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !document.hidden) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    }

    measure();
    start();

    this.setBase = function (color) { base = parseColor(color); wake(); };
  }

  /* =============================================================
     Preloader + choreographed hero entrance
     ============================================================= */
  // animate a node in and bake the final state into inline style on finish
  // (so it persists reliably even if the Animation object is released)
  function animateIn(node, from, dur, delay) {
    if (!node) return;
    var a = node.animate([from, { opacity: 1, transform: "none" }],
      { duration: dur, delay: delay, easing: "cubic-bezier(.2,.75,.25,1)", fill: "both" });
    a.addEventListener("finish", function () {
      try { a.commitStyles(); a.cancel(); } catch (e) {}
    });
  }

  var HERO_ANIM_SELECTOR = "#theme-toggle, .hl-word, #hero-role, #hero-copy .hero__p, #hero-links .hero-link";
  function heroEntrance(words) {
    var t = 0;
    animateIn(document.getElementById("theme-toggle"), { opacity: 0, transform: "scale(.72)" }, 500, t);
    t += 150;
    (words || []).forEach(function (w) {
      animateIn(w, { opacity: 0, transform: "translateY(.55em)" }, 620, t);
      t += 66;
    });
    t += 40;
    animateIn(document.getElementById("hero-role"), { opacity: 0, transform: "translateY(12px)" }, 560, t);
    t += 110;
    document.querySelectorAll("#hero-copy .hero__p").forEach(function (p) {
      animateIn(p, { opacity: 0, transform: "translateY(14px)" }, 600, t); t += 110;
    });
    t += 20;
    document.querySelectorAll("#hero-links .hero-link").forEach(function (a) {
      animateIn(a, { opacity: 0, transform: "translateY(12px)" }, 520, t); t += 78;
    });
    // safety: guarantee everything ends visible even if a frame source stalls
    setTimeout(function () {
      document.querySelectorAll(HERO_ANIM_SELECTOR).forEach(function (n) {
        n.getAnimations().forEach(function (a) { try { a.finish(); } catch (e) {} });
      });
    }, t + 1400);
  }

  // Play the entrance, but never hide the hero in a background tab —
  // wait until the page is actually visible so it can't get stuck hidden.
  function playEntrance(words) {
    if (!document.hidden) { heroEntrance(words); return; }
    var onShow = function () {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onShow);
      heroEntrance(words);
    };
    document.addEventListener("visibilitychange", onShow);
  }

  function runIntro(words) {
    var pre = document.getElementById("preloader");
    if (prefersReduced() || !pre || !document.body.animate) {
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      return;
    }
    var replay = false;
    try { replay = sessionStorage.getItem("introSeen") === "1"; } catch (e) {}
    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}
    var hold = replay ? 180 : 900;
    setTimeout(function () {
      playEntrance(words);       // hides hero elements (fill) + schedules reveal
      pre.classList.add("is-done");
      var done = function () {
        pre.removeEventListener("transitionend", done);
        if (pre.parentNode) pre.parentNode.removeChild(pre);
      };
      pre.addEventListener("transitionend", done);
      setTimeout(done, 900);
    }, hold);
  }

  /* ---- Footer wordmark leans toward the cursor (subtle) ---- */
  function footerMarkMotion() {
    var frame = document.querySelector(".footer__frame");
    var mark = document.getElementById("footer-mark");
    if (!frame || !mark || prefersReduced() || window.matchMedia("(hover: none)").matches) return;
    frame.addEventListener("pointermove", function (e) {
      var r = frame.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      mark.style.transform = "translateX(" + (dx * 10).toFixed(1) + "px) skewX(" + (dx * -1.5).toFixed(2) + "deg)";
    });
    frame.addEventListener("pointerleave", function () { mark.style.transform = "translateX(0) skewX(0deg)"; });
  }

  /* ---- Init ----------------------------------------------- */
  function init() {
    document.title = SITE.fullName + ", " + SITE.role;
    buildHero();
    buildFeed();
    buildFooter();

    var words = splitHeadline(document.getElementById("hero-title"));

    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.querySelectorAll("[data-theme-set]").forEach(function (dot) {
        dot.addEventListener("click", function () { setTheme(dot.getAttribute("data-theme-set"), true); });
      });
    }
    syncThemeDots();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!root.hasAttribute("data-theme")) { themeName = systemTheme(); syncThemeDots(); if (dotField) dotField.setBase(THEME[themeName]["--dot"]); }
      });
    }

    observeReveals();
    window.addEventListener("resize", function () { positionUnderline(document.getElementById("feed-tab")); });

    // Pointer-reactive dot field (motion only) — CSS dots are the fallback
    var heroBand = document.querySelector(".hero-band");
    if (heroBand && !prefersReduced() && window.requestAnimationFrame && document.createElement("canvas").getContext) {
      try { dotField = new DotField(heroBand); document.body.classList.add("dotfield-on"); } catch (e) { dotField = null; }
    }

    runIntro(words);
    footerMarkMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
