# hub.md - the portfolio hub

The hub (`templates/hub-template.html`) is the showcase landing page: a filterable grid of demo cards,
each a live preview of a finished subsite. It lives at the PROJECT ROOT (so its `shared/*` paths have
no `../`) and links the subsites one level down. Build it LAST - it only links things that exist.

## Anatomy

- **Header** - wordmark (gold highlight) + a live-demos chip + section links.
- **Hero** - gold-signature headline (`.hero-grad` with the gold gradient), pitch, `.btn-gold` CTA.
  The hub uses `data-accent` only to tint the ambient `bg-scene` glow; its primary color is GOLD.
- **Collection** - the filter chip row + the `#demoGrid` of cards.
- **Services / cross-sell** - an `arch-cta` glass band with the "build yours" WhatsApp CTA.
- **Footer** - disclaimer + (optional) language switcher.

## The card contract

Each card is an `<a>` that is BOTH the click target and the preview host:

```html
<a href="construction/" class="reveal demo-card card group" style="--i:2" data-cat="cinema"
   data-preview data-live="construction/" data-poster="hub-assets/poster-construction.webp"
   data-loop="hub-assets/construction-loop.webm">   <!-- data-loop optional -->
  <div class="poster-box cover-scrim relative aspect-[4/5] sm:aspect-[4/3]">
    <img src="hub-assets/poster-construction.webp" alt="..." class="poster" loading="lazy" width="1280" height="800" />
    <div class="preview-host" aria-hidden="true"></div>
    <div class="ring"></div>
    <div class="absolute inset-x-0 bottom-0 z-[3] p-5">
      <p class="eyebrow text-white/60 mb-1.5">Industry &middot; Type</p>
      <h3 class="font-display uppercase text-xl text-white">Site Name</h3>
      <p class="mt-1.5 text-sm leading-[1.6] text-white/70">One-line hook.</p>
    </div>
  </div>
</a>
```

- `data-cat` = the filter category; it MUST match a chip's `data-filter`.
- `data-preview` + `data-live` + `data-poster` (+ optional `data-loop`) drive the preview widget
  ([preview-widget.md](preview-widget.md)).
- **Featured card**: add `sm:col-span-2` and a wider aspect (`sm:aspect-[16/9]`), give the poster
  `loading="eager"` (it is above the fold). Non-featured posters are `loading="lazy"`.
- Cover chrome sits at `z-3` over the poster (`z-0`), the preview host at `z-2`, the inset ring at
  `z-3`; the `cover-scrim` gradient keeps the title legible over any poster.

## The filter (transform/opacity only, state-first)

Chips are `.fchip[data-filter]` with `aria-pressed`. The click handler toggles `.is-filtered`
(display:none) on non-matching cards and updates the shown count:

```js
function applyFilter(cat, animate) {
  chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === cat)));
  let count = 0;
  cards.forEach(card => {
    const show = cat === 'all' || card.dataset.cat === cat;
    if (show) count++;
    const wasHidden = card.classList.contains('is-filtered');
    card.classList.toggle('is-filtered', !show);          // STATE FIRST (synchronous)
    if (animate && !reduce && show && wasHidden && card.animate) {
      card.animate([{opacity:0,transform:'scale(0.96)'},{opacity:1,transform:'scale(1)'}],
                   {duration:320, easing:'cubic-bezier(0.22,1,0.36,1)'});   // decoration only
    }
  });
  shown.textContent = count;
  if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 60);
}
```

**The WAAPI gotcha:** apply the show/hide class synchronously and only THEN run `card.animate()`.
Never gate visibility on `animation.onfinish` - rapid chip-clicking would interleave finish callbacks
and strand a card hidden. The animation is pure decoration; the class is the source of truth.

## Deep links

A hash like `/#dashboards` applies that filter on load (if it matches a chip). Chip clicks
`history.replaceState` the hash (`#<cat>`, or clean path for "all"), so a filtered view is shareable.

## Keeping counts in sync

Each chip shows a `.cnt`. When you add or remove a card, update:
1. the matching chip's `.cnt`,
2. the `all` chip's `.cnt` (total cards),
3. the `#shownCount` default (usually = total).

A mismatch here is the most common hub bug. After editing cards, count `data-cat` occurrences and
reconcile.

## Preview mount

Mount the widget only on hover devices:

```js
if (window.NGPreview && matchMedia('(hover:hover)').matches) NGPreview.mountAll('[data-preview]');
```

On touch, cards stay poster-only (the ladder floors at the poster anyway), which is correct - no
hover intent exists to trigger the live iframe.

## Path reminder

Hub at root: `shared/studio.css`, `shared/studio.js`, `shared/preview.js` (no `../`). Card `href`s and
`data-live`/`data-poster` are relative to the root (`construction/`, `hub-assets/...`). If you bake the
hub for zh/ms, `prerender.mjs` bumps those to `../` for the `zh/`,`ms/` copies automatically.
