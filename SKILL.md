---
name: premium-web-studio
description: >-
  Build a premium, agency-grade website (or a whole portfolio of them) by composing from a
  shared design system: dark cinematic tokens, a per-site accent, eight reusable section
  archetypes, GSAP scroll recipes, a direct-response funnel template, trilingual i18n, and a
  live-preview portfolio hub. Use when someone wants a "premium web studio" / a "studio design
  system", to "build a demo site portfolio", a "cinematic business website", a high-converting
  funnel, or a "$10k website design" look without paying $10k. The engine of a 20-site showcase:
  one CSS token file + one runtime JS drive every page, so a cheaper model reproduces the same
  polish without relearning it. Pairs with scroll-cinema (which supplies the scroll-scrubbed
  video hero this system frames).
---

# premium-web-studio

Compose premium websites from a **shared design system**, not from scratch each time. One token
file (`studio.css`) and one runtime (`studio.js`) give every page the same dark-cinematic base,
elevation, motion physics and accessibility floor; each site sets **one accent attribute** and
**composes from a fixed vocabulary of section archetypes**. That is how one studio shipped 20
distinct, on-brand demo sites (scroll-cinema films, 3D corporate sites, funnels, e-commerce,
dashboards) that all feel like one house - and how a lead model can plan a build and hand each
site to a cheaper builder that still lands the polish.

Reference build: the **NextGen Studio** showcase - live at https://fanacrack-demo-sites.vercel.app .
Twenty sites, three languages, one hub with live in-card previews.

**The three rules that make or break the house look:**
- **One brand signature + one per-site accent.** The studio signature is gold; each site flips
  `body[data-accent="..."]` to recolor its entire palette. Never two accents competing on one page.
- **Animate `transform`/`opacity` only, never `transition-all`.** Every interactive element gets
  hover + focus-visible + active. Reduced motion turns all decoration off and shows content fully.
- **Compose, don't invent.** A page is a stack of archetype sections (`arch-hero`, `arch-features`,
  `arch-stats`, `arch-pricing`, `arch-proof`, `arch-cta`, `arch-scene3d`, `arch-dash`). New look =
  new copy + new accent + a different archetype order, not new CSS.

This skill is the **method + the files**, framework-agnostic plain HTML: Tailwind (CDN) for layout
utilities, `studio.css` for the system, `studio.js` for behaviour, GSAP (CDN) only when a page has
scroll scenes. No build step, no bundler. It drops into any static host.

---

## What's in `templates/` (copy these VERBATIM)

| File | Role |
| --- | --- |
| `studio.css` | the design system: tokens, per-site accent map, 8 archetypes, reveal, marquee, countdown, preview mode, reduced-motion. Load after Tailwind, before per-site styles. |
| `studio.js` | the one runtime (`window.NGStudio`): reveal engine, sticky header, stat counters, tilt, magnetic, glow-track, CSS-3D scroll scenes, countdown, `?preview=1` auto-scroll. |
| `preview.js` | hub-only (`window.NGPreview`): turns collection cards into a poster -> looping-video -> live-iframe preview ladder with concurrency caps. |
| `i18n.js` | tiny runtime (`window.NGI18n`): wires the language switcher on baked pages, translates live on the EN source for authoring. |
| `prerender.mjs` | dev-only Node script: bakes `zh/` + `ms/` static pages from the EN source's `data-i18n` markup, swaps `<html lang>`, injects hreflang. |
| `site-template.html` | a scroll-cinema **site** shell (loads the scroll-cinema engines from `../shared/engines/`). |
| `funnel-template.html` | the 13-section direct-response **funnel** (hook -> agitate -> curriculum -> authority -> proof -> stack -> urgency -> FAQ). |
| `hub-template.html` | the portfolio **hub** (filter chips + preview cards), trimmed to 3 TODO cards. |

The two scroll-cinema engines (`scrub-engine.js`, `gsap-copy.js`) are NOT bundled here - they live
in the sibling **scroll-cinema** skill / repo. `site-template.html` loads them from
`shared/engines/`; drop them there (or clone scroll-cinema) when you build a scroll-film site.

---

## Project layout this system assumes

```
<project-root>/
  index.html                 # the HUB (hub-template.html) - lives at ROOT (shared/* with NO ../)
  shared/
    studio.css  studio.js  preview.js  i18n.js  prerender.mjs
    engines/                 # scroll-cinema engines, only if you build film sites
      scrub-engine.js  gsap-copy.js
    i18n/  zh.json  ms.json  # shared translation dictionaries
  <site-a>/index.html        # one dir per demo (site or funnel) - shared/* WITH ../
  <site-a>/assets/           # that site's images/video
  <site-a>/i18n/  zh.json ms.json   # per-site dictionary overrides (optional)
  hub-assets/                # hub card posters + preview clips
```

