# runtime.md - the studio.js API + markup contracts

`templates/studio.js` is the ONE script every page loads (after Tailwind + `studio.css`, and after
GSAP + ScrollTrigger IF the page uses `.arch-scene3d` scroll scenes). Plain script, no modules.
Exposes exactly one global: `window.NGStudio`. Every feature is a no-op if its markup is absent, and
every feature respects reduced motion + touch where relevant.

```html
<script src="https://cdn.tailwindcss.com"></script>
<link  rel="stylesheet" href="../shared/studio.css">
<!-- only if the page uses arch-scene3d: -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="../shared/studio.js"></script>
```

## API

| Call | Effect |
| --- | --- |
| `NGStudio.init()` | idempotent; auto-runs on `DOMContentLoaded`. |
| `NGStudio.refresh()` | re-scan the DOM after you inject markup; rebinds counters / tilt / magnetic / glow / countdowns (leaves reveal + preview alone). |
| `NGStudio.stopPreview()` | halt the `?preview=1` auto-scroll loop. |
| `NGStudio.version` | version string. |

Every per-element binder guards with a `__ngStudioBound` flag, so `refresh()` never double-binds.

## 1. Reveal - `.reveal` (the core animation)

Add `.reveal` to any block to animate it in. Add `data-load` to animate on page LOAD (hero);
without it, it animates on scroll-enter. Stagger siblings with `style="--i:n"` (55ms * n).

Three code paths, chosen automatically:
- **GSAP present** -> `html.gsap-on` (kills the CSS transition so GSAP owns it). Load-in blocks tween
  on load; scroll blocks reveal via an INDEPENDENT tween in `ScrollTrigger.onEnter` (`once:true`), so
  a later `ScrollTrigger.refresh()` (fonts, late images) can never reset an already-revealed block.
  Refreshes on `document.fonts.ready`.
- **No GSAP** -> IntersectionObserver adds `.in`, with an 1800ms failsafe that reveals everything (a
  block can never be permanently stuck at opacity 0).
- **Reduced motion OR `?reveal` OR `?preview=1`** -> force-show inline immediately (no animation).

Do not re-implement reveal on top of this; just add the class.

## 2. Sticky header - `.site-head`

Gets `.scrolled` (a hairline bottom border) when `scrollY > 8`. Passive listener. One element only.

## 3. Stat counters - `[data-count-to]`

```html
<span data-count-to="1200" data-count-prefix="" data-count-suffix="+" data-count-dur="1600">1,200+</span>
```

Animates once on first entry (IntersectionObserver, threshold 0.4), eased. **The final formatted
value must already be the element's text** (for SEO, no-JS, and reduced motion - which skips the
animation and keeps the static value). Handles decimals from the target string; formats with
`Intl.NumberFormat('en-MY')`.

## 4. Tilt cards - `[data-tilt]`

Pointer-following 3D tilt, max 6deg, rAF-lerped. Inert on touch + reduced motion. Sets
`transform-style: preserve-3d` on the card itself.

## 5. Magnetic buttons - `[data-magnetic]`

The element eases toward the pointer (strength 0.25, max 12px), springs back on leave (GSAP
`elastic.out` if present, else a CSS-transition fallback). Inert on touch + reduced motion. Put it on
primary CTAs.

## 6. Glow-track - `.arch-features .feat`

Binds automatically (no attribute): pointer position sets `--mx`/`--my`, which drive the card's
`::before` radial accent glow. Off under reduced motion.

## 7. CSS-3D scroll scenes - `.arch-scene3d` (needs GSAP)

Transform-only scrubs over the section's scroll range (`start: 'top bottom'`, `end: 'bottom top'`,
`scrub: true`):

| Attribute | Effect |
| --- | --- |
| `data-depth="0.2"` | translateZ `220*depth -> -220*depth` and Y `60*depth -> -60*depth` across the range (parallax). |
| `data-scrub-rotate="8"` | rotate `-8deg -> +8deg` across the range. |
| `data-scrub-scale="0.9"` | scale `0.9 -> 1` (ends at section center). |

Mirrors the home site's `data-parallax` vocabulary. Off under reduced motion. Never combine a GSAP
Y-transform with a Tailwind `-translate-y` on the same element - let one own the transform.

## 8. Countdown - `[data-countdown]`

```html
<div class="ng-countbar" data-countdown="2026-08-30T09:00:00+08:00" aria-hidden="true">
  <span class="cell"><span data-cd="d">00</span>d</span>
  <span class="cell"><span data-cd="h">00</span>h</span>
  <span class="cell"><span data-cd="m">00</span>m</span>
  <span class="cell"><span data-cd="s">00</span>s</span>
</div>
```

Parses the ISO datetime, seeds the cells synchronously BEFORE first paint (no `00` flash), then ticks
each second. Adds `.is-ended` when the target passes. Give the container `aria-hidden` (a screen
reader should not hear a ticking timer). Child cells are `[data-cd=d|h|m|s]`.

## 9. Preview mode - `?preview=1`

Hub loops / screenshots. Adds `html.ng-preview` (hides header, countdown, grain via `studio.css`),
force-shows all reveals, then runs an eased top->bottom auto-scroll (~14s) with a hold, jump to top,
loop forever. Uses `window.scrollTo` (not smooth-behavior) so it drives scroll-linked GSAP correctly.
`NGStudio.stopPreview()` stops it.

## The two URL flags (QA contract)

- **`?reveal`** - force every `.reveal` visible immediately (for a full-page screenshot; without it,
  below-the-fold blocks shoot blank).
- **`?preview=1`** - preview mode above (chrome hidden + auto-scroll loop).

BOTH must leave scroll scenes in a scrollable, non-stranded state. A `.arch-scene3d` that stays
pinned when reveals are forced will break the screenshot - design scenes to scrub over a normal-height
section, never a pin that outlives preview mode.
