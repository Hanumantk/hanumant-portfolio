(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var gsap = window.gsap || null;
  var ScrollTrigger = window.ScrollTrigger || null;
  var lenis = null;
  var lenisTicker = null;
  var manualProgressRaf = null;

  function prefersReduced() {
    return !!(motionQuery && motionQuery.matches);
  }

  function syncThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var dark = root.getAttribute("data-theme") === "dark" || (!root.hasAttribute("data-theme") && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    meta.setAttribute("content", dark ? "#1b2a3c" : "#cde4ff");
  }

  function isPlainPrimaryClick(event) {
    return !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (typeof event.button !== "number" || event.button === 0);
  }

  function setHomeReturnMarker() {
    try { sessionStorage.setItem("skip-home-intro-once", "1"); } catch (e) {}
  }

  function initLenis() {
    if (lenis || prefersReduced() || document.body.getAttribute("data-smooth-scroll") !== "true" || typeof window.Lenis !== "function") return;
    var useGsapTicker = !!gsap;
    lenis = new window.Lenis({
      autoRaf: !useGsapTicker,
      anchors: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      lerp: 0.1
    });
    window.projectLenis = lenis;

    if (ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    if (useGsapTicker) {
      lenisTicker = function (time) { lenis.raf(time * 1000); };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }
  }

  function stopLenis() {
    if (lenis) lenis.stop();
  }

  function destroyLenis() {
    if (!lenis) return;
    if (gsap && lenisTicker) gsap.ticker.remove(lenisTicker);
    lenisTicker = null;
    try { lenis.destroy(); } catch (e) {}
    lenis = null;
    window.projectLenis = null;
    root.classList.remove("lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped");
  }

  function resumeLenis() {
    if (!lenis || prefersReduced()) return;
    lenis.start();
    lenis.resize();
    try { lenis.scrollTo(window.scrollY, { immediate: true, force: true }); } catch (e) {}
  }

  function updateProgress() {
    manualProgressRaf = null;
    var bar = document.querySelector(".reading-progress__bar");
    if (!bar) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.max(0, Math.min(1, window.scrollY / max));
    bar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
  }

  function queueProgress() {
    if (manualProgressRaf === null) manualProgressRaf = requestAnimationFrame(updateProgress);
  }

  function initProgress() {
    var bar = document.querySelector(".reading-progress__bar");
    if (!bar) return;
    if (gsap && ScrollTrigger && !prefersReduced()) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.14 }
      });
      return;
    }
    updateProgress();
    window.addEventListener("scroll", queueProgress, { passive: true });
    window.addEventListener("resize", queueProgress, { passive: true });
  }

  function initEntryMotion() {
    if (!root.classList.contains("project-fallback-entry")) return;
    if (!gsap || prefersReduced()) {
      root.classList.remove("project-fallback-entry");
      return;
    }
    var firstImage = document.querySelector(".cs-doc img:first-of-type");
    var timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: function () { root.classList.remove("project-fallback-entry"); }
    });
    timeline.from(".rz__masthead > *", { autoAlpha: 0, y: 16, duration: 0.58, stagger: 0.07 }, 0);
    if (firstImage) timeline.from(firstImage, { autoAlpha: 0, y: 10, duration: 0.55, clearProps: "all" }, 0.18);
  }

  function initReturnLinks() {
    document.querySelectorAll("[data-home-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (isPlainPrimaryClick(event)) {
          setHomeReturnMarker();
          stopLenis();
        }
      });
    });

    window.addEventListener("pagehide", function () {
      setHomeReturnMarker();
      stopLenis();
    });

    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      resumeLenis();
      if (ScrollTrigger) ScrollTrigger.refresh();
      queueProgress();
    });
  }

  function initTopButtons() {
    document.querySelectorAll("[data-back-to-top]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (lenis && !prefersReduced()) lenis.scrollTo(0, { duration: 0.9 });
        else window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
      });
    });
  }

  function initResumeMedia() {
    var frame = document.querySelector(".rz__resume-page");
    var wrapper = document.querySelector(".rz__doc");
    if (!frame || !wrapper) return;
    var loaded = function () { wrapper.classList.add("is-loaded"); };
    if (frame.complete) loaded();
    else frame.addEventListener("load", loaded, { once: true });
    window.setTimeout(function () {
      if (!wrapper.classList.contains("is-loaded")) wrapper.classList.add("is-slow");
    }, 2500);
    window.setTimeout(function () {
      if (!wrapper.classList.contains("is-loaded")) wrapper.classList.add("is-loaded");
    }, 5000);
  }

  function init() {
    syncThemeColor();
    if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    initLenis();
    initProgress();
    initEntryMotion();
    initReturnLinks();
    initTopButtons();
    initResumeMedia();

    if (motionQuery) {
      var onMotionChange = function () {
        if (prefersReduced()) {
          destroyLenis();
          if (gsap) gsap.globalTimeline.clear();
          updateProgress();
        } else {
          initLenis();
          resumeLenis();
          if (ScrollTrigger) ScrollTrigger.refresh();
        }
      };
      if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
