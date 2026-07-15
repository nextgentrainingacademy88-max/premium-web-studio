/* ============================================================================
   NextGen Studio - per-site runtime  (studio.js)
   ----------------------------------------------------------------------------
   The one script every demo site loads (after Tailwind + studio.css, and after
   GSAP + ScrollTrigger IF the site uses scroll scenes). Plain script, no module
   syntax. Exposes exactly ONE global: window.NGStudio.

     <script src="https://cdn.tailwindcss.com"></script>
     <link  rel="stylesheet" href="../shared/studio.css">
     <!-- optional, only if the page uses .arch-scene3d scrub scenes: -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
     <script src="../shared/studio.js"></script>

   API (window.NGStudio)
     .init()          - idempotent; auto-called on DOMContentLoaded
     .refresh()       - re-scan the DOM (call after injecting markup); rebinds
                        counters / tilt / magnetic / glow / countdowns
     .stopPreview()   - halt the ?preview=1 auto-scroll loop
     .version         - string

   MARKUP CONTRACT (all optional; a page uses only what it needs)
     .reveal                  animated block. Add [data-load] to animate on page
                              load (hero); without it, animates on scroll enter.
                              Optional style="--i:n" staggers siblings.
     .site-head               sticky header; gets .scrolled when scrollY > 8.
     [data-count-to="1200"]   stat counter. Optional data-count-prefix / -suffix
                              / -dur (ms). The FINAL value must already be in the
                              element text (SEO); the counter re-animates it once.
     [data-tilt]              pointer-tilt card (max 6deg). Inert on touch + RM.
     [data-magnetic]          button/link that eases toward the pointer. Inert on
                              touch + RM.
     .arch-features .feat     glow-track cards: --mx/--my CSS vars follow pointer.
     .arch-scene3d            scroll-scrubbed CSS-3D stage (needs GSAP present):
       [data-depth="0.2"]       translateZ/Y proportional to depth over the range
       [data-scrub-rotate="8"]  rotate deg across the section scroll range
       [data-scrub-scale="0.9"] scale from value -> 1 across the range
     [data-countdown="2026-08-30T09:00:00+08:00"]
                              countdown; child cells [data-cd=d|h|m|s]. Seeded
                              synchronously (no 00 flash); container should carry
                              aria-hidden. Adds .is-ended when the target passes.

   HOUSE RULES: animate transform/opacity only, passive scroll listeners, respect
   prefers-reduced-motion (all decoration off, content fully visible), zero errors.
   ============================================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.0';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var touchMQ = window.matchMedia('(hover: none)');
  var reduce = function () { return reduceMQ.matches; };
  var isTouch = function () { return touchMQ.matches; };
  var hasGSAP = function () { return !!(window.gsap && window.ScrollTrigger); };
  var forcedReveal = function () { return location.search.indexOf('reveal') !== -1; };
  var isPreview = function () { return /(^|[?&])preview=1(&|$)/.test(location.search); };

  var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
  var caf = window.cancelAnimationFrame || clearTimeout;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // Track what we have already wired so refresh() never double-binds.
  var boundFlag = '__ngStudioBound';

  /* ------------------------------------------------------------------------
     1. REVEAL ENGINE  (ported verbatim in behaviour from the proven hub script)
        - GSAP path when present: html.gsap-on, ScrollTrigger.create({once:true})
          + an INDEPENDENT tween in onEnter (a later refresh() can never reset a
          revealed block), fonts.ready refresh.
        - else IntersectionObserver + .in class + 1800ms failsafe.
        - reduced-motion OR ?reveal OR ?preview=1: force-show immediately (inline).
  ------------------------------------------------------------------------ */
  var revealDone = false;
  function forceShow(list) {
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      el.classList.add('in');
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  }

  function initReveal() {
    if (revealDone) return;
    revealDone = true;

    var reveals = document.querySelectorAll('.reveal');

    // reduced-motion / screenshot / preview -> just reveal, no animation.
    if (reduce() || forcedReveal() || isPreview()) {
      forceShow(reveals);
      return;
    }

    if (!hasGSAP()) {
      // Motion ok but no GSAP: cheap IntersectionObserver reveal (CSS transitions).
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
      // Failsafe: nothing may stay hidden.
      setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 1800);
      return;
    }

    // ---- GSAP path ----
    try {
      document.documentElement.classList.add('gsap-on'); // disables CSS reveal transition; GSAP owns it
      window.gsap.registerPlugin(window.ScrollTrigger);

      // Hero entrance on load (elements start hidden via .reveal CSS).
      var loaders = document.querySelectorAll('.reveal[data-load]');
      if (loaders.length) {
        window.gsap.to(loaders, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.1 });
      }

      // Scroll-triggered reveals for everything else. ScrollTrigger.create + an
      // INDEPENDENT tween in onEnter (not attached to the trigger): once revealed,
      // a later refresh() (fonts, images) can never reset it.
      window.gsap.utils.toArray('.reveal:not([data-load])').forEach(function (el) {
        window.ScrollTrigger.create({
          trigger: el, start: 'top 92%', once: true,
          onEnter: function () { window.gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }); }
        });
      });

      // Recalc once the display font has loaded (it changes heights).
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
      }

      // If GSAP loaded but nothing got created (unexpected), fall back to visible.
      if (!window.ScrollTrigger.getAll().length && reveals.length) { forceShow(reveals); }
    } catch (err) {
      forceShow(reveals);
    }
  }

  /* ------------------------------------------------------------------------
     2. STICKY HEADER  (.site-head -> .scrolled when scrollY > 8)
  ------------------------------------------------------------------------ */
  function initHeader() {
    var head = document.querySelector('.site-head');
    if (!head || head[boundFlag]) return;
    head[boundFlag] = true;
    var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. STAT COUNTERS  [data-count-to]
        Final value already in the markup (SEO); animate once on first entry.
        Skipped under reduced-motion (the static value simply stays).
  ------------------------------------------------------------------------ */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length || reduce()) return;

    var fmt = new Intl.NumberFormat('en-MY');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        runCount(el, fmt);
      });
    }, { threshold: 0.4 });

    nodes.forEach(function (el) {
      if (el[boundFlag]) return;
      el[boundFlag] = true;
      io.observe(el);
    });
  }

  function runCount(el, fmt) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    var dur = parseFloat(el.getAttribute('data-count-dur')) || 1600;
    var decimals = (String(target).split('.')[1] || '').length;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var val = target * easeOutCubic(p);
      var shown = decimals ? val.toFixed(decimals) : Math.round(val);
      el.textContent = prefix + fmt.format(shown) + suffix;
      if (p < 1) raf(frame);
      else el.textContent = prefix + fmt.format(decimals ? target.toFixed(decimals) : target) + suffix;
    }
    raf(frame);
  }

  /* ------------------------------------------------------------------------
     4. TILT CARDS  [data-tilt]  (max 6deg, rAF lerp). Inert on touch + RM.
  ------------------------------------------------------------------------ */
  var MAX_TILT = 6;
  function initTilt() {
    if (isTouch() || reduce()) return;
    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      if (card[boundFlag]) return;
      card[boundFlag] = true;

      var tx = 0, ty = 0, cx = 0, cy = 0, ticking = false;
      card.style.transformStyle = 'preserve-3d';

      function apply() {
        ticking = false;
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        card.style.transform = 'perspective(900px) rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
        if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) { ticking = true; raf(apply); }
      }
      function queue() { if (!ticking) { ticking = true; raf(apply); } }

      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;   // 0..1
        var py = (e.clientY - r.top) / r.height;   // 0..1
        tx = (px - 0.5) * 2 * MAX_TILT;            // rotateY
        ty = -(py - 0.5) * 2 * MAX_TILT;           // rotateX (invert so top tilts back)
        queue();
      }, { passive: true });

      card.addEventListener('pointerleave', function () { tx = 0; ty = 0; queue(); });
    });
  }

  /* ------------------------------------------------------------------------
     5. MAGNETIC BUTTONS  [data-magnetic]  (ease toward pointer, spring back).
        GSAP if present, else a cheap CSS-transition fallback. Inert touch + RM.
  ------------------------------------------------------------------------ */
  var MAG_STRENGTH = 0.25, MAG_MAX = 12;
  function initMagnetic() {
    if (isTouch() || reduce()) return;
    var els = document.querySelectorAll('[data-magnetic]');
    var gsapOn = hasGSAP();
    els.forEach(function (el) {
      if (el[boundFlag]) return;
      el[boundFlag] = true;
      if (!gsapOn) { el.style.transition = 'transform 260ms cubic-bezier(0.22,1,0.36,1)'; el.style.willChange = 'transform'; }

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * MAG_STRENGTH;
        var dy = (e.clientY - (r.top + r.height / 2)) * MAG_STRENGTH;
        dx = Math.max(-MAG_MAX, Math.min(MAG_MAX, dx));
        dy = Math.max(-MAG_MAX, Math.min(MAG_MAX, dy));
        if (gsapOn) window.gsap.to(el, { x: dx, y: dy, duration: 0.3, ease: 'power3.out' });
        else el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      }, { passive: true });

      el.addEventListener('pointerleave', function () {
        if (gsapOn) window.gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        else el.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. GLOW-TRACK  .arch-features .feat  (--mx/--my for the ::before glow)
  ------------------------------------------------------------------------ */
  function initGlow() {
    if (reduce()) return;
    var cards = document.querySelectorAll('.arch-features .feat');
    cards.forEach(function (card) {
      if (card[boundFlag]) return;
      card[boundFlag] = true;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
     7. CSS-3D SCROLL SCENES  .arch-scene3d  (needs GSAP; transform-only scrub)
        [data-depth] -> translateZ + translateY proportional to depth
        [data-scrub-rotate] -> rotate deg across the section range
        [data-scrub-scale]  -> scale from value -> 1 across the section range
        (mirrors the home site's data-parallax vocabulary)
  ------------------------------------------------------------------------ */
  function initScenes3d() {
    if (reduce() || !hasGSAP()) return;
    var scenes = document.querySelectorAll('.arch-scene3d');
    scenes.forEach(function (scene) {
      if (scene[boundFlag]) return;
      scene[boundFlag] = true;

      window.gsap.utils.toArray(scene.querySelectorAll('[data-depth]')).forEach(function (el) {
        var depth = parseFloat(el.getAttribute('data-depth')) || 0;
        window.gsap.fromTo(el,
          { z: 220 * depth, y: 60 * depth },
          {
            z: -220 * depth, y: -60 * depth, ease: 'none',
            scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
          });
      });

      window.gsap.utils.toArray(scene.querySelectorAll('[data-scrub-rotate]')).forEach(function (el) {
        var deg = parseFloat(el.getAttribute('data-scrub-rotate')) || 0;
        window.gsap.fromTo(el, { rotation: -deg }, {
          rotation: deg, ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      window.gsap.utils.toArray(scene.querySelectorAll('[data-scrub-scale]')).forEach(function (el) {
        var from = parseFloat(el.getAttribute('data-scrub-scale')) || 1;
        window.gsap.fromTo(el, { scale: from }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'center center', scrub: true }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     8. COUNTDOWN BARS  [data-countdown]  (seeded synchronously; 1s tick)
        Child cells: [data-cd=d|h|m|s]. Container should carry aria-hidden.
  ------------------------------------------------------------------------ */
  var countdownTimers = [];
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function initCountdowns() {
    var bars = document.querySelectorAll('[data-countdown]');
    bars.forEach(function (bar) {
      if (bar[boundFlag]) return;
      bar[boundFlag] = true;
      var target = Date.parse(bar.getAttribute('data-countdown'));
      if (isNaN(target)) return;
      var cells = {
        d: bar.querySelector('[data-cd=d]'),
        h: bar.querySelector('[data-cd=h]'),
        m: bar.querySelector('[data-cd=m]'),
        s: bar.querySelector('[data-cd=s]')
      };

      function tick() {
        var diff = target - Date.now();
        if (diff <= 0) {
          if (cells.d) cells.d.textContent = '00';
          if (cells.h) cells.h.textContent = '00';
          if (cells.m) cells.m.textContent = '00';
          if (cells.s) cells.s.textContent = '00';
          bar.classList.add('is-ended');
          return false;
        }
        var s = Math.floor(diff / 1000);
        var d = Math.floor(s / 86400); s -= d * 86400;
        var h = Math.floor(s / 3600);  s -= h * 3600;
        var m = Math.floor(s / 60);    s -= m * 60;
        if (cells.d) cells.d.textContent = pad2(d);
        if (cells.h) cells.h.textContent = pad2(h);
        if (cells.m) cells.m.textContent = pad2(m);
        if (cells.s) cells.s.textContent = pad2(s);
        return true;
      }

      // Seed BEFORE first paint so no 00 flash, then tick each second.
      if (tick()) {
        var id = setInterval(function () { if (!tick()) clearInterval(id); }, 1000);
        countdownTimers.push(id);
      }
    });
  }

  /* ------------------------------------------------------------------------
     9. PREVIEW MODE  ?preview=1  (hub loops / screenshots)
        html.ng-preview, force-show reveals, then eased top->bottom auto-scroll
        (~14s), hold 800ms, jump to top, loop forever. Uses window.scrollTo so it
        drives scroll-linked GSAP correctly (NOT scroll-behavior smooth).
  ------------------------------------------------------------------------ */
  var previewRAF = null, previewTO = [], previewStopped = false;
  function clearPreviewTimers() {
    previewTO.forEach(function (t) { clearTimeout(t); });
    previewTO = [];
    if (previewRAF) { caf(previewRAF); previewRAF = null; }
  }
  function stopPreview() {
    previewStopped = true;
    clearPreviewTimers();
  }
  function initPreview() {
    if (!isPreview()) return;
    document.documentElement.classList.add('ng-preview');
    forceShow(document.querySelectorAll('.reveal'));

    var DURATION = 14000, HOLD = 800, WAIT = 600;

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function runPass() {
      if (previewStopped) return;
      var start = null, from = 0, to = maxScroll();
      window.scrollTo(0, 0);
      function step(ts) {
        if (previewStopped) return;
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / DURATION);
        window.scrollTo(0, from + (to - from) * easeOutCubic(p));
        if (p < 1) previewRAF = raf(step);
        else {
          previewTO.push(setTimeout(function () {
            window.scrollTo(0, 0);
            previewTO.push(setTimeout(runPass, WAIT));
          }, HOLD));
        }
      }
      previewRAF = raf(step);
    }
    previewTO.push(setTimeout(runPass, WAIT));
  }

  /* ------------------------------------------------------------------------
     ORCHESTRATION
  ------------------------------------------------------------------------ */
  var started = false;
  function init() {
    // Re-runnable feature binders (all guard against double-binding per element).
    initHeader();
    initCounters();
    initTilt();
    initMagnetic();
    initGlow();
    initScenes3d();
    initCountdowns();

    if (started) return;   // one-time work below
    started = true;
    initReveal();
    initPreview();
  }

  function refresh() {
    // Re-scan for markup added after init (leave reveal + preview alone).
    initHeader();
    initCounters();
    initTilt();
    initMagnetic();
    initGlow();
    initScenes3d();
    initCountdowns();
  }

  window.NGStudio = {
    version: VERSION,
    init: init,
    refresh: refresh,
    stopPreview: stopPreview
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
