# Smooth scroll + scroll-linked motion

**Date:** 2026-08-19
**Status:** Approved, ready for implementation plan

## Goal

Give monoolithus.com momentum scrolling and a scroll-linked motion layer across
every route, in a register that matches the site's brutalist-editorial voice
(hard rules, mono microlabels, zero border radius, amber on near-black).

Motion you feel but don't notice. Nothing that reads as a template.

## Guiding principle

**Zero scroll event listeners in the entire application.**

Every `scroll`/`wheel` handler is a main-thread tax that produces exactly the
jank this work exists to remove. The only per-frame JavaScript during scroll is
Lenis's single `requestAnimationFrame` loop. Continuous scroll-linked motion
runs on native CSS scroll timelines, off the main thread, where it structurally
cannot jank.

## Architecture

Three independent layers. Each can be built, reviewed and reverted alone.

### Layer 1 — Momentum scroll

**New:** `components/smooth-scroll.tsx` (client component)

Wraps `{children}` in `app/layout.tsx`. Owns one Lenis instance and one rAF loop.

Configuration:

| Option | Value | Reason |
| --- | --- | --- |
| `duration` | `1.1` | Long enough to glide, short enough to stay responsive |
| `easing` | expo-out | Fast start, long settle — reads as weight, not lag |
| `wheelMultiplier` | `1` | Never change how far a wheel tick travels |
| `syncTouch` | `false` | Touch keeps native iOS/Android momentum |

`syncTouch: false` is deliberate and load-bearing. Hijacking touch scrolling is
the single thing that makes "smooth scroll" sites feel broken on phones.

Behaviour:

- Under `prefers-reduced-motion: reduce`, Lenis is never constructed. Native
  scrolling, no rAF loop, no listeners.
- On route change (`usePathname` effect), `lenis.scrollTo(0, { immediate: true })`.
  Next's App Router scroll restoration does not know Lenis exists.
- The instance is published through a React context with a `useLenis()` hook,
  so `SiteNav` can call `stop()` / `start()`. The hook returns `null` when
  Lenis was never constructed (reduced motion), and every caller must handle
  that — under reduced motion the nav falls back to the current
  `body.style.overflow` lock.

**Two required changes elsewhere, both fixing bugs this would otherwise create:**

1. `app/globals.css` — remove the `scroll-behavior: smooth` rule. It fights
   Lenis and stutters every anchor jump. The reduced-motion block's
   `scroll-behavior: auto !important` stays.
2. `components/site-nav.tsx` — the mobile menu locks the background with
   `document.body.style.overflow = "hidden"`. Lenis ignores `overflow: hidden`
   on body, so the page would scroll behind the open panel. Must become
   `lenis.stop()` on open and `lenis.start()` on close.

### Layer 2 — Discrete reveals

**New:** `lib/reveal-observer.ts`
**Rework:** `components/reveal.tsx`

One module-level `IntersectionObserver` shared by the whole site, with a
subscribe/unsubscribe API keyed on the element. Replaces the current
per-instance observer created inside `Reveal`'s `useEffect` — roughly 25
observers across the site today, and after this pass it would have been closer
to 45 as lists are broken up per item.

Threshold and rootMargin stay as they are (`0.15`, `0px 0px -8% 0px`). Reveals
remain one-shot: once shown, the element unsubscribes and never animates again.

`Reveal` gains a `variant` prop:

| Variant | Motion | Used for |
| --- | --- | --- |
| `rise` (default) | Opacity 0 to 1, `translateY` 16px to 0 | Body copy, cards, list rows |
| `mask` | `clip-path` inset opening from the baseline plus 24px rise | Serif headlines |
| `rule` | `scaleX` 0 to 1, `transform-origin: left` | Hairlines |

| `quiet` | Opacity only, no transform | Legal copy on /terms |

The existing `delay` prop is kept for stagger. A `distance` prop (default
`16`, in px) tunes the `rise` travel — the hero microlabels use `8`. It has no
effect on `rule` or `quiet`, and `mask` is fixed at 24px.

**Bug fixed while in here:** `components/reveal.tsx` currently sets
`will-change: opacity, transform` unconditionally, pinning a compositor layer
for every revealed block for the lifetime of the page. It must be dropped once
the reveal transition completes.

### Layer 3 — Continuous parallax

**New:** `components/parallax.tsx` plus a CSS block in `app/globals.css`

Native CSS scroll-driven animation via `animation-timeline: view()`. Because
Lenis drives the real document scroll position (it is not in wrapper mode),
native scroll timelines stay exactly in sync with the smoothed scroll.

Guarded twice:

```
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) { ... }
}
```

Where unsupported, the affected elements are simply static. There is no
JavaScript fallback and no scroll listener — a browser without scroll timelines
gets a site with no parallax, which is a complete and correct experience.

