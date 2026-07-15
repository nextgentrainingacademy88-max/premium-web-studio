# archetypes.md - the 8 section vocabulary

A page is a stack of archetype sections. New look = new copy + new accent + a different order, not
new CSS. Mark each with `data-arch="..."` (for QA tooling) and use the `arch-*` class that carries
the styling. Which `studio.js` runtime hooks each one wants is listed per archetype (see
[runtime.md](runtime.md) for the hook contracts).

All eight styles live in `templates/studio.css` section 6. Snippets below are the minimum markup;
copy real, fleshed-out versions from `funnel-template.html` (hero, features, proof, pricing, cta) or
a corporate site.

---

## 1. HERO - `arch-hero` (full-bleed cinematic opener)

`min-height: 100dvh`, flex-centered. The headline uses `.hero-grad` (white -> accent text-clip). Hero
blocks carry `data-load` so `studio.js` animates them in on page load (not on scroll).

```html
<section class="arch-hero" data-arch="hero" aria-labelledby="hero-title">
  <div class="max-w-6xl mx-auto px-6 w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center py-16">
    <div>
      <p class="reveal chip mb-6" data-load style="--i:0"><span class="chip-dot"></span>Eyebrow</p>
      <h1 id="hero-title" class="reveal font-display uppercase leading-[0.98] text-white" data-load style="--i:1; font-size: var(--fs-hero)">
        <span class="hero-grad">Big</span><br/>Headline
      </h1>
      <p class="reveal mt-6 text-[color:var(--ink-soft)] max-w-xl" data-load style="--i:2; font-size: var(--fs-lg)">Sub.</p>
      <div class="reveal mt-8 flex flex-wrap gap-3" data-load style="--i:3">
        <a href="#pricing" data-magnetic class="btn-primary">Primary CTA</a>
        <a href="#more" class="btn-ghost">Secondary</a>
      </div>
    </div>
    <!-- right: a trainer cutout / product / orb with an accent-soft radial glow behind it -->
  </div>
</section>
```

Runtime: `reveal` + `data-load` (load-in), `data-magnetic` on CTAs. Hero image must be
`loading="eager"` (a lazy hero photographs blank). If a countdown bar is present, add
`body.has-countbar` so the hero clears it.

## 2. FEATURE STRIP - `arch-features` (glow feature cards)

Cards with a pointer-tracked radial glow (`--mx`/`--my` set by `studio.js`). Grid of `.feat`.

```html
<section class="py-20" data-arch="features">
  <div class="arch-features max-w-6xl mx-auto px-6">
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
      <article class="reveal feat" data-tilt style="--i:1">
        <h3 class="font-semibold text-white text-lg">Title</h3>
        <p class="mt-2 text-sm leading-[1.7] text-[color:var(--ink-soft)]">Body.</p>
      </article>
      <!-- ...more .feat... -->
    </div>
  </div>
</section>
```

Runtime: the glow-track binds automatically to `.arch-features .feat`. Add `data-tilt` for the 3D
pointer tilt; `data-stagger` on the container just documents intent (stagger comes from `--i:n`).

## 3. STATS - `arch-stats` (bento KPI row)

Big tabular numbers, the unit in accent. Pair with `data-count-to` to animate on entry.

```html
<section class="py-20" data-arch="stats">
  <div class="arch-stats max-w-6xl mx-auto px-6 grid gap-5 sm:grid-cols-3">
    <div class="reveal card rounded-2xl p-6" style="--i:1">
      <div class="stat-num"><span data-count-to="1200" data-count-suffix="+">1,200+</span></div>
      <div class="stat-label">Professionals trained</div>
    </div>
  </div>
</section>
```

Runtime: `[data-count-to]` (final value must already be the text). `.stat-num .unit` renders in
accent for an inline unit like `/5` or `%`.

## 4. PRICING - `arch-pricing` (tiers, one elevated "popular")

```html
<section id="pricing" data-arch="pricing">
  <div class="arch-pricing grid gap-6 md:grid-cols-2 max-w-3xl mx-auto items-start">
    <div class="reveal tier card">... self-funded ...</div>
    <div class="reveal tier tier--popular card" data-flag="MOST POPULAR">... claimable ...</div>
  </div>
</section>
```

