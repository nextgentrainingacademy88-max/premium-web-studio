# design-system.md - tokens, accent, elevation, motion, type

Everything here is documented from `templates/studio.css`. Do NOT edit `studio.css` per site; set
the accent with `data-accent` and compose. The one allowed edit is adding a single line to the
accent map for a genuinely new hue.

## 1. Surfaces + ink (the dark base)

```
--pitch:       #0A0E16   /* page background (bg-scene layers gradients over this) */
--surface:     #0F131C   /* cards, panels (base elevation) */
--surface-2:   #151B27   /* chips, kpi tiles, frame bars (elevated) */
--line:        rgba(255,255,255,0.08)   /* hairline borders */
--line-strong: rgba(255,255,255,0.14)

--ink:      #F3F6FA   /* primary text */
--ink-soft: #AEB9CA   /* secondary text - >= 4.5:1 on ALL surfaces (safe for body) */
--ink-dim:  #6E7A8D   /* eyebrows / tertiary ONLY - large or uppercase, never body copy */
```

House contrast rule: body text >= 16px stays >= 4.5:1 on its surface. `--ink-soft` is the lowest you
go for real sentences; `--ink-dim` is for uppercase eyebrows and tiny labels only.

Apply the base with two classes on `<body>`: `bg-scene` (the layered accent-aware radial-gradient
background) + a `<div class="grain">` overlay (fixed SVG-noise, `opacity: 0.045`) for depth. This
grain + layered-gradient combo is what keeps the dark from reading flat.

## 2. The studio signature vs. the per-site accent

Two color roles, never confused:

- **Gold signature** (`--gold #FFD75E`, `--gold-deep #E7B93F`) - NEVER changes. It is the studio's
  identity: the hub wordmark highlight, `.btn-gold` (the hub's primary CTA + cross-sell moments), the
  "how it's made" step numbers. A subsite uses gold sparingly or not at all.
- **Per-site accent** (`--accent`, `--accent-deep`, `--accent-soft`) - set by ONE attribute on
  `<body>`. Every archetype, `.btn-primary`, glow, focus ring, chip dot, and the `--accent-soft`
  elevation shadow reads it. One accent per page.

```html
<body data-accent="engineering">   <!-- becomes cyan #16C7E4 -->
```

### The accent map (from studio.css)

| `data-accent` | hue | | `data-accent` | hue |
| --- | --- | --- | --- | --- |
| `construction` | amber `#FFB020` | | `restaurant` | orange `#F26419` |
| `hotel` | champagne `#E8C170` | | `apparel` | near-white `#F5F5F5` |
| `realestate` | teal `#6FD3C7` | | `supplements` | green `#46E0A0` |
| `manufacturing` | blue `#5FA8FF` | | `saas` | studio blue `#4D7CFF` |
| `engineering` | cyan `#16C7E4` | | `fitness` | lime `#C6F135` |
| `property` | violet `#9D8CFF` | | `training` | cyan `#16C7E4` |
| `hospitality` | coral `#FF8A5B` | | `leadership` | amber `#FFB020` |
| `fnb` | red `#FF6B6B` | | `communication` | blue `#5FA8FF` |
| `eq` | pink `#FF7BAC` | | `dashboard` | green `#46E0A0` |

Default (no attribute) = studio blue `#4D7CFF`. To add a hue, copy one line and set the three
`--accent*` values (soft = the accent at `0.14` alpha):

```css
body[data-accent="aviation"] { --accent:#3EC6FF; --accent-deep:#1FA6E0; --accent-soft:rgba(62,198,255,0.14); }
```

## 3. Elevation (base -> elevated -> floating)

Three shadow tokens, layered (never a flat `shadow-md`). `--e3` mixes in `--accent-soft` so the
floating layer glows in the site's own color:

```
--e1: 0 1px 2px rgba(0,0,0,0.5)
--e2: 0 1px 2px rgba(0,0,0,0.5), 0 10px 26px -10px rgba(0,0,0,0.6)          /* cards at rest */
--e3: 0 2px 4px..., 0 20px 50px -16px rgba(0,0,0,0.7), 0 30px 90px -30px var(--accent-soft)  /* hover / popular tier / glass band */
```

`.card` sits at `--e2`, lifts to `--e3` + `translateY(-4px)` on hover, presses to
`translateY(-1px) scale(0.995)` on active. That hover-lift + color-tinted floating shadow is the
"expensive" tell - keep it.

## 4. Motion rules

```
--ease-out: cubic-bezier(0.22, 1, 0.36, 1)   /* the house easing - snappy out */
--dur-fast: 180ms   --dur-med: 280ms   --dur-slow: 560ms
```

- **Animate `transform` and `opacity` only.** Never `transition-all`; never animate width/height/
  top/left (they thrash layout). Buttons transition `transform`, `box-shadow`, `filter` - listed
  explicitly, never `all`.
- **Every interactive element gets three states:** hover, `:focus-visible` (a 2px accent outline,
  `outline-offset: 3px`), and active (a scale-down press). The focus ring is global in `studio.css`.
- **Reduced motion is a hard floor.** `@media (prefers-reduced-motion: reduce)` turns off reveal
  transitions, button transitions, the live-chip pulse, the scene3d float, and the marquee - and
  shows all content. Never ship a page that hides content behind motion.

## 5. Type + font pairing

```
--font-display: 'Archivo Black' (hub/funnel) or 'Anton' (scroll sites), Impact fallback; letter-spacing: -0.035em
--font-body:    'Inter', 'Noto Sans SC' (zh), system-ui
```

Pairing rule: a heavy condensed display face for UPPERCASE headlines with tight negative tracking,
Inter for body at `1.7` line-height. Numbers use `.tnum` (tabular) so counters + prices don't jitter.

Fluid type scale (clamp, so it never needs breakpoints):

```
--fs-hero: clamp(2.6rem, 1.1rem + 6.6vw, 5rem)
--fs-h2:   clamp(1.75rem, 1.1rem + 2.6vw, 2.5rem)
--fs-h3: 1.375rem   --fs-lg: 1.125rem   --fs-body: 0.9375rem   --fs-sm: 0.8125rem
--fs-eyebrow: 0.75rem   /* uppercase, letter-spacing 0.24em, weight 700 */
```

Headlines are `.font-display uppercase`; the hero uses `.hero-grad` (a white -> accent text gradient
clip) for the signature look. Set the size inline with the token: `style="font-size: var(--fs-h2)"`.

## 6. The anti-generic bar (house look, do not regress)

- No default Tailwind indigo/blue as a primary - the accent is always a deliberate brand hue from
  the map.
- Layered color-tinted shadows (`--e2`/`--e3`), never flat `shadow-md`.
- Display + body pairing with tight tracking on large headings + `1.7` body line-height.
- Layered radial gradients (`bg-scene`) + SVG-noise grain for depth on every dark surface.
- A base -> elevated -> floating z/shadow system (surfaces + the three `--e*` tokens).
- Only `transform`/`opacity` animate; every interactive element has hover + focus-visible + active.
