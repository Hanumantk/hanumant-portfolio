/* =============================================================
   Renders the page from data.js and wires up interactions.
   You shouldn't need to edit this — content lives in data.js.
   ============================================================= */
(function () {
  "use strict";

  /* ---- Theme via [data-theme]; respects system on first load --- */
  var root = document.documentElement;
  var saved;
  try { saved = localStorage.getItem("theme"); } catch (e) { saved = null; }
  // Only stamp data-theme when the viewer has chosen; otherwise leave it
  // unset so prefers-color-scheme drives the first render.
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    syncThemeDots();
  }
  function syncThemeDots() {
    var active = currentTheme(); // "light" | "dark"
    document.querySelectorAll("#theme-toggle [data-theme-set]").forEach(function (dot) {
      var isActive = dot.getAttribute("data-theme-set") === active;
      if (isActive) dot.setAttribute("data-active", "");
      else dot.removeAttribute("data-active");
      dot.setAttribute("aria-pressed", String(isActive));
    });
  }

  /* ---- Lock zoom (pinch, ctrl+wheel, keyboard, double-tap) --- */
  (function lockZoom() {
    // ctrl/⌘ + mouse-wheel / trackpad pinch (desktop)
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    }, { passive: false });
    // ctrl/⌘ + (+ / - / = / 0) keyboard zoom
    window.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0", "_"].indexOf(e.key) !== -1) {
        e.preventDefault();
      }
    });
    // iOS Safari pinch gestures
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) {
      document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
    });
    // double-tap to zoom (touch)
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

  // Placeholder tones cycle through a calm, on-brand set.
  var TONES = [
    "oklch(42% 0.07 258)",
    "oklch(38% 0.045 285)",
    "oklch(44% 0.055 230)",
    "oklch(40% 0.06 300)",
    "oklch(43% 0.05 250)",
  ];

  // Hero-link glyphs (24x24 viewBox).
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
      var p = el("p", "hero__p" + (i === 0 ? " hero__p--first" : ""), para);
      wrap.appendChild(p);
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
      // external links open in a new tab; internal pages (e.g. resume.html) stay in-tab
      if (l.href && /^https?:\/\//i.test(l.href)) { a.target = "_blank"; a.rel = "noopener"; }
      a.appendChild(el("span", "hero-link__icon", ICONS[l.icon] || ""));
      a.appendChild(el("span", "hero-link__label", l.label));
      (cols[l.col === 2 ? 2 : 1]).appendChild(a);
    });
    nav.appendChild(cols[1]);
    nav.appendChild(cols[2]);
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

    // image / placeholder — uniform aspect ratio handled in CSS
    var imgwrap = el("div", "card__imgwrap");

    if (p.image) {
      var img = el("img", "card__img");
      img.src = p.image;
      img.alt = p.title;
      img.loading = "lazy";
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

    // hover pill button (desktop)
    var zone = el("div", "card__btnzone");
    var btn = el("div", "card__btn");
    btn.appendChild(el("span", "card__btn-label", p.title));
    btn.appendChild(el("span", "card__btn-arrow", ARROW));
    zone.appendChild(btn);
    a.appendChild(zone);

    group.appendChild(a);

    // caption (mobile / touch)
    var cap = el("div", "card__caption");
    cap.appendChild(el("span", "card__caption-title", p.title));
    cap.appendChild(el("span", "card__caption-tag", p.category || ""));
    group.appendChild(cap);

    wrap.appendChild(group);
    return wrap;
  }

  /* ---- Build feed (uniform grid) -------------------------- */
  function buildFeed() {
    document.getElementById("feed-label").textContent = SITE.indexLabel;

    var tab = document.getElementById("feed-tab");
    tab.textContent = SITE.category;

    var grid = document.getElementById("feed-grid");
    PROJECTS.forEach(function (p, i) {
      var card = buildCard(p, i);
      card.style.setProperty("--delay", (i * 0.08).toFixed(2) + "s");
      grid.appendChild(card);
    });

    positionUnderline(tab);
  }

  /* ---- Tab underline -------------------------------------- */
  function positionUnderline(tab) {
    var underline = document.getElementById("feed-underline");
    if (!underline || !tab) return;
    underline.style.width = tab.offsetWidth + "px";
    underline.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  /* ---- Footer --------------------------------------------- */
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
    // Back to top
    var li = el("li");
    var top = el("button", "footer__top", "Back to top");
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    li.appendChild(top);
    socials.appendChild(li);

    var mark = document.getElementById("footer-mark");
    if (mark) mark.textContent = f.mark || SITE.name || "";
  }

  /* ---- Scroll reveal -------------------------------------- */
  function observeReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          var replay = e.target.classList.contains("rise"); // project cards re-animate
          if (e.isIntersecting) {
            e.target.classList.add("in");
            if (!replay) io.unobserve(e.target); // hero/header reveal once
          } else if (replay) {
            // reset so the rise animation plays again next time it scrolls in
            e.target.classList.remove("in");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---- Init ----------------------------------------------- */
  function init() {
    document.title = SITE.fullName + ", " + SITE.role;
    buildHero();
    buildFeed();
    buildFooter();

    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.querySelectorAll("[data-theme-set]").forEach(function (dot) {
        dot.addEventListener("click", function () { setTheme(dot.getAttribute("data-theme-set")); });
      });
    }
    syncThemeDots();
    // follow the OS theme while the viewer hasn't chosen one
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!root.hasAttribute("data-theme")) syncThemeDots();
      });
    }

    observeReveals();

    // reposition underline on resize
    window.addEventListener("resize", function () {
      positionUnderline(document.getElementById("feed-tab"));
    });

    // reveal hero immediately
    requestAnimationFrame(function () {
      document.querySelectorAll(".hero .reveal").forEach(function (n, i) {
        n.style.setProperty("--delay", (i * 0.06).toFixed(2) + "s");
        n.classList.add("in");
      });
    });

    footerMarkMotion();
  }

  /* ---- Footer wordmark leans toward the cursor (subtle) ---- */
  function footerMarkMotion() {
    var frame = document.querySelector(".footer__frame");
    var mark = document.getElementById("footer-mark");
    if (!frame || !mark) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    frame.addEventListener("pointermove", function (e) {
      var r = frame.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..1
      mark.style.transform = "translateX(" + (dx * 10).toFixed(1) + "px) skewX(" + (dx * -1.5).toFixed(2) + "deg)";
    });
    frame.addEventListener("pointerleave", function () {
      mark.style.transform = "translateX(0) skewX(0deg)";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