The `tier--popular` gets an accent border, `--e3` float, and a ribbon from `data-flag`. Copy the full
two-tier block (with feature lists + `.btn-primary`/`.btn-ghost`) from `funnel-template.html`.

## 5. PROOF - `arch-proof` (testimonial cards)

```html
<section class="py-20" data-arch="proof">
  <div class="arch-proof grid gap-5 md:grid-cols-3" data-stagger>
    <figure class="reveal quote" style="--i:1">
      <blockquote>"Real quote."</blockquote>
      <figcaption class="who"><span class="w-9 h-9 rounded-full" style="background:var(--surface-2)"></span>Name, role</figcaption>
    </figure>
  </div>
</section>
```

Real testimonials only - never fabricate. Demo sites use role-only attributions ("Operations lead").

## 6. CTA - `arch-cta` (liquid-glass closing band)

The signature closer: a frosted-glass band with an accent radial wash, `--e3` float.

```html
<section class="py-20" data-arch="cta">
  <div class="arch-cta max-w-5xl mx-auto px-6">
    <div class="reveal glass-band text-center">
      <p class="eyebrow text-[color:var(--accent)] mb-4">Urgency line</p>
      <h2 class="font-display uppercase text-white" style="font-size: var(--fs-h2)">Closing headline</h2>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#pricing" data-magnetic class="btn-primary">Primary</a>
        <a href="..." class="btn-ghost">Ask a question</a>
      </div>
    </div>
  </div>
</section>
```

## 7. SCENE3D - `arch-scene3d` (CSS-3D scroll stage, zero video)

The corporate-site cinematic without rendering footage: a perspective stage whose `[data-depth]`
children translate on Z/Y as you scroll (GSAP scrub). This is how manufacturing/engineering/property
sites "fly" without a Higgsfield pipeline.

```html
<section class="arch-scene3d" data-arch="scene3d">
  <div class="stage">
    <div class="layer" data-depth="0.2"> ...far layer... </div>
    <img data-depth="0.6" data-scrub-scale="0.9" src="..." alt="" />
    <div class="float" data-depth="0.35"> ...mid, gentle idle-float... </div>
  </div>
</section>
```

Runtime: needs GSAP loaded. `[data-depth]` -> translateZ/Y proportional to depth over the section
range; `[data-scrub-rotate]` -> rotate deg; `[data-scrub-scale]` -> scale from value -> 1. `.float`
gets a slow idle bob (off under reduced motion). **QA gotcha:** keep the stage inside a normal-height
section - do not `pin` it in a way that survives `?reveal` / `?preview=1` (see SKILL.md QA loop).

## 8. DASH - `arch-dash` (dashboard chrome)

A FakeBrowser-style frame + KPI tiles for SaaS / dashboard / "living product tour" demos.

```html
<div class="arch-dash">
  <div class="frame">
    <div class="frame-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
    <div class="p-4 grid gap-4 sm:grid-cols-3">
      <div class="kpi"><div class="kpi-val" data-count-to="98" data-count-suffix="%">98%</div>
        <div class="kpi-delta--up text-xs">&#9650; 4.2%</div></div>
    </div>
  </div>
</div>
```

Runtime: `[data-count-to]` for the KPI values; `.kpi-delta--up` (green) / `.kpi-delta--down` (red).

---

## Cross-cutting decorations (not archetypes, used anywhere)

- **`.ng-marquee`** - infinite edge-faded photo/logo band. Duplicate the item set once for a seamless
  `-50%` loop; pauses on hover; freezes under reduced motion.
- **`.ng-countbar`** - fixed urgency strip at top. Add `body.has-countbar` so the header + hero clear
  it. Wire `[data-countdown]` on it (see runtime.md).
- **`.chip` / `.chip-live`** - pill labels; the live variant gets a pulsing green dot.

## A typical page order

- **Funnel:** hero -> features (who it's for) -> agitation band -> features (curriculum) -> trainer
  split -> marquee -> proof -> pricing -> cta -> faq. (This is exactly `funnel-template.html`.)
- **Corporate scroll site:** hero -> scene3d -> stats -> features -> proof -> cta.
- **SaaS:** hero -> dash -> features -> stats -> pricing -> cta -> faq.
