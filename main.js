/* Hanumant Kulkarni — content rendering and motion system */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var finePointerQuery = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;
  var gsap = window.gsap || null;
  var ScrollTrigger = window.ScrollTrigger || null;
  var homeLenis = null;
  var homeLenisTicker = null;

  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  function prefersReduced() {
    return !!(motionQuery && motionQuery.matches);
  }

  function addMediaListener(query, fn) {
    if (!query) return;
    if (query.addEventListener) query.addEventListener("change", fn);
    else if (query.addListener) query.addListener(fn);
  }

  function initHomeLenis() {
    if (homeLenis || prefersReduced() || document.body.classList.contains("intro-active") || document.body.getAttribute("data-smooth-scroll") !== "true" || typeof window.Lenis !== "function") return;
    var useGsapTicker = !!gsap;
    homeLenis = new window.Lenis({
      autoRaf: !useGsapTicker,
      anchors: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.07,
      wheelMultiplier: 0.88
    });
    window.homeLenis = homeLenis;

    if (ScrollTrigger) homeLenis.on("scroll", ScrollTrigger.update);
    if (useGsapTicker) {
      homeLenisTicker = function (time) { homeLenis.raf(time * 1000); };
      gsap.ticker.add(homeLenisTicker);
      gsap.ticker.lagSmoothing(0);
    }
  }

  function stopHomeLenis() {
    if (homeLenis) homeLenis.stop();
  }

  function destroyHomeLenis() {
    if (!homeLenis) return;
    if (gsap && homeLenisTicker) gsap.ticker.remove(homeLenisTicker);
    homeLenisTicker = null;
    try { homeLenis.destroy(); } catch (e) {}
    homeLenis = null;
    window.homeLenis = null;
    root.classList.remove("lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped");
  }

  function resumeHomeLenis() {
    if (!homeLenis || prefersReduced() || document.body.classList.contains("intro-active")) return;
    homeLenis.start();
    homeLenis.resize();
    try { homeLenis.scrollTo(window.scrollY, { immediate: true, force: true }); } catch (e) {}
  }

  var THEME = {
    light: {
      "--grad-top": "#cde4ff", "--grad-bottom": "#ffffff", "--dot": "#78818c",
      "--c-heading": "#00489f", "--c-body": "#454b52", "--c-text": "#17191c",
      "--c-muted": "#5c626a", "--c-link": "#005fbd", "--c-accent": "#086ed7",
      "--c-focus": "#005fbd", "--c-control-dot": "#68717c", "--c-card": "#edf2f7",
      "--c-mark": "#edf1f5", "--c-border": "rgba(20,24,40,0.15)"
    },
    dark: {
      "--grad-top": "#1b2a3c", "--grad-bottom": "#000000", "--dot": "#8f98a2",
      "--c-heading": "#ffffff", "--c-body": "#d6dbe1", "--c-text": "#f1f3f6",
      "--c-muted": "#a7b0bb", "--c-link": "#63adff", "--c-accent": "#4097ff",
      "--c-focus": "#76b8ff", "--c-control-dot": "#9da6b0", "--c-card": "#14202e",
      "--c-mark": "#0e1621", "--c-border": "rgba(220,230,245,0.19)"
    }
  };
  var TWEEN_VARS = Object.keys(THEME.light);
  var themeRaf = null;
  var themeTransitionId = 0;
  var themeTransitionActive = false;
  var dotField = null;
  var pageIsInert = false;
  var curtainCoversHero = false;

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    return explicit === "light" || explicit === "dark" ? explicit : systemTheme();
  }

  var themeName = currentTheme();

  function parseColor(value) {
    var str = (value || "").trim();
    if (str.charAt(0) === "#") {
      var hex = str.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      var number = parseInt(hex, 16);
      return [(number >> 16) & 255, (number >> 8) & 255, number & 255, 1];
    }
    var match = str.match(/rgba?\(([^)]+)\)/);
    if (!match) return [0, 0, 0, 1];
    var parts = match[1].split(",").map(function (part) { return parseFloat(part); });
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }

  function formatColor(color) {
    var red = Math.round(color[0]);
    var green = Math.round(color[1]);
    var blue = Math.round(color[2]);
    var alpha = Math.round(color[3] * 1000) / 1000;
    return alpha >= 1 ? "rgb(" + red + "," + green + "," + blue + ")" : "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
  }

  function mixColor(from, to, amount) {
    return [
      from[0] + (to[0] - from[0]) * amount,
      from[1] + (to[1] - from[1]) * amount,
      from[2] + (to[2] - from[2]) * amount,
      from[3] + (to[3] - from[3]) * amount
    ];
  }

  function easeInOut(amount) {
    return amount < 0.5 ? 2 * amount * amount : 1 - Math.pow(-2 * amount + 2, 2) / 2;
  }

  function clearThemeTween() {
    if (themeRaf !== null) cancelAnimationFrame(themeRaf);
    themeRaf = null;
    TWEEN_VARS.forEach(function (name) { root.style.removeProperty(name); });
  }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME[theme]["--grad-top"]);
  }

  function applyThemeInstant(theme) {
    clearThemeTween();
    root.setAttribute("data-theme", theme);
    updateThemeColor(theme);
    if (dotField) dotField.setBase(THEME[theme]["--dot"]);
  }

  function syncThemeDots() {
    document.querySelectorAll("#theme-toggle [data-theme-set]").forEach(function (dot) {
      var active = dot.getAttribute("data-theme-set") === themeName;
      if (active) dot.setAttribute("data-active", "");
      else dot.removeAttribute("data-active");
      dot.setAttribute("aria-pressed", String(active));
    });
  }

  function themeRevealGeometry(element) {
    var target = element || document.getElementById("theme-toggle");
    var width = Math.max(root.clientWidth || window.innerWidth || 0, 1);
    var height = Math.max(root.clientHeight || window.innerHeight || 0, 1);
    var x = width - 56;
    var y = 64;

    if (target) {
      var rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    x = Math.max(0, Math.min(width, x));
    y = Math.max(0, Math.min(height, y));

    var normalizedDiagonal = Math.hypot(width, height) / Math.SQRT2;
    var farthestCorner = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));

    // Relative geometry stays aligned when browser zoom scales the transition snapshot.
    return {
      position: (x / width * 100).toFixed(4) + "% " + (y / height * 100).toFixed(4) + "%",
      radius: Math.ceil(farthestCorner / normalizedDiagonal * 102) + "%"
    };
  }

  function tweenThemeFallback(previous, next) {
    var computed = getComputedStyle(root);
    var from = TWEEN_VARS.map(function (name) {
      return parseColor(computed.getPropertyValue(name).trim() || THEME[previous][name]);
    });
    var to = TWEEN_VARS.map(function (name) { return parseColor(THEME[next][name]); });
    var fromDot = parseColor(THEME[previous]["--dot"]);
    var toDot = parseColor(THEME[next]["--dot"]);
    var start = performance.now();
    var duration = 440;

    root.setAttribute("data-theme", next);
    updateThemeColor(next);
    clearThemeTween();

    function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = easeInOut(progress);
      TWEEN_VARS.forEach(function (name, index) {
        root.style.setProperty(name, formatColor(mixColor(from[index], to[index], eased)));
      });
      if (dotField) dotField.setBase(formatColor(mixColor(fromDot, toDot, eased)));
      if (progress < 1) themeRaf = requestAnimationFrame(frame);
      else {
        themeRaf = null;
        TWEEN_VARS.forEach(function (name) { root.style.removeProperty(name); });
        if (dotField) dotField.setBase(THEME[next]["--dot"]);
      }
    }

    themeRaf = requestAnimationFrame(frame);
  }

  function setTheme(next, animate, originElement) {
    if (next !== "light" && next !== "dark") return;
    if (next === themeName || themeTransitionActive) return;

    var previous = themeName;
    themeName = next;
    themeTransitionId += 1;
    var transitionId = themeTransitionId;
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncThemeDots();

    var canAnimate = animate && !prefersReduced() && !document.hidden;
    if (canAnimate && typeof document.startViewTransition === "function") {
      themeTransitionActive = true;
      var reveal = themeRevealGeometry(originElement);
      var transition = document.startViewTransition(function () { applyThemeInstant(next); });
      var radialAnimation = null;

      transition.ready.then(function () {
        if (transitionId !== themeTransitionId) return;
        radialAnimation = root.animate(
          { clipPath: ["circle(0% at " + reveal.position + ")", "circle(" + reveal.radius + " at " + reveal.position + ")"] },
          { duration: 680, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "both", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {
        themeTransitionActive = false;
        if (transitionId === themeTransitionId) applyThemeInstant(next);
      });

      transition.finished.catch(function () {}).then(function () {
        themeTransitionActive = false;
        if (radialAnimation) {
          try { radialAnimation.cancel(); } catch (e) {}
        }
        if (transitionId !== themeTransitionId) return;
        root.setAttribute("data-theme", next);
        updateThemeColor(next);
        if (dotField) dotField.setBase(THEME[next]["--dot"]);
      });
      return;
    }

    if (!canAnimate || !window.requestAnimationFrame) applyThemeInstant(next);
    else tweenThemeFallback(previous, next);
  }

  function createElement(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined && html !== null) node.innerHTML = html;
    return node;
  }

  var ICONS = {
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.45V23H.25zM8.1 8.25h4.27v2.02h.06c.6-1.13 2.05-2.32 4.22-2.32 4.51 0 5.34 2.97 5.34 6.83V23h-4.45v-6.53c0-1.56-.03-3.56-2.17-3.56-2.17 0-2.5 1.7-2.5 3.45V23H8.1z"/></svg>',
    behance: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.3 6.9c.66 0 1.26.06 1.8.18.54.1 1 .3 1.38.55.38.26.68.6.89 1.04.2.43.3.97.3 1.6 0 .69-.15 1.26-.47 1.72-.31.45-.78.83-1.4 1.12.85.24 1.48.67 1.9 1.28.42.6.62 1.34.62 2.19 0 .69-.13 1.29-.4 1.79-.27.5-.63.92-1.09 1.24-.45.32-.98.56-1.57.71-.59.15-1.2.23-1.82.23H2V6.9zm-.36 4.85c.54 0 .98-.13 1.33-.38.34-.26.51-.67.51-1.25 0-.32-.06-.58-.17-.79-.12-.2-.28-.36-.48-.47-.2-.11-.43-.19-.69-.23-.26-.05-.53-.07-.81-.07H4.9v3.19zm.16 5.09c.3 0 .58-.03.85-.09.27-.05.5-.15.7-.28.2-.14.37-.32.49-.55.12-.23.18-.53.18-.89 0-.7-.2-1.2-.59-1.5-.39-.3-.92-.45-1.57-.45H4.9v3.76zM16.5 16.9c.37.36.9.54 1.6.54.5 0 .93-.13 1.29-.38.36-.25.58-.52.66-.8h2.36c-.38 1.17-.96 2.01-1.74 2.51-.78.5-1.73.75-2.83.75-.77 0-1.46-.12-2.08-.37-.62-.24-1.14-.59-1.57-1.04-.43-.45-.76-.98-.99-1.61-.23-.62-.35-1.31-.35-2.06 0-.73.12-1.4.36-2.02.24-.62.58-1.16 1.02-1.61.44-.45.96-.81 1.57-1.06.61-.26 1.28-.39 2.02-.39.82 0 1.54.16 2.15.48.61.32 1.11.74 1.5 1.28.39.53.67 1.14.84 1.83.17.68.23 1.4.18 2.15h-6.99c0 .77.19 1.34.55 1.71zM19.4 12c-.29-.32-.76-.5-1.38-.5-.4 0-.74.07-1 .21-.27.14-.48.31-.64.51-.16.2-.27.42-.33.64-.06.22-.1.42-.11.6h4.32c-.06-.68-.29-1.16-.58-1.46zM14.7 7.34h5.4V8.7h-5.4z"/></svg>',
    resume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };

  var PLACEHOLDER_TONES = ["#26394d", "#303346", "#243d48", "#3a3045"];
  var PROJECT_RETURN_KEY = "skip-home-intro-once";
  var PROJECT_SCROLL_KEY = "project-return-scroll-y";
  var PROJECT_FOCUS_KEY = "project-return-focus";
  var projectNavigationPending = false;

  function isPlainPrimaryClick(event) {
    return !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (typeof event.button !== "number" || event.button === 0);
  }

  function rememberProjectScroll() {
    try { sessionStorage.setItem(PROJECT_SCROLL_KEY, String(window.scrollY || 0)); } catch (e) {}
  }

  function rememberProjectFocus(id) {
    try { sessionStorage.setItem(PROJECT_FOCUS_KEY, id); } catch (e) {}
  }

  function restoreProjectFocus() {
    var id = null;
    try {
      id = sessionStorage.getItem(PROJECT_FOCUS_KEY);
      sessionStorage.removeItem(PROJECT_FOCUS_KEY);
    } catch (e) {}
    if (!id) return;
    var target = Array.prototype.find.call(document.querySelectorAll("[data-return-id]"), function (node) {
      return node.getAttribute("data-return-id") === id;
    });
    if (!target) return;
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  function consumeProjectReturn() {
    try {
      if (sessionStorage.getItem(PROJECT_RETURN_KEY) !== "1") return false;
      sessionStorage.removeItem(PROJECT_RETURN_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function restoreProjectScroll() {
    var value = null;
    try {
      value = sessionStorage.getItem(PROJECT_SCROLL_KEY);
      sessionStorage.removeItem(PROJECT_SCROLL_KEY);
    } catch (e) {}
    if (value === null) {
      restoreProjectFocus();
      return;
    }
    var y = Number(value);
    if (!isFinite(y) || y < 0) return;

    var oldBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    function applyPosition() {
      if (homeLenis) {
        try {
          homeLenis.scrollTo(y, { immediate: true, force: true });
          return;
        } catch (e) {}
      }
      window.scrollTo(0, y);
    }

    applyPosition();
    requestAnimationFrame(function () {
      applyPosition();
      requestAnimationFrame(function () {
        applyPosition();
        root.style.scrollBehavior = oldBehavior;
        restoreProjectFocus();
      });
    });
  }

  function navigateToProject(destination, group) {
    function go() { window.location.assign(destination.href); }
    try { sessionStorage.setItem("project-fallback-entry", "1"); } catch (e) {}

    if (gsap) {
      var others = Array.prototype.filter.call(document.querySelectorAll(".group"), function (item) { return item !== group; });
      var timeline = gsap.timeline({ defaults: { overwrite: true }, onComplete: go });
      timeline.to(".feed__head", { autoAlpha: 0, y: -8, duration: 0.18, ease: "power2.out" }, 0)
        .to(others, { autoAlpha: 0, y: 10, duration: 0.2, stagger: 0.035, ease: "power2.out" }, 0)
        .to(group, { y: -6, scale: 0.992, duration: 0.28, ease: "power3.inOut" }, 0);
      return;
    }

    document.body.classList.add("is-project-opening");
    group.classList.add("is-opening");
    window.setTimeout(go, 280);
  }

  function transitionToProject(event, anchor) {
    if (!isPlainPrimaryClick(event) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    var rawHref = anchor.getAttribute("href");
    if (!rawHref || rawHref === "#" || rawHref.charAt(0) === "#") return;

    var destination;
    try { destination = new URL(anchor.href, window.location.href); } catch (e) { return; }
    if (destination.origin !== window.location.origin) return;

    rememberProjectScroll();
    if (prefersReduced()) return;
    event.preventDefault();
    if (projectNavigationPending) return;
    projectNavigationPending = true;
    stopHomeLenis();
    navigateToProject(destination, anchor);
  }

  function resetProjectNavigation(event) {
    projectNavigationPending = false;
    document.body.classList.remove("is-project-opening");
    document.querySelectorAll(".group.is-opening").forEach(function (group) { group.classList.remove("is-opening"); });
    if (gsap) gsap.set([".feed__head", ".group"], { clearProps: "opacity,visibility,transform" });
    if (event && event.persisted) {
      resumeHomeLenis();
      if (consumeProjectReturn()) restoreProjectScroll();
    }
  }

  window.addEventListener("pageshow", resetProjectNavigation);

  function buildHero() {
    var title = document.getElementById("hero-title");
    var role = document.getElementById("hero-role");
    if (title) title.textContent = "Hi, I'm " + SITE.name;
    if (role) role.textContent = SITE.role;

    var copy = document.getElementById("hero-copy");
    copy.textContent = "";
    (SITE.intro || []).forEach(function (paragraph, index) {
      copy.appendChild(createElement("p", "hero__p" + (index === 0 ? " hero__p--first" : ""), paragraph));
    });

    var nav = document.getElementById("hero-links");
    nav.textContent = "";
    var columns = { 1: createElement("div", "hero-links__col"), 2: createElement("div", "hero-links__col") };
    (SITE.heroLinks || []).forEach(function (item) {
      var anchor = createElement("a", "hero-link" + (item.accent ? " hero-link--accent" : ""));
      anchor.href = item.href || "#";
      if (/^https?:\/\//i.test(item.href || "")) {
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.setAttribute("aria-label", item.label + " (opens in a new tab)");
      } else if (/\.html(?:$|[?#])/i.test(item.href || "")) {
        anchor.setAttribute("data-return-id", "hero-" + item.label.toLowerCase().replace(/\s+/g, "-"));
        anchor.addEventListener("click", function (event) {
          if (isPlainPrimaryClick(event)) {
            rememberProjectScroll();
            rememberProjectFocus(anchor.getAttribute("data-return-id"));
          }
        });
      }
      anchor.appendChild(createElement("span", "hero-link__icon", ICONS[item.icon] || ""));
      anchor.appendChild(createElement("span", "hero-link__label", item.label));
      columns[item.col === 2 ? 2 : 1].appendChild(anchor);
    });
    nav.appendChild(columns[1]);
    if (columns[2].children.length) nav.appendChild(columns[2]);
  }

  function buildCard(project, index, collection) {
    var scope = collection || "project";
    var wrapper = createElement("article", "group-wrap rise");
    var anchor = createElement("a", "group");
    anchor.href = project.link || "#";
    anchor.setAttribute("data-return-id", scope + "-" + index);
    var captionId = scope + "-caption-" + index;
    anchor.setAttribute("aria-describedby", captionId);

    if (/^https?:\/\//i.test(project.link || "")) {
      anchor.target = "_blank";
      anchor.rel = "noopener";
    } else if (project.link) {
      anchor.addEventListener("click", function (event) {
        if (isPlainPrimaryClick(event)) rememberProjectFocus(anchor.getAttribute("data-return-id"));
        transitionToProject(event, anchor);
      });
    }

    var card = createElement("span", "card");
    var imageWrapper = createElement("span", "card__imgwrap");
    if (project.image) {
      var image = createElement("img", "card__img");
      image.src = project.image;
      image.alt = project.imageAlt || project.title + " project cover";
      image.width = 1600;
      image.height = 1600;
      image.loading = "lazy";
      image.decoding = "async";
      imageWrapper.appendChild(image);
    } else {
      var placeholder = createElement("span", "card__ph");
      placeholder.style.setProperty("--ph-tone", PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length]);
      placeholder.appendChild(createElement("span", "card__ph-index", String(index + 1).padStart(2, "0")));
      imageWrapper.appendChild(placeholder);
    }
    card.appendChild(imageWrapper);

    var caption = createElement("span", "card__caption");
    caption.id = captionId;
    caption.appendChild(createElement("span", "card__caption-index", project.number || String(index + 1).padStart(2, "0")));
    caption.appendChild(createElement("span", "card__caption-title", project.title));
    caption.appendChild(createElement("span", "card__caption-tag", project.category || ""));

    anchor.appendChild(card);
    anchor.appendChild(caption);
    wrapper.appendChild(anchor);
    return wrapper;
  }

  function buildFeed() {
    document.getElementById("feed-label").textContent = SITE.indexLabel;
    document.getElementById("feed-tab").textContent = SITE.category;
    var workCategory = SITE.workCategory || "Work Experience";
    document.getElementById("work-feed-label").textContent = workCategory;
    document.getElementById("work-feed-tab").textContent = workCategory;

    function renderCards(gridId, items, scope) {
      var grid = document.getElementById(gridId);
      if (!grid) return;
      grid.textContent = "";
      (items || []).forEach(function (item, index) { grid.appendChild(buildCard(item, index, scope)); });
    }

    renderCards("feed-grid", PROJECTS, "project");
    renderCards("work-feed-grid", typeof WORK_EXPERIENCE === "undefined" ? [] : WORK_EXPERIENCE, "experience");
  }

  function buildFooter() {
    var footer = SITE.footer || {};
    var list = document.getElementById("footer-socials");
    list.textContent = "";
    (footer.links || []).forEach(function (item) {
      var li = createElement("li");
      var anchor = createElement("a", "", item.label);
      anchor.href = item.href || "#";
      if (item.href && item.href !== "#") {
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.setAttribute("aria-label", item.label + " (opens in a new tab)");
      }
      li.appendChild(anchor);
      list.appendChild(li);
    });

    var topItem = createElement("li");
    var topButton = createElement("button", "footer__top", "Back to top");
    topButton.type = "button";
    topButton.addEventListener("click", function () {
      if (homeLenis && !prefersReduced()) homeLenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
    });
    topItem.appendChild(topButton);
    list.appendChild(topItem);

    document.getElementById("footer-mark").textContent = footer.mark || SITE.name || "";
  }

  function showCardsImmediately() {
    var cards = document.querySelectorAll(".group-wrap.rise");
    if (gsap) gsap.set(cards, { autoAlpha: 1, y: 0, scale: 1 });
    else cards.forEach(function (card) { card.classList.add("in"); });
  }

  function initCardReveals(skipMotion) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".group-wrap.rise"));
    if (!cards.length) return;
    if (skipMotion || prefersReduced()) {
      showCardsImmediately();
      return;
    }

    if (gsap && ScrollTrigger) {
      gsap.set(cards, { opacity: 0, y: 28, scale: 0.988 });
      ScrollTrigger.batch(cards, {
        start: "top 90%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.1, ease: "power3.out", overwrite: true });
        }
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      showCardsImmediately();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    cards.forEach(function (card) { observer.observe(card); });
  }

  function heroEntrance() {
    if (!gsap || prefersReduced()) return;
    var timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline.from("#theme-toggle", { autoAlpha: 0, scale: 0.76, duration: 0.48 }, 0)
      .from(".hero__identity > *", { autoAlpha: 0, y: 12, duration: 0.56, stagger: 0.08 }, 0.08)
      .from("#hero-copy .hero__p", { autoAlpha: 0, y: 18, duration: 0.72, stagger: 0.12 }, 0.22)
      .from("#hero-links .hero-links__col > .hero-link:first-child", { autoAlpha: 0, y: 12, duration: 0.55 }, 0.52)
      .from("#hero-links .hero-links__col > .hero-link:nth-child(2)", { autoAlpha: 0, y: 12, duration: 0.55 }, 0.59);
  }

  function initScrollCue() {
    var cue = document.querySelector(".scroll-cue");
    if (!cue) return;

    var previousY = Math.max(0, window.scrollY || 0);
    var rafId = null;
    var animationTimer = null;

    function stopScrollAnimation() {
      if (animationTimer !== null) {
        window.clearTimeout(animationTimer);
        animationTimer = null;
      }
      cue.classList.remove("is-scroll-animating");
    }

    function startScrollAnimation() {
      if (animationTimer !== null) return;
      cue.classList.add("is-scroll-animating");
      animationTimer = window.setTimeout(function () {
        animationTimer = null;
        cue.classList.remove("is-scroll-animating");
      }, 660);
    }

    function update() {
      rafId = null;
      var y = Math.max(0, window.scrollY || 0);
      if (curtainCoversHero) stopScrollAnimation();
      else if (y > previousY + 0.5 && !prefersReduced()) startScrollAnimation();
      previousY = y;
    }

    function scheduleUpdate() {
      if (rafId !== null) return;
      if (window.requestAnimationFrame) rafId = window.requestAnimationFrame(update);
      else update();
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    addMediaListener(motionQuery, function () {
      if (prefersReduced()) stopScrollAnimation();
      scheduleUpdate();
    });
    scheduleUpdate();
  }

  function syncHeroInert() {
    var hero = document.querySelector(".hero-band");
    if (hero && "inert" in hero) hero.inert = pageIsInert || curtainCoversHero;
  }

  function initContentCurtain() {
    var curtain = document.querySelector(".content-curtain");
    if (!curtain) return;

    var rafId = null;

    function update() {
      rafId = null;
      var covered = curtain.getBoundingClientRect().top <= 0.5;
      if (covered === curtainCoversHero) return;
      curtainCoversHero = covered;
      syncHeroInert();
      if (dotField && typeof dotField.setCovered === "function") dotField.setCovered(covered);
    }

    function scheduleUpdate() {
      if (rafId !== null) return;
      if (window.requestAnimationFrame) rafId = window.requestAnimationFrame(update);
      else update();
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);
    update();
  }

  function setPageInert(value) {
    pageIsInert = value;
    [document.querySelector(".skip-link"), document.querySelector(".main"), document.querySelector(".footer")].forEach(function (node) {
      if (node && "inert" in node) node.inert = value;
    });
    syncHeroInert();
  }

  function runIntro(returningFromDetail) {
    var preloader = document.getElementById("preloader");
    if (!preloader) return;

    if (returningFromDetail || prefersReduced() || document.hidden) {
      preloader.remove();
      document.body.classList.remove("intro-active");
      setPageInert(false);
      return;
    }

    document.body.classList.add("intro-active");
    setPageInert(true);
    var completed = false;
    var holdTimer = null;
    var removeTimer = null;

    function removePreloader() {
      if (preloader.parentNode) preloader.remove();
      document.body.classList.remove("intro-active");
      setPageInert(false);
      document.removeEventListener("keydown", onKeydown);
      clearTimeout(removeTimer);
      initHomeLenis();
      resumeHomeLenis();
      if (ScrollTrigger) ScrollTrigger.refresh();
    }

    function finishIntro() {
      if (completed) return;
      completed = true;
      clearTimeout(holdTimer);
      heroEntrance();
      if (dotField) dotField.ignite();
      preloader.classList.add("is-leaving");
      window.setTimeout(function () {
        preloader.classList.add("is-done");
        preloader.addEventListener("transitionend", removePreloader, { once: true });
        removeTimer = window.setTimeout(removePreloader, 900);
      }, 250);
    }

    function onKeydown(event) {
      if (event.key === "Escape") finishIntro();
    }

    document.addEventListener("keydown", onKeydown);
    holdTimer = window.setTimeout(finishIntro, 1320);
  }

  function DotField(hero) {
    var canvas = createElement("canvas", "dotfield");
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    var context = canvas.getContext("2d");
    var spacing = 68;
    var radius = 185;
    var baseRadius = 2;
    var dots = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var rect = { left: 0, top: 0 };
    var base = parseColor(THEME[themeName]["--dot"]);
    var pointer = { x: -9999, y: -9999, active: false };
    var rafId = null;
    var geometryRaf = null;
    var running = false;
    var inView = true;
    var covered = false;
    var ignitionStart = 0;
    var igniting = false;
    var maxDistance = 1;
    var clearX = 0;
    var clearY = 0;
    var clearNear = 1;
    var clearFar = 1;
    var observer = null;
    var resizeObserver = null;

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = canvas.getBoundingClientRect();
      maxDistance = Math.sqrt(width * width + height * height);
      dots = [];
      for (var y = 50; y < height; y += spacing) {
        for (var x = 44; x < width; x += spacing) dots.push({ homeX: x, homeY: y, x: x, y: y, vx: 0, vy: 0 });
      }
      var content = hero.querySelector(".hero");
      if (content) {
        var contentRect = content.getBoundingClientRect();
        clearX = contentRect.left - rect.left + contentRect.width / 2;
        clearY = contentRect.top - rect.top + contentRect.height / 2;
        clearNear = Math.max(contentRect.width, contentRect.height) * 0.42;
      } else {
        clearX = width * 0.4;
        clearY = height * 0.42;
        clearNear = 200;
      }
      clearFar = clearNear + 190;
      wake();
    }

    function verticalAlpha(yRatio) {
      if (yRatio < 0.52) return 1;
      if (yRatio > 0.84) return 0;
      return 1 - (yRatio - 0.52) / 0.32;
    }

    function contentClear(dot) {
      var dx = dot.homeX - clearX;
      var dy = dot.homeY - clearY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= clearNear) return 0.25;
      if (distance >= clearFar) return 1;
      return 0.25 + 0.75 * (distance - clearNear) / (clearFar - clearNear);
    }

    function ignition(dot, now) {
      if (!igniting) return 1;
      var elapsed = now - ignitionStart;
      if (elapsed >= 1050) {
        igniting = false;
        return 1;
      }
      var dx = dot.homeX - width * 0.34;
      var dy = dot.homeY - height * 0.4;
      var distance = Math.sqrt(dx * dx + dy * dy) / maxDistance;
      var local = elapsed / 1050 * 1.25 - distance;
      return local <= 0 ? 0 : local >= 0.22 ? 1 : local / 0.22;
    }

    function draw(now) {
      context.clearRect(0, 0, width, height);
      var moving = false;
      dots.forEach(function (dot) {
        var alpha = verticalAlpha(dot.homeY / height) * 0.62 * contentClear(dot);
        if (alpha <= 0.008) return;
        var igniteAmount = ignition(dot, now || performance.now());
        if (igniteAmount <= 0) {
          moving = true;
          return;
        }
        dot.vx += (dot.homeX - dot.x) * 0.055;
        dot.vy += (dot.homeY - dot.y) * 0.055;
        var proximity = 0;
        if (pointer.active) {
          var dx = dot.x - pointer.x;
          var dy = dot.y - pointer.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < radius) {
            proximity = 1 - distance / radius;
            var force = Math.pow(proximity, 0.82) * 5.2;
            var divisor = distance || 0.001;
            dot.vx += dx / divisor * force;
            dot.vy += dy / divisor * force;
          }
        }
        dot.vx *= 0.86;
        dot.vy *= 0.86;
        dot.x += dot.vx;
        dot.y += dot.vy;
        var velocityMoving = Math.abs(dot.vx) + Math.abs(dot.vy) > 0.05;
        var returningHome = !pointer.active && Math.abs(dot.homeX - dot.x) + Math.abs(dot.homeY - dot.y) > 0.5;
        if (velocityMoving || returningHome) moving = true;

        var color = base;
        var dotRadius = baseRadius;
        if (proximity > 0.01) {
          color = mixColor(base, [74, 168, 255, 1], Math.min(proximity * 1.5, 1));
          dotRadius += proximity * 1.6;
        }
        context.beginPath();
        context.arc(dot.x, dot.y, dotRadius * (0.4 + 0.6 * igniteAmount), 0, Math.PI * 2);
        context.fillStyle = "rgba(" + Math.round(color[0]) + "," + Math.round(color[1]) + "," + Math.round(color[2]) + "," + (alpha * igniteAmount).toFixed(3) + ")";
        context.fill();
      });
      if (running && (moving || igniting)) rafId = requestAnimationFrame(draw);
      else rafId = null;
    }

    function wake() {
      if (running && rafId === null) rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      wake();
    }

    function stop() {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function resetPointer() {
      pointer.active = false;
      wake();
    }

    function onPointerMove(event) {
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= -radius && pointer.x <= width + radius && pointer.y >= -radius && pointer.y <= height + radius;
      wake();
    }

    function onScroll() {
      if (!inView || covered || geometryRaf !== null) return;
      geometryRaf = requestAnimationFrame(function () {
        geometryRaf = null;
        rect = canvas.getBoundingClientRect();
      });
    }

    function onVisibility() {
      if (document.hidden) stop();
      else if (inView && !covered && !prefersReduced()) start();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", resetPointer, { passive: true });
    window.addEventListener("pointercancel", resetPointer, { passive: true });
    window.addEventListener("pointerleave", resetPointer, { passive: true });
    window.addEventListener("blur", resetPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && !covered && !document.hidden && !prefersReduced()) start();
        else stop();
      });
      observer.observe(hero);
    }

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(hero);
    } else {
      window.addEventListener("resize", measure);
    }

    measure();
    start();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    this.setBase = function (color) {
      base = parseColor(color);
      wake();
    };
    this.ignite = function () {
      ignitionStart = performance.now();
      igniting = true;
      wake();
    };
    this.setCovered = function (value) {
      covered = !!value;
      pointer.active = false;
      if (covered) stop();
      else if (inView && !document.hidden && !prefersReduced()) {
        rect = canvas.getBoundingClientRect();
        start();
      }
    };
    this.destroy = function () {
      stop();
      if (geometryRaf !== null) cancelAnimationFrame(geometryRaf);
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", resetPointer);
      window.removeEventListener("pointercancel", resetPointer);
      window.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.remove();
    };
  }

  function initFooterMotion() {
    var frame = document.querySelector(".footer__frame");
    var mark = document.getElementById("footer-mark");
    if (!frame || !mark || prefersReduced() || !finePointerQuery || !finePointerQuery.matches) return;

    if (gsap) {
      var setX = gsap.quickTo(mark, "x", { duration: 0.45, ease: "power3.out" });
      var setSkew = gsap.quickTo(mark, "skewX", { duration: 0.45, ease: "power3.out" });
      frame.addEventListener("pointermove", function (event) {
        if (prefersReduced()) return;
        var rect = frame.getBoundingClientRect();
        var amount = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        setX(amount * 10);
        setSkew(amount * -1.5);
      });
      frame.addEventListener("pointerleave", function () { setX(0); setSkew(0); });
      return;
    }

    frame.addEventListener("pointermove", function (event) {
      var rect = frame.getBoundingClientRect();
      var amount = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      mark.style.transform = "translateX(" + (amount * 10).toFixed(1) + "px) skewX(" + (amount * -1.5).toFixed(2) + "deg)";
    });
    frame.addEventListener("pointerleave", function () { mark.style.transform = "none"; });
  }

  function init() {
    document.title = SITE.fullName + ", " + SITE.role;
    var returnMarker = consumeProjectReturn();
    var returningFromDetail = root.classList.contains("skip-home-intro") || returnMarker;

    buildHero();
    buildFeed();
    buildFooter();
    syncThemeDots();
    updateThemeColor(themeName);

    document.querySelectorAll("#theme-toggle [data-theme-set]").forEach(function (dot) {
      dot.addEventListener("click", function () { setTheme(dot.getAttribute("data-theme-set"), true, dot); });
    });

    var systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    addMediaListener(systemQuery, function () {
      if (root.hasAttribute("data-theme")) return;
      themeName = systemTheme();
      syncThemeDots();
      updateThemeColor(themeName);
      if (dotField) dotField.setBase(THEME[themeName]["--dot"]);
    });

    initCardReveals(returningFromDetail);

    var hero = document.querySelector(".hero-band");
    if (hero && !prefersReduced() && finePointerQuery && finePointerQuery.matches && window.requestAnimationFrame) {
      try {
        dotField = new DotField(hero);
        document.body.classList.add("dotfield-on");
      } catch (e) {
        dotField = null;
      }
    }

    addMediaListener(motionQuery, function () {
      if (prefersReduced()) {
        destroyHomeLenis();
        if (gsap) gsap.globalTimeline.clear();
        showCardsImmediately();
        if (dotField) {
          dotField.destroy();
          dotField = null;
          document.body.classList.remove("dotfield-on");
        }
        return;
      }

      initHomeLenis();
      resumeHomeLenis();
      if (ScrollTrigger) ScrollTrigger.refresh();
    });

    if (returningFromDetail) restoreProjectScroll();
    initContentCurtain();
    initScrollCue();
    runIntro(returningFromDetail);
    initHomeLenis();
    resumeHomeLenis();
    initFooterMotion();
    window.addEventListener("pagehide", stopHomeLenis);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