The **only path gotcha**: the hub sits at the root so it references `shared/studio.css`; every
subsite sits one level deeper so it references `../shared/studio.css`. `prerender.mjs` bumps
relative paths another `../` for the baked `zh/`, `ms/` copies automatically.

---

## Step 0 - Bootstrap

1. **Nothing to install for a static build.** Tailwind + GSAP load from CDN; `studio.css` /
   `studio.js` are plain files. `prerender.mjs` needs only Node (no deps).
2. **A local static server + screenshotter for QA.** Any static server works; the reference
   project used a zero-dep Node server on port 3100 plus a Puppeteer screenshot script. Drive it
   with the Playwright MCP for interactive checks.
3. **For scroll-cinema film sites:** the `higgsfield` CLI + `ffmpeg` (to render the scenes) and the
   scroll-cinema engines in `shared/engines/`. See the scroll-cinema skill.

---

## Step 1 - Plan the build (compose from archetypes)

Decide, per site, before writing any HTML:

- **Which template.** A **funnel** (offer/course/coach - use `funnel-template.html`), a **corporate
  scroll site** (build from archetypes, usually `arch-hero` + `arch-scene3d` + `arch-stats` +
  `arch-proof` + `arch-cta`), a **scroll-cinema film** (`site-template.html` + the scroll-cinema
  pipeline), an **e-commerce / dashboard** (archetypes + `arch-dash`).
- **The accent.** Pick a `data-accent` from the map in `studio.css` (or add one line). One accent
  per site. The hub stays gold.
- **The archetype order.** Write it as a list first (e.g. hero -> features -> stats -> pricing ->
  proof -> cta -> faq). This IS the page. See [references/archetypes.md](references/archetypes.md).
- **Copy + real assets.** Real content only - never fabricate clients, stats, or testimonials; demo
  sites must be clearly labeled AI-generated concepts. Placeholders (`https://placehold.co/`) for
  imagery you have not generated yet.

For a portfolio, plan the **hub last** - it just links the finished sites.

---

## Step 2 - Build order

Build **bottom-up** so the hub links things that already exist:

