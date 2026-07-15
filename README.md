# premium-web-studio

**A Claude skill for building premium, agency-grade websites by composing from a shared design
system** - dark cinematic tokens, a per-site accent, eight reusable section archetypes, GSAP scroll
recipes, a direct-response funnel template, trilingual i18n, and a live-preview portfolio hub. The
method behind a 20-site AI-built showcase, packaged so you can build your own.

### See it first

**Live showcase:** https://fanacrack-demo-sites.vercel.app

Twenty distinct demo websites - scroll-cinema films, 3D corporate sites, high-converting funnels,
e-commerce, dashboards - that all feel like one studio, because one CSS token file and one runtime
JS drive every page. Hover any card on the hub and the real site starts scrolling live inside it.

---

## What this skill gives you

1. **One design system, many sites.** `studio.css` holds the tokens, the per-site accent map, and
   eight section archetypes; `studio.js` holds the behaviour (reveal, counters, tilt, magnetic,
   glow, CSS-3D scroll scenes, countdown, preview mode). Every site sets ONE `data-accent` and
   composes from the archetypes - so twenty pages stay on-brand without twenty stylesheets.
2. **Three ready templates.** A portfolio **hub** (filter + live-preview cards), a scroll-cinema
   **site** shell, and a 13-section direct-response **funnel** (hook -> agitate -> curriculum ->
   authority -> proof -> stack -> urgency -> FAQ).
3. **A live-preview hub widget.** `preview.js` progressively enhances each collection card from a
   poster to a looping clip to a real, scaled `<iframe>` of the live site on hover - with viewport
   gates and a global concurrency cap so the page stays smooth.
4. **Trilingual out of the box.** Mark copy with `data-i18n`, and `prerender.mjs` bakes static
   `zh/` and `ms/` pages with correct `<html lang>` and hreflang. `i18n.js` wires the switcher.
5. **A build method, not just files.** SKILL.md documents the compose-from-archetypes workflow, the
   accent system, the QA loop (`?reveal` / `?preview=1` contract, both viewports, reduced motion,
   zero console errors), and the parallel-builder delegation pattern (a lead plans + QAs while
   cheaper builders each own one site directory).

Plain HTML - Tailwind (CDN) for utilities, `studio.css` for the system, `studio.js` for behaviour,
GSAP (CDN) only where a page has scroll scenes. No build step. Drops into any static host.

---

## Showcase (categories in the reference build)

| Category | What it is |
| --- | --- |
| Scroll Cinema | Pre-rendered camera flights driven by the scroll wheel (pairs with the `scroll-cinema` skill) |
| Corporate | 3D scroll stages - manufacturing, engineering, property, hospitality |
| Funnels | Trilingual, HRDC-aware, WhatsApp-native offer pages for trainers + coaches |
| E-commerce | Apparel + supplements stores with 3D product moments |
| SaaS | A product-tour landing |
| Dashboards | Business command center + people-ops screens |

All twenty are live on the showcase link above.

---

## What's inside

```
premium-web-studio/
  SKILL.md                     # the skill entry point - read this first
  references/
    design-system.md           # tokens, accent map, elevation, motion, fonts, the anti-generic bar
    archetypes.md              # the 8 section archetypes + markup snippets + runtime hooks
    runtime.md                 # studio.js API: reveal, counters, tilt, magnetic, glow, scene3d, countdown, preview
    preview-widget.md          # hub live-preview: poster -> video -> live iframe ladder + concurrency caps
    i18n.md                    # data-i18n + prerender.mjs + hreflang + the language-switch contract
    funnel-recipe.md           # the direct-response funnel structure, section by section
    hub.md                     # the portfolio hub: filter chips + data-cat + card contract + deep links
  templates/
    studio.css  studio.js  preview.js  i18n.js  prerender.mjs   # copy verbatim
    site-template.html         # scroll-cinema site shell
    funnel-template.html       # 13-section direct-response funnel
    hub-template.html          # portfolio hub (trimmed to 3 TODO cards)
```

The scroll-cinema video engines are intentionally NOT bundled here - they ship in the sibling
[`scroll-cinema`](https://github.com/nextgentrainingacademy88-max/scroll-cinema) repo, which this
system frames.

---

## Install

```bash
# clone straight into your user skills folder
git clone https://github.com/nextgentrainingacademy88-max/premium-web-studio.git \
  ~/.claude/skills/premium-web-studio
```

or clone anywhere and copy the folder into `~/.claude/skills/`. Restart Claude Code and invoke it
with `/premium-web-studio`, or just say "build me a premium studio-style website / funnel / demo
portfolio".

---

## Quick start

1. Make a project dir. Drop `templates/studio.css`, `studio.js`, `preview.js`, `i18n.js`,
   `prerender.mjs` into `shared/`.
2. Build one subsite: copy `funnel-template.html` (or start from the archetype snippets) into
   `my-site/index.html`, set `<body data-accent="...">`, swap the copy + `assets/`.
3. Load order in every page: Tailwind CDN -> `../shared/studio.css` -> (GSAP if scroll scenes) ->
   `../shared/studio.js`.
4. Add the hub: `hub-template.html` at the project root, one card per finished site.
5. QA each page: screenshot desktop + phone, append `?reveal` for full-page shots, toggle reduced
   motion, confirm zero console errors.
6. Ship to any static host (Vercel, Netlify, GitHub Pages).

Full method, the accent system, and the parallel-builder pattern are in `SKILL.md`.

---

## Credits

Built by [Edison Chua](https://nextgentrainingacademy.com) / NextGen Training Academy with Claude.
The design system behind the NextGen Studio showcase. Pairs with the `scroll-cinema` skill for the
scroll-scrubbed video heroes.

If you build something with it, tag it - I would love to see it.

## License

MIT - see [LICENSE](LICENSE). Use it, remix it, ship it.