### A note on the `rule` variant

A `scaleX` transform cannot animate a `border-b` on an existing element without
transforming that element's contents too. So `rule` does not target existing
`border-*` utilities. Wherever a hairline should draw, the `border-rule`
utility is replaced by a dedicated 1px child element that the variant scales:

```
<div className="relative">            {/* was: border-b border-rule */}
  <Reveal variant="rule" className="absolute inset-x-0 bottom-0 h-px bg-rule" />
  ...
</div>
```

This is a real markup change at each site, not a drop-in wrapper. The affected
places are: the `<section>` dividers on `/` and `/services`, the per-row
dividers on `/process`, and the footer's top hairline. `FieldBand`'s own
`border-b` stays a plain border — it sits under a parallaxing canvas and drawing
it would read as noise.

## Motion inventory

### Global, every route

- **Page scroll** — Lenis, 1.1s expo-out, native momentum on touch.
- **`FieldBand` shader canvas** — drifts approximately 48px against the page
  across its view range, so the amber field lags the content it sits behind.
- **Section hairlines** — draw left to right on entry, 700ms, via
  `Reveal variant="rule"`.

### `/` (home)

- Microlabel row (`Software House` / `São José dos Campos · BR` /
  `Desenvolvimento web sob medida`) — fade plus 8px rise, staggered 60ms per
  item. Currently one undifferentiated block.
- `O monolito não se quebra.` — `mask` variant, 900ms. The signature moment of
  the site.
- Lead paragraph at +120ms, CTA pair at +200ms.
- `FIG. 01` figure — counter-parallax, rising roughly 24px slower than the page
  so the slab reads as physically pinned behind the frame. Its four corner
  microlabels fade in staggered.
- Manifesto blockquote — `mask` variant at 1100ms. It is the régua; it earns the
  extra weight.

### `/services`

Break the single `Reveal` wrapping the 4-card grid into per-card reveals.
Stagger 90ms, 16px rise.

### `/process`

Break the single `Reveal` wrapping the 4 step rows into per-row reveals.
Stagger 90ms. Each row's `border-b` draws left to right in sync with its own
row — rows literally ruling themselves.

### `/contact`

Heading `mask` wipe, then paragraph and the two CTAs staggered. The field band
here is already `intensity={1.3}` and `border-b-0`, so parallax runs slightly
stronger.

### `/terms`

Quietest tier only. Each `<section>` uses `variant="quiet"` at 500ms: opacity
only, no translate, no stagger. This is legal copy and motion must never delay
a clause someone is scanning for. Currently the page has no reveals at all.

### Footer

Top hairline draws. Columns fade in at 80ms stagger. Currently no reveals.

## Motion tokens

Defined once in `app/globals.css` under `:root`, consumed by every layer.

```
--ease-editorial: cubic-bezier(0.16, 1, 0.3, 1);
--dur-reveal: 900ms;
--dur-rule:   700ms;
--dur-quiet:  500ms;
```

## Constraints

These are the rules that keep the pass from drifting into template territory.

1. Nothing translates more than **24px**, anywhere on the site.
2. No stagger chain longer than **4 steps** (about 360ms). Nothing may ever feel
   like it is making the reader wait.
3. One shared easing curve. No per-component easing.
4. No scroll hijacking on touch.
5. No scroll progress bar, no pinned sections, no scale-on-scroll. These were
   considered and rejected as fighting the brutalist grid.

## Accessibility

- `prefers-reduced-motion: reduce` disables Lenis entirely, disables all
  parallax, and collapses reveals to their final state. The existing global
  kill-switch in `app/globals.css` already neutralises transition durations;
  `Reveal` additionally short-circuits to `shown` so content is never hidden.
- Reveals must never gate content behind JavaScript. The `motion-reduce:`
  utilities guaranteeing pre-hydration visibility are preserved.
- Keyboard scrolling and focus-driven scrolling continue to work; Lenis handles
  both, and anchor navigation is routed through it.

## Verification

1. `pnpm build` and `pnpm lint` clean.
2. `grep -rn "addEventListener(\"scroll\"\|addEventListener(\"wheel\"\|onScroll" app components lib`
   returns nothing outside the Lenis provider.
3. the-viewer skill across mobile, tablet and desktop viewports on all five
   routes: no console errors, no horizontal overflow, all CTAs reachable.
4. Reduced-motion pass: emulate `prefers-reduced-motion: reduce` and confirm
   every route renders fully with no animation and native scrolling.
5. Mobile menu opens with the background locked (the Lenis `stop()` path).
6. Route transitions land at the top of the new page.

## Out of scope

- Page transition animations between routes.
- Any change to the WebGL shader itself in `lib/shaders.ts`.
- Copy, layout, or colour changes of any kind.
