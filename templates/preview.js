/* ============================================================================
   NextGen Studio - hub live-preview widget  (preview.js)
   ----------------------------------------------------------------------------
   ONLY the hub loads this. Turns collection cards into progressively-enhanced
   previews of each demo site, with a graceful fallback ladder. Vanilla, no deps,
   no module syntax. Exposes ONE global: window.NGPreview.

   API
     NGPreview.mountAll('[data-preview]')   // scan + enhance all matching cards

   CARD MARKUP CONTRACT
     <a href="construction/"                     the card is itself the link
        data-preview
        data-live="construction/"                live site URL (for the iframe)
        data-loop="construction/preview.webm"    looping preview clip (optional)
        data-poster="construction/preview-poster.webp">
       ... card chrome ...
     </a>
   The card must be position:relative (or the injected media is positioned to the
   first positioned ancestor). Injected media carries pointer-events:none so the
   card's own anchor keeps receiving clicks - do NOT intercept clicks here.

   FALLBACK LADDER (each rung only if the previous conditions allow)
     1. Poster <img> (lazy, decoding=async) - always.
     2. If NOT (reduced-motion || saveData || viewport <= 860px): upgrade to a
        muted looping <video playsinline preload=none>; an IntersectionObserver
        (threshold 0.25) gates play()/pause(). Global cap of 6 videos playing at
        once (a registry pauses the least-recently-visible when over cap).
     3. Desktop pointerenter/focusin of an in-view card: after a 250ms intent
        delay, build ONE global live <iframe src="<live>?preview=1"> scaled to fit
        the card, faded in on its load event, positioned over the video. Destroyed
        on pointerleave/focusout or when the card leaves the viewport.
     4. Any <video> error -> remove the video, keep the poster.

   HOUSE RULES: transform/opacity only, passive listeners, reduced-motion honored.
   ============================================================================ */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  var saveData = !!(conn && conn.saveData);
  var IFRAME_W = 1280, IFRAME_H = 2000, MAX_VIDEOS = 6, INTENT_MS = 250;

  var ric = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb(); }, 1); };
  var cic = window.cancelIdleCallback || clearTimeout;

  function smallViewport() { return Math.min(window.innerWidth, window.innerHeight) <= 860; }
  function motionOK() { return !reduceMQ.matches && !saveData && !smallViewport(); }
  function isFinePointer() { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; }

  // --- global playing-video registry (LRU by last-visible time) -------------
  var playing = []; // { video, seen }
  function registerPlaying(entry) {
    entry.seen = Date.now();
    var idx = playing.indexOf(entry);
    if (idx === -1) playing.push(entry);
    // Over cap: pause the least-recently-seen.
    while (playing.length > MAX_VIDEOS) {
      playing.sort(function (a, b) { return a.seen - b.seen; });
      var victim = playing.shift();
      if (victim && victim.video) { try { victim.video.pause(); } catch (e) {} }
    }
  }
  function unregisterPlaying(entry) {
    var idx = playing.indexOf(entry);
    if (idx !== -1) playing.splice(idx, 1);
  }

  // --- single global live iframe --------------------------------------------
  var liveIframe = null, liveOwner = null;
  function destroyLiveIframe() {
    if (liveIframe && liveIframe.parentNode) liveIframe.parentNode.removeChild(liveIframe);
    liveIframe = null;
    liveOwner = null;
  }

  function buildLiveIframe(card, liveURL) {
    if (liveOwner === card && liveIframe) return; // already showing for this card
    destroyLiveIframe();
    liveOwner = card;

    var rect = card.getBoundingClientRect();
    var scale = rect.width / IFRAME_W;
    var iframe = document.createElement('iframe');
    var sep = liveURL.indexOf('?') === -1 ? '?' : '&';
    iframe.src = liveURL + sep + 'preview=1';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Live preview');
    iframe.style.cssText =
      'position:absolute; top:0; left:0; z-index:2;' +
      'width:' + IFRAME_W + 'px; height:' + IFRAME_H + 'px;' +
      'transform-origin:top left; transform:scale(' + scale.toFixed(4) + ');' +
      'pointer-events:none; border:0; opacity:0;' +
      'transition:opacity 420ms ease;';
    iframe.addEventListener('load', function () {
      // Only reveal if this iframe still belongs to the hovered card.
      if (liveIframe === iframe) iframe.style.opacity = '1';
    });

    liveIframe = iframe;
    card.appendChild(iframe);
  }

  // --- per-card enhancement --------------------------------------------------
  function enhanceCard(card) {
    if (card.__ngPreviewBound) return;
    card.__ngPreviewBound = true;

    var posterURL = card.getAttribute('data-poster');
    var loopURL = card.getAttribute('data-loop');
    var liveURL = card.getAttribute('data-live');

    // Rung 1: poster image (always). Only inject if the card has no poster already.
    var stage = card.querySelector('[data-preview-stage]') || card;
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';

    var poster = null;
    if (posterURL && !card.querySelector('[data-preview-poster]')) {
      poster = document.createElement('img');
      poster.src = posterURL;
      poster.alt = '';
      poster.setAttribute('data-preview-poster', '');
      poster.setAttribute('loading', 'lazy');
      poster.decoding = 'async';
      poster.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none;';
      stage.insertBefore(poster, stage.firstChild);
    }

    // Rung 2: muted looping video (only if motion budget allows + we have a clip).
    var video = null, playEntry = null;
    if (loopURL && motionOK()) {
      video = document.createElement('video');
      video.src = loopURL;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('preload', 'none');
      video.setAttribute('aria-hidden', 'true');
      if (posterURL) video.poster = posterURL;
      video.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; pointer-events:none; opacity:0; transition:opacity 400ms ease;';

      // Rung 4: any error -> drop the video, keep poster.
      video.addEventListener('error', function () {
        if (playEntry) unregisterPlaying(playEntry);
        if (video && video.parentNode) video.parentNode.removeChild(video);
        video = null;
      });
      video.addEventListener('playing', function () { video.style.opacity = '1'; });

      stage.appendChild(video);
      playEntry = { video: video, seen: 0 };

      // Visibility gate: play when >= 25% in view, pause when out.
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!video) return;
          if (e.isIntersecting) {
            registerPlaying(playEntry);
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            unregisterPlaying(playEntry);
            video.pause();
            video.style.opacity = '0';
          }
        });
      }, { threshold: 0.25 });
      io.observe(card);
    }

    // Rung 3: desktop hover/focus -> one global live iframe (intent-delayed).
    if (liveURL && isFinePointer() && !reduceMQ.matches) {
      var intentTimer = null, idleHandle = null, inViewport = true;

      // Track viewport membership so we can tear the iframe down when it scrolls away.
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          inViewport = e.isIntersecting;
          if (!inViewport && liveOwner === card) destroyLiveIframe();
        });
      }, { threshold: 0.1 });
      vio.observe(card);

      function open() {
        if (!inViewport) return;
        idleHandle = ric(function () { buildLiveIframe(card, liveURL); });
      }
      function scheduleOpen() {
        clearTimeout(intentTimer);
        intentTimer = setTimeout(open, INTENT_MS);
      }
      function cancel() {
        clearTimeout(intentTimer);
        if (idleHandle != null) { cic(idleHandle); idleHandle = null; }
        if (liveOwner === card) destroyLiveIframe();
      }

      card.addEventListener('pointerenter', scheduleOpen);
      card.addEventListener('focusin', scheduleOpen);
      card.addEventListener('pointerleave', cancel);
      card.addEventListener('focusout', function (e) {
        // focusout fires when moving between children; only cancel when leaving the card.
        if (!card.contains(e.relatedTarget)) cancel();
      });
    }
  }

  function mountAll(selector) {
    var sel = selector || '[data-preview]';
    var cards = document.querySelectorAll(sel);
    for (var i = 0; i < cards.length; i++) enhanceCard(cards[i]);
  }

  window.NGPreview = { mountAll: mountAll };
})();