1. **Tokens are fixed** - do not edit `studio.css` per site. Set the accent via `data-accent`; if a
   site genuinely needs a new hue, add ONE line to the accent map (don't override tokens inline).
2. **Archetypes** - compose each subsite's `index.html` from archetype sections. Copy the closest
   template (`funnel-template.html` for offers, else start from the archetype snippets), swap copy,
   set `data-accent`, wire assets via relative `assets/...` paths.
3. **Sites** - one dir per demo. Each is self-contained (`index.html` + `assets/`). Load order in
   every page: Tailwind CDN -> `studio.css` -> (GSAP if scroll scenes) -> `studio.js`.
4. **Hub** - `hub-template.html` at the root, one `<a.demo-card>` per finished site, filter chips +
   counts in sync, a poster per card in `hub-assets/`. See [references/hub.md](references/hub.md).
5. **i18n (optional)** - mark copy with `data-i18n`, write `zh.json`/`ms.json`, run
   `node shared/prerender.mjs <dir>` to bake language pages. See [references/i18n.md](references/i18n.md).

---

## Step 3 - The per-site accent system

One attribute recolors the whole site. `studio.css` maps `body[data-accent="<key>"]` to
`--accent` / `--accent-deep` / `--accent-soft`, and every archetype, button, glow, focus ring and
elevation shadow reads those tokens:

```html
<body data-accent="leadership" class="bg-scene min-h-screen">   <!-- amber -->
<body data-accent="engineering">                                 <!-- cyan  -->
<body data-accent="fitness">                                     <!-- lime  -->
```

The **studio signature is gold** (`--gold`) and NEVER changes per site - it is the hub's primary
CTA (`.btn-gold`) and cross-sell moments. A site's own CTAs use `.btn-primary` (the accent). Full
token + accent reference: [references/design-system.md](references/design-system.md).

---

## Step 4 - The QA loop (every page, before it ships)

Run this on each site AND the hub:

1. **Screenshot both viewports** - desktop (e.g. 1440x900) and phone (390x844). Reveal-on-scroll
   blocks are hidden by default, so for a full-page shot append **`?reveal`** (force-shows every
   `.reveal` inline) or scroll each block into view first. Check: contrast holds, no text clipped,
   the hero is above the fold, mobile type is legible.
2. **Zero console errors.** `studio.js` and `preview.js` are defensive by contract; any thrown
   error is a real bug (usually a missing element a snippet assumed).
3. **The `?reveal` / `?preview=1` contract.** `?reveal` = force every reveal visible (for
   screenshots). `?preview=1` = hub preview mode: hides chrome (header, countdown, grain) and runs
   a slow top->bottom auto-scroll loop. **Any pinned/scroll-scrubbed track MUST collapse under both**
   - a scene that stays pinned when reveals are forced will strand the screenshot. Verify a scene3d
   page still scrolls cleanly with `?preview=1`.
4. **Reduced motion.** With `prefers-reduced-motion: reduce`, all decoration stops and content is
   fully visible (reveals show, counters show final value, marquee/float freeze). Toggle it and
   confirm nothing is stuck at opacity 0.
5. **Interactive states.** Every button/link has visible hover + focus-visible (tab to it) + active.

See [references/runtime.md](references/runtime.md) for what each `studio.js` feature does and its
markup contract.

---

## Step 5 - The parallel-builder delegation pattern

A portfolio is embarrassingly parallel because the sites are independent. The proven pattern:

- **The lead (this model) plans + QAs, never hand-codes all 20.** The lead locks the design system
  (already done - it is `studio.css`), writes the per-site briefs (template + accent + archetype
  order + copy notes), and owns the hub, the QA loop, and the final consistency pass.
- **Each builder owns exactly ONE directory.** A builder gets: the brief, the templates, the
  references, and a hard boundary - *touch only `<your-site>/`; never edit `shared/*`, the hub, or
  another builder's dir.* Because every site reads the same frozen `studio.css`, independent builders
  cannot drift the house style.
- **The design system is the contract.** Builders compose archetypes and swap copy/assets; they do
  NOT add new CSS or new tokens. If a builder thinks the system is missing something, it escalates to
  the lead (who may add one accent line or one archetype) rather than inventing a local style.
- **Lead's consistency pass** after builders finish: same load order everywhere, accents all from the
  map, every page passes the QA loop, hub counts match the real cards, all CTAs point at the right
  number/links.

Delegate with the Task tool: one builder per site, Sonnet or Opus (never a weaker model for
hand-built UI). Give each the two or three references it needs, not the whole skill.

---

## Reference index

- [references/design-system.md](references/design-system.md) - tokens, the accent map, elevation,
  motion rules, font pairing, the house anti-generic bar. Documented from `studio.css`.
- [references/archetypes.md](references/archetypes.md) - the 8 section archetypes, markup snippets,
  and which `studio.js` runtime hooks each one uses.
- [references/runtime.md](references/runtime.md) - the `studio.js` API + every markup contract
  (`reveal`, counters, tilt, magnetic, glow, scene3d scrubs, countdown, preview mode).
- [references/preview-widget.md](references/preview-widget.md) - the hub live-preview design: the
  poster -> looping-video -> live-iframe ladder, the visibility gates + concurrency caps.
- [references/i18n.md](references/i18n.md) - `data-i18n` markup, `prerender.mjs`, the hreflang +
  URL-model recipe, the language-switch contract.
- [references/funnel-recipe.md](references/funnel-recipe.md) - the direct-response funnel structure
  section by section, plus the trilingual + HRDC notes.
- [references/hub.md](references/hub.md) - the portfolio hub pattern: filter chips + `data-cat`, the
  card contract, deep-link hash, keeping counts in sync.

## Gotchas (hard-won)

- **Reveal is IntersectionObserver OR GSAP, never both fighting.** `studio.js` adds
  `html.gsap-on` when GSAP is present (which kills the CSS reveal transition and lets GSAP own it),
  and reveals via an INDEPENDENT tween in `onEnter` so a later `ScrollTrigger.refresh()` (fonts,
  images) can never reset an already-revealed block. Don't re-implement reveal on top of it.
- **`?reveal` and `?preview=1` must collapse pinned tracks.** Force-showing reveals or auto-scroll
  looping will strand a still-pinned scroll scene. Design scene3d sections so they scrub over a
  normal-height section (no `pin: true` that outlives preview mode).
- **Lazy images are blank in screenshots.** Anything above the fold, and the hub's featured poster,
  must be `loading="eager"` - a `loading="lazy"` hero photographs as an empty box. React 18 note:
  use `loading`, not `fetchPriority` (unsupported).
- **The filter's WAAPI animation is decoration, not state.** `applyFilter` toggles `.is-filtered`
  synchronously and only THEN runs `card.animate()`; never gate the show/hide on `onfinish` or rapid
  chip-clicking strands a card hidden (the classic WAAPI onfinish race).
- **Counters need the final value already in the DOM.** `[data-count-to]` re-animates a value that
  must already be the correct final text (for SEO + reduced motion + no-JS). Don't start from empty.
- **Countdowns seed synchronously.** `[data-countdown]` writes the first frame before paint (no `00`
  flash); give the cells container `aria-hidden` since a screen reader hears the timer tick.
- **Em-dashes: hyphens only.** A formatter hook rewrites a long dash to " - " in saved source. Use
  hyphens, commas, or "to"; only `&mdash;` in raw HTML entities.
- **Path depth: hub at root (no `../`), subsites one deeper (`../shared/...`), baked lang pages two
  deeper (prerender adds the extra `../` for you).** Mixing these up is the #1 broken-asset cause.
