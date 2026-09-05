/* =============================================================
   Renders the page from data.js and wires up interactions.
   You shouldn't need to edit this — content lives in data.js.
   ============================================================= */
(function () {
  "use strict";

  /* ---- Theme (dark by default, remembered per browser) ---- */
  var root = document.documentElement;
  var saved;
  try { saved = localStorage.getItem("theme"); } catch (e) { saved = null; }
  if (saved === "light") root.classList.remove("dark");
  else root.classList.add("dark"); // default dark, matches reference

  function setTheme(dark) {
    root.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
  }

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

  /* ---- Build hero ----------------------------------------- */
  function buildHero() {
    document.getElementById("hero-title").textContent = "Hi, I'm " + SITE.name;
    document.getElementById("hero-role").textContent = SITE.role;

    var wrap = document.getElementById("hero-copy");
    SITE.intro.forEach(function (para, i) {
      var p = el("p", "hero__p" + (i === 0 ? " hero__p--first" : ""), para);
      wrap.appendChild(p);
    });
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

    // image / placeholder
    var ratio = p.ratio || 1.1;
    var imgwrap = el("div", "card__imgwrap");
    imgwrap.style.paddingBottom = ratio * 100 + "%";

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

  /* ---- Build feed (2-column masonry) ---------------------- */
  function buildFeed() {
    document.getElementById("feed-label").textContent = SITE.indexLabel;

    var tab = document.getElementById("feed-tab");
    tab.textContent = SITE.category;

    var left = document.getElementById("feed-col-left");
    var right = document.getElementById("feed-col-right");
    var isTwoCol = window.matchMedia("(min-width: 768px)").matches;

    PROJECTS.forEach(function (p, i) {
      var card = buildCard(p, i);
      card.style.setProperty("--delay", (i * 0.08).toFixed(2) + "s");
      if (isTwoCol) {
        (i % 2 === 0 ? left : right).appendChild(card);
      } else {
        left.appendChild(card);
      }
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
    function syncToggle() {
      var dark = root.classList.contains("dark");
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    syncToggle();
    toggle.addEventListener("click", function () {
      setTheme(!root.classList.contains("dark"));
      syncToggle();
    });

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
