/* ============================================================================
   NextGen Studio - tiny i18n runtime  (i18n.js)
   ----------------------------------------------------------------------------
   Vanilla, no deps, no module syntax. Exposes ONE global: window.NGI18n.

   The site's REAL per-language pages are PRERENDERED (shared/prerender.mjs stamps
   the strings in + swaps <html lang> + adds data-i18n-baked). This runtime is a
   dev/authoring convenience: on a baked page it ONLY wires the language switcher
   (it skips fetching + DOM walking). On an un-baked EN source page it fetches the
   dictionaries and translates live so authors can preview a language.

   API
     NGI18n.init({
       base:   './i18n/',          // site-local dictionaries  <lang>.json
       shared: '../shared/i18n/',  // shared dictionaries      <lang>.json
       langs:  ['en','zh','ms']    // supported languages (first = default/EN)
     })
     NGI18n.t('hero.title')        // dot-path lookup in the merged dictionary
     NGI18n.lang                   // resolved current language (from <html lang>)

   MARKUP CONTRACT
     <html lang="en">                          current language
     <html ... data-i18n-baked>                 page is prerendered -> switcher only
     <h1 data-i18n="hero.title">Text</h1>       textContent set from key
     <div data-i18n-html="hero.rich">..</div>   innerHTML set from key
     <a data-lang-switch="zh">中文</a>          click -> navigates to the /zh/ sibling
                                                URL. Current lang gets aria-current.

   DICTIONARIES are nested JSON, e.g. { "hero": { "title": "..." } }. Site-local
   values override shared values on the same key. Either file may 404 (tolerated).

   URL MODEL: en = no prefix (/, /about/), zh = /zh/..., ms = /ms/... The switcher
   strips a leading /<lang> segment then prefixes the target (en adds nothing).
   ============================================================================ */
(function () {
  'use strict';

  var cfg = { base: './i18n/', shared: '../shared/i18n/', langs: ['en', 'zh', 'ms'] };
  var dict = {};

  function docLang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    // normalize e.g. "zh-CN" -> "zh" if we support the base
    if (cfg.langs.indexOf(l) === -1 && l.indexOf('-') !== -1) {
      var base = l.split('-')[0];
      if (cfg.langs.indexOf(base) !== -1) l = base;
    }
    return l;
  }

  // Merge src into target (deep), src wins.
  function deepMerge(target, src) {
    if (!src) return target;
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
        target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? target[k] : {}, src[k]);
      } else {
        target[k] = src[k];
      }
    }
    return target;
  }

  // Dot-path lookup. Returns undefined when the key is missing.
  function lookup(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return typeof cur === 'string' ? cur : (cur == null ? undefined : cur);
  }

  function t(key) {
    var v = lookup(dict, key);
    return v == null ? undefined : v;
  }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function applyTranslations() {
    var textNodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textNodes.length; i++) {
      var el = textNodes[i];
      var val = lookup(dict, el.getAttribute('data-i18n'));
      if (typeof val === 'string') el.textContent = val;
    }
    var htmlNodes = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlNodes.length; j++) {
      var hel = htmlNodes[j];
      var hval = lookup(dict, hel.getAttribute('data-i18n-html'));
      if (typeof hval === 'string') hel.innerHTML = hval;
    }
  }

  // Compute the sibling URL for a target language from the current pathname.
  // Strips a leading /<lang>/ segment (for any supported non-EN lang), then
  // prefixes the target lang (EN = no prefix).
  function urlForLang(targetLang) {
    var path = location.pathname || '/';
    // strip a leading supported-lang segment
    var segs = path.split('/'); // ['', 'zh', 'about', ...]
    if (segs.length > 1 && cfg.langs.indexOf(segs[1]) !== -1 && segs[1] !== cfg.langs[0]) {
      segs.splice(1, 1);
      path = segs.join('/');
      if (path === '') path = '/';
    }
    if (!/^\//.test(path)) path = '/' + path;
    var prefixed;
    if (targetLang === cfg.langs[0]) {
      prefixed = path; // EN: no prefix
    } else {
      prefixed = '/' + targetLang + (path === '/' ? '/' : path);
    }
    return prefixed + (location.search || '') + (location.hash || '');
  }

  function wireSwitchers() {
    var cur = docLang();
    var switches = document.querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < switches.length; i++) {
      (function (el) {
        var target = (el.getAttribute('data-lang-switch') || '').toLowerCase();
        if (target === cur) {
          el.setAttribute('aria-current', 'true');
        } else {
          el.removeAttribute('aria-current');
        }
        if (el[' __ngLangBound']) return;
        el[' __ngLangBound'] = true;
        el.addEventListener('click', function (e) {
          if (!target || target === cur) return;
          // Let real anchors with a correct href work natively; otherwise navigate.
          e.preventDefault();
          location.href = urlForLang(target);
        });
      })(switches[i]);
    }
  }

  function init(options) {
    if (options) {
      if (options.base) cfg.base = options.base;
      if (options.shared) cfg.shared = options.shared;
      if (options.langs && options.langs.length) cfg.langs = options.langs;
    }
    var lang = docLang();
    NGI18n.lang = lang;

    // Always wire the switcher.
    wireSwitchers();

    // Baked page: strings are already stamped in. Skip fetch + DOM walk.
    if (document.documentElement.hasAttribute('data-i18n-baked')) {
      return Promise.resolve();
    }

    // Un-baked: fetch shared + site dictionaries for the current lang and stamp live.
    return Promise.all([
      fetchJSON(cfg.shared + lang + '.json'),
      fetchJSON(cfg.base + lang + '.json')
    ]).then(function (res) {
      dict = {};
      deepMerge(dict, res[0]); // shared first
      deepMerge(dict, res[1]); // site overrides shared
      applyTranslations();
      return dict;
    });
  }

  var NGI18n = {
    init: init,
    t: t,
    lang: 'en',
    urlForLang: urlForLang
  };
  window.NGI18n = NGI18n;
})();
