/* ============================================================================
   NextGen Studio - i18n prerenderer  (prerender.mjs)   [dev-only, no deps]
   ----------------------------------------------------------------------------
   Bakes per-language static pages from an English source page marked up with
   data-i18n / data-i18n-html attributes. Pure Node fs + string work, DOM-less.

   USAGE  (run from the project root)
     node shared/prerender.mjs .                  # the hub (root index.html)
     node shared/prerender.mjs trainer-leadership # a subsite dir

   WHAT IT DOES  (source of truth = <dir>/index.html, written in English)
     For each target lang in zh, ms:
       1. Read <dir>/index.html.
       2. Load dictionaries (tolerate missing): shared/i18n/<lang>.json first,
          then <dir>/i18n/<lang>.json (site overrides shared).
       3. Stamp translations:
            data-i18n="key">TEXT<        -> replaces the inner TEXT
            data-i18n-html="key">HTML</  -> replaces inner HTML up to the first
                                            close tag (LEAF ELEMENTS ONLY - see
                                            limitation below)
          Keys missing from the dictionary are left untouched (English shows).
       4. Swap <html lang="en"> -> <html lang="<lang>"> and add data-i18n-baked.
       5. Rewrite relative asset URLs (href/src) by prefixing "../" one level,
          because the baked file lives one directory deeper (<dir>/<lang>/).
       6. Inject <link rel="alternate" hreflang> for en/zh/ms (+ x-default).
       7. Write <dir>/<lang>/index.html.
     Also patches the EN source in place with the hreflang block (idempotent).

   LEAF-ELEMENT LIMITATION (data-i18n-html): the inner-HTML replace is non-greedy
   up to the FIRST "</", so the target element must NOT contain nested child
   elements with their own closing tags (inline <strong>/<em>/<a> that are the
   ONLY content and close before any other "</" are fine; a <ul> full of <li> is
   not - put data-i18n on each leaf instead).

   HREFLANG NOTE: hrefs are RELATIVE (deploy domain is unknown at build time),
   which crawlers tolerate. Swap to absolute URLs if you wire a canonical origin.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

var __dirname = path.dirname(fileURLToPath(import.meta.url));   // .../shared
var SHARED_I18N = path.join(__dirname, 'i18n');                 // .../shared/i18n
var TARGET_LANGS = ['zh', 'ms'];
var ALL_LANGS = ['en', 'zh', 'ms'];
var HREFLANG_START = '<!-- ng:hreflang:start -->';
var HREFLANG_END = '<!-- ng:hreflang:end -->';

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn('  ! could not parse ' + file + ': ' + e.message);
    return null;
  }
}

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

function lookup(obj, dotPath) {
  var parts = dotPath.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[parts[i]];
  }
  return typeof cur === 'string' ? cur : undefined;
}

// Stamp data-i18n text nodes: (data-i18n="key" ...>)(TEXT)(<)
function stampText(html, dict) {
  return html.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)(<)/g, function (m, open, key, text, lt) {
    var val = lookup(dict, key);
    if (val === undefined) return m;               // key missing -> keep English
    return open + escapeHtmlText(val) + lt;
  });
}

// Stamp data-i18n-html nodes. Captures the element's own tag name and replaces
// the inner HTML up to that element's MATCHING close tag (via \1 backref), so
// inline children in the SOURCE (a <strong>/<em>/<a>) do not truncate it.
// LEAF LIMITATION: a NESTED element of the SAME tag name (e.g. a <div> inside a
// data-i18n-html <div>) closes early and breaks - keep these elements leaf-ish.
function stampHtml(html, dict) {
  return html.replace(
    /<([a-zA-Z][\w-]*)\b([^>]*\bdata-i18n-html="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    function (m, tag, attrs, key, inner) {
      var val = lookup(dict, key);
      if (val === undefined) return m;             // key missing -> keep English
      return '<' + tag + attrs + '>' + val + '</' + tag + '>'; // raw HTML on purpose
    });
}

// Minimal text escaping for translated plain text (keeps markup safe).
function escapeHtmlText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Swap <html lang="xx"> -> target lang + add data-i18n-baked (idempotent).
function setHtmlLang(html, lang) {
  var out = html.replace(/<html([^>]*)>/i, function (m, attrs) {
    var a = attrs;
    if (/\slang=/.test(a)) a = a.replace(/\slang="[^"]*"/i, ' lang="' + lang + '"');
    else a = ' lang="' + lang + '"' + a;
    if (!/data-i18n-baked/.test(a)) a += ' data-i18n-baked';
    return '<html' + a + '>';
  });
  return out;
}

// Prefix "../" to a relative URL (output is one dir deeper). Leaves absolute /
// protocol / anchor / data URLs alone.
function bumpUrl(u) {
  if (/^(https?:)?\/\//i.test(u)) return u;        // //host or http(s)://
  if (/^(\/|#|data:|mailto:|tel:|javascript:)/i.test(u)) return u;
  if (u.indexOf('./') === 0) return '../' + u.slice(2);
  return '../' + u;
}

// Rewrite href="" and src="" relative paths.
function rewriteAssetPaths(html) {
  return html.replace(/\b(href|src)="([^"]*)"/gi, function (m, attr, url) {
    return attr + '="' + bumpUrl(url) + '"';
  });
}

// Build the hreflang <link> block for an output at a given depth.
//   depth 0 = EN source (site dir);  depth 1 = <lang>/ output (one deeper)
function hreflangBlock(depth) {
  var variants = { en: '', zh: 'zh/', ms: 'ms/' };
  function hrefFor(langPath) {
    if (depth === 0) return langPath === '' ? './' : langPath;
    // one level deeper: go up, then into the variant dir
    return langPath === '' ? '../' : '../' + langPath;
  }
  var lines = [HREFLANG_START];
  ALL_LANGS.forEach(function (l) {
    lines.push('  <link rel="alternate" hreflang="' + l + '" href="' + hrefFor(variants[l]) + '" />');
  });
  lines.push('  <link rel="alternate" hreflang="x-default" href="' + hrefFor(variants.en) + '" />');
  lines.push(HREFLANG_END);
  return lines.join('\n');
}

// Strip any previously-injected hreflang block (for idempotency). Consumes only
// horizontal leading whitespace + ONE trailing newline, symmetric with inject
// below, so repeated runs are byte-stable regardless of <head> formatting.
function stripHreflang(html) {
  var re = new RegExp('[ \\t]*' + escapeRe(HREFLANG_START) + '[\\s\\S]*?' + escapeRe(HREFLANG_END) + '\\n?', 'g');
  return html.replace(re, '');
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Insert the hreflang block right before </head> (strip old one first).
function injectHreflang(html, depth) {
  var clean = stripHreflang(html);
  var block = hreflangBlock(depth);
  if (/<\/head>/i.test(clean)) {
    return clean.replace(/<\/head>/i, block + '\n</head>');
  }
  return clean + '\n' + block;   // no <head> (unlikely) - append
}

function loadDict(siteDir, lang) {
  var dict = {};
  deepMerge(dict, readJSON(path.join(SHARED_I18N, lang + '.json')));
  deepMerge(dict, readJSON(path.join(siteDir, 'i18n', lang + '.json')));
  return dict;
}

function prerender(siteArg) {
  var siteDir = path.resolve(process.cwd(), siteArg);
  var srcFile = path.join(siteDir, 'index.html');
  if (!fs.existsSync(srcFile)) {
    console.error('ERROR: source not found: ' + srcFile);
    process.exit(1);
  }

  var srcHtml = fs.readFileSync(srcFile, 'utf8');
  var written = [];

  // 1. Bake each target language.
  TARGET_LANGS.forEach(function (lang) {
    var dict = loadDict(siteDir, lang);
    var out = srcHtml;
    out = stripHreflang(out);          // work from a clean copy
    out = stampText(out, dict);
    out = stampHtml(out, dict);
    out = setHtmlLang(out, lang);
    out = rewriteAssetPaths(out);
    out = injectHreflang(out, 1);      // depth 1 (one dir deeper)

    var outDir = path.join(siteDir, lang);
    fs.mkdirSync(outDir, { recursive: true });
    var outFile = path.join(outDir, 'index.html');
    fs.writeFileSync(outFile, out, 'utf8');
    written.push(outFile);
    var keys = countStamped(srcHtml, dict);
    console.log('  baked ' + lang + ' -> ' + path.relative(process.cwd(), outFile) + '  (' + keys + ' keys stamped)');
  });

  // 2. Patch the EN source with its hreflang block (idempotent: strip + reinject).
  var patched = injectHreflang(srcHtml, 0);
  if (patched !== srcHtml) {
    fs.writeFileSync(srcFile, patched, 'utf8');
    console.log('  patched EN source hreflang -> ' + path.relative(process.cwd(), srcFile));
  } else {
    console.log('  EN source hreflang already current (no change)');
  }

  return written;
}

// Count how many i18n keys resolved (for the log line).
function countStamped(html, dict) {
  var n = 0;
  var re = /data-i18n(?:-html)?="([^"]+)"/g, m;
  while ((m = re.exec(html))) { if (lookup(dict, m[1]) !== undefined) n++; }
  return n;
}

// --- CLI entry -------------------------------------------------------------
var arg = process.argv[2];
if (!arg) {
  console.error('Usage: node shared/prerender.mjs <sitePathRelativeToRoot>');
  console.error('  e.g. node shared/prerender.mjs .   |   node shared/prerender.mjs trainer-leadership');
  process.exit(1);
}
console.log('Prerendering "' + arg + '" -> ' + TARGET_LANGS.join(', '));
prerender(arg);
console.log('Done.');

export { prerender, stampText, stampHtml, bumpUrl, hreflangBlock };
