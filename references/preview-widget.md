# preview-widget.md - the hub live-preview ladder

Only the HUB loads `templates/preview.js`. It turns collection cards into progressively-enhanced
previews of each demo site, with a graceful fallback ladder so a card is never broken, never janky,
and never plays 20 videos at once. Vanilla, no deps. One global: `window.NGPreview`.

```js
NGPreview.mountAll('[data-preview]');   // scan + enhance all matching cards
```

Mount it only on hover-capable devices (the hub does `if (matchMedia('(hover:hover)').matches)`).

## Card markup contract

The card is itself the link (`<a>`), so the preview media must never steal its clicks:

```html
<a href="construction/" class="demo-card card group" data-cat="cinema"
   data-preview
   data-live="construction/"                       <!-- URL the live iframe loads -->
   data-loop="hub-assets/construction-loop.webm"   <!-- OPTIONAL looping clip -->
   data-poster="hub-assets/poster-construction.webp">
  <div class="poster-box cover-scrim relative aspect-[16/9]">
    <img src="hub-assets/poster-construction.webp" class="poster" loading="eager" ... />
    <div class="preview-host" aria-hidden="true"></div>   <!-- iframe host (z-2) -->
    <div class="ring"></div>
    ... card chrome (title, eyebrow) at z-3 ...
  </div>
</a>
```

The stage (`[data-preview-stage]` or the card) is forced `position: relative`; injected media is
`position:absolute; pointer-events:none` so the anchor keeps receiving clicks. Do NOT intercept
clicks in `preview.js`.

## The fallback ladder (each rung only if the previous conditions allow)

1. **Poster `<img>`** (lazy, `decoding=async`) - ALWAYS. The floor. (If the card already has a
   `.poster` img, it is reused; otherwise one is injected under the chrome.)
2. **Muted looping `<video playsinline preload=none>`** - only if `data-loop` exists AND the motion
   budget allows: `!reduced-motion && !saveData && min(vw,vh) > 860px`. An IntersectionObserver
   (threshold 0.25) gates `play()`/`pause()`; a video fades in on `playing`, out when it leaves view.
3. **One global live `<iframe src="<live>?preview=1">`** - desktop fine-pointer only, on
   `pointerenter`/`focusin` of an in-view card, after a **250ms intent delay** (so a fast mouse
   sweep never spawns iframes). It is scaled to fit the card (`transform: scale(cardW / 1280)`,
   `transform-origin: top left`), faded in on its `load`. Destroyed on `pointerleave`/`focusout`, or
   when the card scrolls out of the viewport. `?preview=1` makes the loaded site hide chrome +
   auto-scroll (see runtime.md).
4. **Any `<video>` error** -> remove the video, keep the poster. The card degrades, never breaks.

## The two caps that keep it smooth

- **Video concurrency cap: 6.** A global LRU registry (`{video, seen}`) tracks playing videos; when a
  7th starts, the least-recently-visible is paused. So a long scroll past 20 cards never has 20
  decoders live.
- **Exactly ONE live iframe at a time.** There is a single global `liveIframe`/`liveOwner`; opening a
  new card's iframe destroys the previous. Hovering fast across the grid never stacks iframes.

Intent + idle: the iframe build is wrapped in `requestIdleCallback` after the 250ms intent timer, so
it never competes with the hover animation frame.

## Sizing note

`IFRAME_W = 1280`, `IFRAME_H = 2000` (a tall desktop viewport of the live site), then scaled down to
the card width. If your live sites want a different framing, change those constants - the scale is
derived from `card.width / IFRAME_W`.

## Reduced motion / save-data

Under reduced motion the ladder stops at the poster (no video, no iframe). Under `saveData` or a
small viewport the video rung is skipped. The poster alone still looks intentional because the card
chrome (scrim + title + play glyph) sits on top of it.
