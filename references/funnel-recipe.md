# funnel-recipe.md - the direct-response funnel

`templates/funnel-template.html` is a complete 13-section direct-response funnel for an offer, course,
coach, or event. Copy it, find-replace the placeholder copy + the `[Skill]` token, set `data-accent`,
swap `assets/*`, set the countdown date + the `wa.me` number, then bake `zh`/`ms`. It composes the
archetypes ([archetypes.md](archetypes.md)) in the classic hook -> agitate -> map -> authority ->
proof -> stack -> urgency -> FAQ arc.

## The section order (why each is there)

| # | Section | Job | Archetype / element |
| --- | --- | --- | --- |
| 1 | Countdown bar | Scarcity from the first pixel | `.ng-countbar` + `[data-countdown]` |
| 2 | Header | Sticky nav + a persistent "Book a seat" CTA | `.site-head` |
| 3 | **Hero** | Promise + credibility strip (counters) + dual CTA | `arch-hero` |
| 4 | **Who it's for** | Reader self-selects ("that's me") | `arch-features` (4 cards) |
| 5 | **Problem / agitation** | Name the pain the offer removes | plain band on `--surface` |
| 6 | **Curriculum / modules** | Show the transformation is concrete | `arch-features` (6 numbered) |
| 7 | **Trainer bio split** | Authority - a practitioner, not a lecturer | photo + credentials + quote |
| 8 | Photo marquee | Social proof at a glance | `.ng-marquee` |
| 9 | **Proof / testimonials** | Believability | `arch-proof` (3 quotes) |
| 10 | **Pricing** | The stack + the "popular" HRDC tier | `arch-pricing` (2 tiers) |
| 11 | **Final CTA** | Urgency close on the glass band | `arch-cta` |
| 12 | **FAQ** | Kill the last objections | `<details>` accordion |
| 13 | Footer | Language switch + concept-demo disclaimer | - |

Hero credibility numbers use `[data-count-to]` (final value already in the text). The two pricing
tiers are self-funded (`.btn-ghost`) + HRDC-claimable (`.tier--popular` + `.btn-primary`, flagged
"MOST POPULAR").

## The CTA model (no backend)

Every CTA is a `wa.me` deep link with a prefilled message - no form, no server. One number, one
message per intent:

```html
<a href="https://wa.me/60XXXXXXXXXX?text=Hi%2C%20I%27d%20like%20the%20HRDC-claimable%20seat">Book HRDC seat</a>
```

Find-replace the number and URL-encode the message (`%20` spaces, `%27` apostrophe). This keeps a
funnel shippable as pure static HTML.

## Trilingual notes

- All visible copy carries `data-i18n`; write `zh.json` + `ms.json` (site overrides shared) and bake
  with `node shared/prerender.mjs <dir>` (see [i18n.md](i18n.md)).
- Load `Noto Sans SC` in the font `<link>` for the zh page (the template already does).
- The `wa.me` messages are inside the copy too - translate them in the dictionaries so a BM visitor's
  prefilled WhatsApp text is in BM.

## HRDC note (Malaysia context)

HRD Corp is Malaysia's training levy. The "MOST POPULAR" tier is the HRDC-claimable one (typically a
small premium over self-funded, e.g. RM888 vs RM788) because companies reclaim it - lead with it. The
funnel promises claim-paperwork support. HRDC covers TRAINING, not software builds - keep the offer a
training/workshop, and never fabricate accreditation the client does not hold.

## GSAP is optional here

A funnel has no scroll scenes, so GSAP is optional - but loading it upgrades the reveal to the
refresh-proof GSAP path (worth it). Safe to drop the two GSAP `<script>` tags for a lighter page;
`studio.js` falls back to the IntersectionObserver reveal.

## Real-content rule

Real trainer photos, real testimonials, real numbers. Placeholders (`https://placehold.co/`) only for
imagery not yet produced. A demo funnel must be clearly labeled an AI-generated concept in the footer.
