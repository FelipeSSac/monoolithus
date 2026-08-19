# Smooth Scroll + Scroll-Linked Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Lenis momentum scrolling and a restrained scroll-linked motion layer across all five routes of the monoolithus.com marketing site.

**Architecture:** Three independent layers. (1) A Lenis provider in the root layout owning one rAF loop, published via React context. (2) A reveal system built on a single app-wide `IntersectionObserver` with four CSS-driven variants. (3) Continuous parallax using native CSS scroll timelines (`animation-timeline: view()`), which run off the main thread. The invariant tying it together: **zero `scroll`/`wheel` event listeners anywhere in the app.**

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.7 strict, Tailwind CSS v4, `lenis` v1.

**Spec:** `docs/superpowers/specs/2026-08-19-smooth-scroll-motion-design.md`

## Testing Strategy — read this before Task 1

This repository has **no test framework**: `package.json` has no `test` script and
no vitest/jest/playwright dependency. Do **not** add one as part of this plan.

Every task therefore verifies with these commands, which are real and produce
real evidence:

| Command | Checks |
| --- | --- |
| `pnpm exec tsc --noEmit` | Types across the whole project |
| `pnpm lint` | ESLint, including react-hooks rules |
| `rg` assertions given per task | The specific invariant that task establishes |

`pnpm build` runs once, in Task 10. Visual and reduced-motion verification also
happens in Task 10, via the `the-viewer` skill.

If a task's `rg` assertion produces output when the task says it should produce
none, the task is not done. Do not proceed.

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **Zero scroll event listeners in the entire application.** The only per-frame
  JavaScript during scroll is Lenis's single `requestAnimationFrame` loop.
- Nothing translates more than **24px**, anywhere on the site.
- No stagger chain longer than **4 steps** (about 360ms).
- One shared easing curve, `--ease-editorial: cubic-bezier(0.16, 1, 0.3, 1)`.
  No per-component easing.
- No scroll hijacking on touch (`syncTouch: false`).
- No scroll progress bar, no pinned sections, no scale-on-scroll.
- `prefers-reduced-motion: reduce` disables Lenis entirely, disables all
  parallax, and collapses reveals to their final state.
- Reveals must never gate content behind JavaScript.
- Do not change copy, layout, colours, or `lib/shaders.ts`.
- The site is in pt-BR. Any new user-visible string must be pt-BR. (This plan
  adds none.)

## File Structure

**Create:**

| File | Responsibility |
| --- | --- |
| `lib/reveal-observer.ts` | The single app-wide IntersectionObserver. Subscribe/unsubscribe only. No React. |
| `components/smooth-scroll.tsx` | Lenis lifecycle, rAF loop, React context, `useLenis()` hook. Client. |
| `components/parallax.tsx` | Marks a subtree as parallaxing and sets its `--parallax` distance. Server-renderable, no JS. |

**Modify:**

| File | Change |
| --- | --- |
| `app/globals.css` | Motion tokens, Lenis base CSS, reveal variant CSS, parallax `@supports` block, remove `scroll-behavior: smooth` |
| `app/layout.tsx` | Wrap children in `SmoothScroll`, add `<noscript>` reveal override |
| `components/reveal.tsx` | Shared observer, four variants, `distance` prop, `will-change` fix |
| `components/site-nav.tsx` | `lenis.stop()`/`start()` instead of `body.style.overflow` |
| `components/field-band.tsx` | Wrap the shader canvas in `Parallax` |
| `components/site-footer.tsx` | Drawing top hairline, staggered columns |
| `app/page.tsx` | Hero + manifesto motion |
| `app/services/page.tsx` | Per-card stagger |
| `app/process/page.tsx` | Per-row stagger, per-row drawing rules |
| `app/contact/page.tsx` | Heading mask, staggered CTAs |
| `app/terms/page.tsx` | Quiet reveals |

---

### Task 1: Motion tokens and CSS foundation

Establishes every custom property and class the later tasks consume. Nothing
visibly changes yet except that native smooth scrolling stops.

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--ease-editorial`, `--dur-reveal`,
  `--dur-rule`, `--dur-quiet`. Attribute hooks `[data-reveal="rise"|"mask"|"rule"|"quiet"]`,
  `[data-shown="true"]`, `[data-parallax]`. Custom property `--reveal-distance`
  (consumed by `rise`) and `--parallax` (consumed by `[data-parallax]`).

- [ ] **Step 1: Add motion tokens to `:root`**

In `app/globals.css`, inside the existing `:root { ... }` block, directly after
the `--rule:` line, add:

```css
  /* Motion — one easing curve and three durations for the whole site. */
  --ease-editorial: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-reveal: 900ms;
  --dur-rule: 700ms;
  --dur-quiet: 500ms;
```

- [ ] **Step 2: Remove the native smooth-scroll rule**

Delete this entire block from `app/globals.css`:

```css
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

It fights Lenis and stutters every anchor jump. The `scroll-behavior: auto !important`
inside the `prefers-reduced-motion: reduce` block stays exactly as it is.

- [ ] **Step 3: Add Lenis base CSS**

Append to `app/globals.css`. These are the rules Lenis's own stylesheet ships;
inlining them avoids a package-path import.

```css
/* Lenis base rules. Inlined rather than importing `lenis/dist/lenis.css`. */
html.lenis,
html.lenis body {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}
.lenis.lenis-stopped {
  overflow: hidden;
}
.lenis.lenis-smooth iframe {
  pointer-events: none;
}
```

- [ ] **Step 4: Add the reveal variant CSS**

Append to `app/globals.css`.

`mask` uses negative side and bottom insets so the clip never shaves an italic
overhang or a descender — the Fraunces italic headlines need this.

```css
/* Reveal variants. The `data-reveal` attribute selects the hidden state; the
   component flips `data-shown` once the element has entered the viewport. */
[data-reveal] {
  transition-property: opacity, transform, clip-path;
  transition-timing-function: var(--ease-editorial);
}
[data-reveal='rise'] {
  opacity: 0;
  transform: translate3d(0, var(--reveal-distance, 16px), 0);
  transition-duration: var(--dur-reveal);
}
[data-reveal='mask'] {
  opacity: 0;
  transform: translate3d(0, 24px, 0);
  clip-path: inset(100% -0.1em -0.25em -0.1em);
  transition-duration: var(--dur-reveal);
}
[data-reveal='rule'] {
  transform: scaleX(0);
  transform-origin: left center;
  transition-duration: var(--dur-rule);
}
[data-reveal='quiet'] {
  opacity: 0;
  transition-duration: var(--dur-quiet);
}
[data-reveal][data-shown='true'] {
  opacity: 1;
  transform: none;
  clip-path: inset(-0.2em -0.1em -0.25em -0.1em);
}
```

Content must never be gated behind JavaScript. That is handled by a `<noscript>`
override added to the root layout in Task 4, not here — a `<noscript>` block
cannot live in a stylesheet.

- [ ] **Step 5: Add the parallax block**

Append to `app/globals.css`. Double-guarded: reduced motion outside, feature
support inside. A browser without scroll timelines renders these elements
static, which is a complete experience.

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    @keyframes parallax-drift {
      from {
        transform: translate3d(0, calc(var(--parallax, 24px) * -1), 0);
      }
      to {
        transform: translate3d(0, var(--parallax, 24px), 0);
      }
    }
    [data-parallax] {
      animation: parallax-drift linear both;
      animation-timeline: view();
      animation-range: cover 0% cover 100%;
      will-change: transform;
    }
  }
}
```

- [ ] **Step 6: Verify the CSS compiles and the old rule is gone**

Run:

```bash
pnpm exec tsc --noEmit && pnpm lint
rg -n "scroll-behavior: smooth" app/ components/ lib/
rg -c "ease-editorial|data-reveal|data-parallax|lenis-stopped" app/globals.css
```

Expected: tsc and lint pass. The first `rg` prints **nothing** (exit 1). The
second prints a count of at least 12.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "feat(motion): add motion tokens, reveal variants and parallax CSS"
```

---

### Task 2: Shared reveal observer

**Files:**
- Create: `lib/reveal-observer.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `observeOnce(el: Element, onEnter: () => void): () => void` — registers
  `el` with the shared observer, calls `onEnter` the first time it intersects,
  then stops observing it. Returns an unsubscribe function that is safe to call
  after `onEnter` already fired.

- [ ] **Step 1: Write the module**

Create `lib/reveal-observer.ts`:

```ts
type OnEnter = () => void

/**
 * One IntersectionObserver for the whole site. `Reveal` used to create one per
 * instance, which meant ~25 observers today and would mean ~45 once lists are
 * broken up per item. Thresholds match the previous per-instance config so the
 * reveal timing is unchanged.
 */
let observer: IntersectionObserver | null = null
const callbacks = new Map<Element, OnEnter>()

function getObserver(): IntersectionObserver {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const onEnter = callbacks.get(entry.target)
        // Unsubscribe before invoking: reveals are one-shot.
        observer?.unobserve(entry.target)
        callbacks.delete(entry.target)
        onEnter?.()
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  )
  return observer
}

/** Calls `onEnter` once, the first time `el` scrolls into view. */
export function observeOnce(el: Element, onEnter: OnEnter): () => void {
  const io = getObserver()
  callbacks.set(el, onEnter)
  io.observe(el)
  return () => {
    io.unobserve(el)
    callbacks.delete(el)
  }
}
```

- [ ] **Step 2: Verify types and lint**

Run:

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass with no output about `lib/reveal-observer.ts`.

- [ ] **Step 3: Verify the invariant — no scroll listeners introduced**

Run:

```bash
rg -n "addEventListener\(['\"](scroll|wheel)" lib/
```

Expected: **nothing**.

- [ ] **Step 4: Commit**

```bash
git add lib/reveal-observer.ts
git commit -m "feat(motion): add shared reveal IntersectionObserver"
```

---

### Task 3: Rework the Reveal component

**Files:**
- Modify: `components/reveal.tsx` (full rewrite)

**Interfaces:**
- Consumes: `observeOnce` from `lib/reveal-observer.ts`. The CSS attribute hooks
  from Task 1.
- Produces: `Reveal` with props
  `{ children?: ReactNode; className?: string; delay?: number; variant?: "rise" | "mask" | "rule" | "quiet"; distance?: number }`.
  `children` is **optional** — the `rule` variant renders an empty hairline
  element. `distance` defaults to `16` and only affects `rise`.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `components/reveal.tsx` with exactly this:

```tsx
"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"
import { observeOnce } from "@/lib/reveal-observer"

type RevealVariant = "rise" | "mask" | "rule" | "quiet"

type RevealProps = {
  /** Optional: the `rule` variant renders an empty hairline. */
  children?: ReactNode
  className?: string
  /** Stagger in ms, applied as transition-delay once revealed. */
  delay?: number
  variant?: RevealVariant
  /** Travel distance in px for the `rise` variant. Ignored by other variants. */
  distance?: number
}

/**
 * Reveals its children the first time they scroll into view, using the shared
 * observer in `lib/reveal-observer`. The hidden and shown states live in CSS
 * (`[data-reveal]` / `[data-shown]`) so every variant shares one easing token.
 *
 * Honours `prefers-reduced-motion` two ways: the effect short-circuits to
 * visible, and the global reduce block in `globals.css` neutralises durations.
 * A `<noscript>` override in the root layout guarantees visibility without JS.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
  distance = 16,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)
  // `settled` exists only so `will-change` can be dropped once the transition
  // finishes. Leaving it on pins a compositor layer for the life of the page.
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      setSettled(true)
      return
    }
    return observeOnce(el, () => setShown(true))
  }, [])

  const style: CSSProperties = {
    ...(delay ? { transitionDelay: `${delay}ms` } : null),
    ...(variant === "rise"
      ? ({ "--reveal-distance": `${distance}px` } as CSSProperties)
      : null),
    ...(settled ? null : { willChange: "opacity, transform" }),
  }

  return (
    <div
      ref={ref}
      data-reveal={variant}
      data-shown={shown ? "true" : undefined}
      onTransitionEnd={() => setSettled(true)}
      style={style}
      className={cn(className)}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 3: Verify no existing consumer broke**

Every existing call site passes only `className` and `delay`, both still
supported with the same meaning, and the defaults (`rise`, 16px) reproduce the
old behaviour.

```bash
rg -n "<Reveal" app/ components/
pnpm exec tsc --noEmit
```

Expected: tsc passes with no errors at any `<Reveal` call site.

- [ ] **Step 4: Commit**

```bash
git add components/reveal.tsx
git commit -m "refactor(motion): Reveal variants, shared observer, will-change fix"
```

---

### Task 4: Lenis provider

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (via install)
- Create: `components/smooth-scroll.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SmoothScroll({ children }: { children: ReactNode })` and
  `useLenis(): Lenis | null`. **`useLenis()` returns `null` when Lenis was never
  constructed** — under `prefers-reduced-motion: reduce`, and on the server, and
  on the first client render before the effect runs. Every caller must handle
  `null`.

- [ ] **Step 1: Install Lenis**

```bash
pnpm add lenis
```

- [ ] **Step 2: Write the provider**

Create `components/smooth-scroll.tsx`:

```tsx
"use client"

import Lenis from "lenis"
import { usePathname } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

const LenisContext = createContext<Lenis | null>(null)

/**
 * The live Lenis instance, or `null` when momentum scrolling is not running —
 * on the server, on the first client render, and permanently under
 * `prefers-reduced-motion: reduce`. Callers must handle `null`.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}

/**
 * Owns the single Lenis instance and the single rAF loop that drives it. This
 * is the only per-frame JavaScript that runs during scroll anywhere in the app;
 * everything else is either a one-shot IntersectionObserver or a native CSS
 * scroll timeline.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const pathname = usePathname()
  const firstRoute = useRef(true)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const instance = new Lenis({
      duration: 1.1,
      // Expo-out: fast start, long settle. Reads as weight, not lag.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      // Touch keeps native momentum. Hijacking it is what makes smooth-scroll
      // sites feel broken on phones.
      syncTouch: false,
    })
    setLenis(instance)

    let frame = requestAnimationFrame(function loop(time: number) {
      instance.raf(time)
      frame = requestAnimationFrame(loop)
    })

    return () => {
      cancelAnimationFrame(frame)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  // App Router's scroll restoration does not know Lenis exists. Skip the first
  // run so deep links and anchors still land where they should.
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
```

- [ ] **Step 3: Wire it into the root layout**

In `app/layout.tsx`, add the import next to the other component imports:

```tsx
import { SmoothScroll } from '@/components/smooth-scroll'
```

Then replace the `<body>` contents. The `<noscript>` block is what keeps
revealed content from being gated behind JavaScript.

```tsx
      <body className="font-sans antialiased">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
        <SmoothScroll>{children}</SmoothScroll>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
```

- [ ] **Step 4: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 5: Verify the zero-listeners invariant still holds**

```bash
rg -n "addEventListener\(['\"](scroll|wheel)|onScroll" app/ components/ lib/
```

Expected: **nothing**. Lenis attaches its own listeners internally; that is the
one permitted place and it lives in `node_modules`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml components/smooth-scroll.tsx app/layout.tsx
git commit -m "feat(motion): add Lenis momentum scrolling provider"
```

---

### Task 5: Fix the mobile menu scroll lock

`SiteNav` locks the background with `document.body.style.overflow = "hidden"`.
Lenis ignores that, so after Task 4 the page scrolls behind the open panel.

**Files:**
- Modify: `components/site-nav.tsx:26-37`

**Interfaces:**
- Consumes: `useLenis` from `components/smooth-scroll.tsx`.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Import the hook**

In `components/site-nav.tsx`, add next to the existing imports:

```tsx
import { useLenis } from "@/components/smooth-scroll"
```

- [ ] **Step 2: Read the instance in the component body**

Directly after the `const pathname = usePathname()` line, add:

```tsx
  const lenis = useLenis()
```

- [ ] **Step 3: Replace the lock effect**

Replace this existing effect:

```tsx
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])
```

with:

```tsx
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    // Lenis ignores `overflow: hidden` on body, so it has to be stopped
    // directly. Under reduced motion there is no instance and the plain
    // overflow lock is still correct.
    if (lenis) lenis.stop()
    else document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      if (lenis) lenis.start()
      else document.body.style.overflow = ""
    }
  }, [open, lenis])
```

- [ ] **Step 4: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass. `pnpm lint` runs `react-hooks/exhaustive-deps`; `lenis` is
in the dependency array, so it must not warn.

- [ ] **Step 5: Verify the old lock is gone from the open path**

```bash
rg -n "body.style.overflow" components/site-nav.tsx
```

Expected: exactly two hits, both inside the `else` branches added above.

- [ ] **Step 6: Commit**

```bash
git add components/site-nav.tsx
git commit -m "fix(nav): stop Lenis instead of body overflow when menu is open"
```

---

### Task 6: Parallax component and field band wiring

**Files:**
- Create: `components/parallax.tsx`
- Modify: `components/field-band.tsx`

**Interfaces:**
- Consumes: the `[data-parallax]` / `--parallax` CSS from Task 1.
- Produces: `Parallax({ children, className, distance }: { children: ReactNode; className?: string; distance?: number })`.
  `distance` defaults to `24` and is in px; the element travels from `-distance`
  to `+distance` across its view range, so total drift is `2 × distance`. A
  **negative** `distance` inverts the direction, producing counter-parallax.
  This component ships no JavaScript — it is a plain element with an attribute.

- [ ] **Step 1: Write the component**

Create `components/parallax.tsx`:

```tsx
import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

type ParallaxProps = {
  children: ReactNode
  className?: string
  /**
   * Travel in px in each direction across the element's view range, so total
   * drift is twice this. Negative values invert the direction (counter-parallax).
   */
  distance?: number
}

/**
 * Drifts its children against the page scroll using a native CSS scroll
 * timeline (`animation-timeline: view()`), which runs off the main thread and
 * therefore cannot jank. Deliberately ships no JavaScript and registers no
 * listeners.
 *
 * Where scroll timelines or motion are unavailable the children render static —
 * see the double-guarded `@supports` block in `app/globals.css`.
 */
export function Parallax({ children, className, distance = 24 }: ParallaxProps) {
  return (
    <div
      data-parallax=""
      style={{ "--parallax": `${distance}px` } as CSSProperties}
      className={cn(className)}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Wire it into `FieldBand`**

In `components/field-band.tsx`, add the import:

```tsx
import { Parallax } from "@/components/parallax"
```

Then replace this block:

```tsx
      <div className="pointer-events-none absolute inset-0">
        <ShaderCanvas
          fragmentSource={MONOLITH_FRAG}
          intensity={intensity}
          ariaLabel="Campo de filamentos âmbar em movimento sobre fundo escuro"
        />
      </div>
```

with:

```tsx
      {/* Inset vertically so the drifting canvas never exposes a bare edge. */}
      <Parallax
        distance={24}
        className="pointer-events-none absolute -inset-y-8 inset-x-0"
      >
        <ShaderCanvas
          fragmentSource={MONOLITH_FRAG}
          intensity={intensity}
          ariaLabel="Campo de filamentos âmbar em movimento sobre fundo escuro"
        />
      </Parallax>
```

The `-inset-y-8` (32px bleed top and bottom) covers the ±24px of travel with
margin to spare. Without it the band would show a hard edge at the extremes.

Leave `FieldBand`'s own `border-b border-rule` on the outer wrapper exactly as
it is. Per the spec it stays a plain border — it sits under a parallaxing
canvas and drawing it would read as noise.

- [ ] **Step 3: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 4: Verify Parallax stays a server component**

```bash
rg -n "use client" components/parallax.tsx
```

Expected: **nothing**. If this prints a line, the component is needlessly in the
client bundle — remove the directive.

- [ ] **Step 5: Commit**

```bash
git add components/parallax.tsx components/field-band.tsx
git commit -m "feat(motion): parallax via CSS scroll timelines, applied to FieldBand"
```

---

### Task 7: Home page motion

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Reveal` variants and `distance` (Task 3), `Parallax` (Task 6).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Add the Parallax import**

In `app/page.tsx`, add next to the existing component imports:

```tsx
import { Parallax } from "@/components/parallax"
```

- [ ] **Step 2: Stagger the microlabel row**

Replace:

```tsx
          <Reveal className="mb-12">
            <div className="flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <span>Software House</span>
              <span>São José dos Campos · BR</span>
              <span className="text-primary">Desenvolvimento web sob medida</span>
            </div>
          </Reveal>
```

with:

```tsx
          <div className="mb-12 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <Reveal distance={8}>
              <span>Software House</span>
            </Reveal>
            <Reveal distance={8} delay={60}>
              <span>São José dos Campos · BR</span>
            </Reveal>
            <Reveal distance={8} delay={120}>
              <span className="text-primary">Desenvolvimento web sob medida</span>
            </Reveal>
          </div>
```

- [ ] **Step 3: Split the hero column into masked headline and staggered body**

Replace the whole `<Reveal delay={80}>` block (the one containing the `<h1>`)
with the following. The single wrapper becomes four reveals so the headline can
use `mask` while the rest rise behind it.

```tsx
            <div>
              <Reveal variant="mask">
                <h1 className="text-balance font-serif text-6xl font-light leading-[0.92] tracking-tight text-primary sm:text-7xl lg:text-8xl">
                  O monolito não se <em className="italic">quebra</em>.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-9 max-w-md text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                  Software também não deveria. Sistemas que não quebram, pensados
                  para durar — sem caixa-preta, sem surpresa.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98]"
                  >
                    Começar um projeto
                  </a>
                  <Link
                    href="/services"
                    className="border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-[transform,color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground active:translate-y-0 active:scale-[0.98]"
                  >
                    O que fazemos
                  </Link>
                </div>
              </Reveal>
            </div>
```

- [ ] **Step 4: Counter-parallax the FIG. 01 figure and stagger its corner labels**

Replace the `<Reveal delay={160} className="flex items-center justify-center">`
block with:

```tsx
            <Reveal delay={160} className="flex items-center justify-center">
              <Parallax distance={-12} className="w-full">
                <div className="group relative grid aspect-square w-full place-items-center border border-rule transition-colors duration-500 hover:border-primary/40">
                  <Reveal variant="quiet" delay={280}>
                    <span className="absolute left-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      FIG. 01
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={340}>
                    <span className="absolute right-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      SLAB · 4:9
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={400}>
                    <span className="absolute bottom-3.5 left-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      #FFB23F
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={460}>
                    <span className="absolute bottom-3.5 right-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      v1.1 · ÂMBAR
                    </span>
                  </Reveal>
                  <Slab className="w-[14.8%] transition-transform duration-500 ease-out group-hover:scale-110" width={undefined} />
                </div>
              </Parallax>
            </Reveal>
```

Note the corner labels keep their `absolute` positioning classes, but they are
now inside a `Reveal` wrapper div. The wrapper is a static block inside a
`relative` parent, so the absolutely-positioned `<span>` still resolves against
the bordered square. Verify this visually in Task 10 — if any label drifts,
move the `absolute left-3.5 top-3.5` classes onto the `Reveal` via its
`className` prop and drop them from the `<span>`.

- [ ] **Step 5: Mask the manifesto and draw its section rule**

Replace the entire MANIFESTO `<section>` with:

```tsx
      {/* MANIFESTO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center lg:px-16">
          <Reveal variant="quiet">
            <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              A régua
            </div>
          </Reveal>
          <Reveal variant="mask" delay={200}>
            <blockquote className="mx-auto max-w-3xl text-balance font-serif text-3xl font-light italic leading-tight tracking-tight text-primary sm:text-5xl">
              {'"Onde o mercado entrega genérico e descartável, entregamos disciplina aplicada à engenharia."'}
            </blockquote>
          </Reveal>
        </div>
        <Reveal
          variant="rule"
          className="absolute inset-x-0 bottom-0 h-px bg-rule"
        />
      </section>
```

The `border-b border-rule` became `relative` plus a `rule` Reveal, because
`scaleX` cannot animate a border without transforming the section's contents.

The spec asks for the blockquote to land at roughly 1100ms. That is reached as
`--dur-reveal` (900ms) plus the 200ms delay below — change the `delay={120}`
above to `delay={200}` on the blockquote `Reveal`. Do **not** introduce a
per-component duration or easing; the global constraint forbids it.

- [ ] **Step 6: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 7: Verify the stagger-chain constraint**

The longest chain on this page is the four corner labels at 280/340/400/460ms.
That is 4 steps of 60ms after a 280ms lead-in. Confirm no delay exceeds 460:

```bash
rg -n "delay=\{[0-9]+\}" app/page.tsx
```

Expected: values are 60, 120, 160, 200, 200, 280, 340, 400, 460 — none higher.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "feat(motion): hero mask, staggered labels and counter-parallax on home"
```

---

### Task 8: Services and Process list stagger

Both pages currently wrap their entire 4-item list in a single `Reveal`, so all
four items appear at once. This is the highest-value fix in the pass.

**Files:**
- Modify: `app/services/page.tsx:68-93`
- Modify: `app/process/page.tsx:69-91`

**Interfaces:**
- Consumes: `Reveal` variants (Task 3).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Stagger the services grid and draw its section rule**

In `app/services/page.tsx`, replace the whole catalogue `<section>` — from
`<section className="border-b border-rule bg-background">` through its closing
`</section>` — with:

```tsx
      {/* Faixa sólida: catálogo de serviços */}
      <section className="relative bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-16">
          <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
            {servicos.map((item, i) => (
              <Reveal key={item.n} delay={i * 90} className="bg-background">
                <div className="group h-full bg-background p-8 transition-colors duration-300 hover:bg-secondary hover:shadow-[inset_2px_0_0_0_var(--primary)]">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                    {item.n}
                  </div>
                  <h2 className="mt-4 font-serif text-2xl font-light tracking-tight text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal
          variant="rule"
          className="absolute inset-x-0 bottom-0 h-px bg-rule"
        />
      </section>
```

Three details that matter:
- The `Reveal` wrapper needs `bg-background`, or the grid's `gap-px bg-rule`
  hairlines bleed through while a card is still transparent.
- The inner card gains `h-full` so it still fills its grid cell now that a
  wrapper element sits between them.
- `border-b border-rule` on the section became `relative` plus a `rule` Reveal,
  because `scaleX` cannot animate a border without transforming the section's
  contents.

- [ ] **Step 2: Stagger the process rows, each with its own drawing rule**

In `app/process/page.tsx`, replace the whole steps `<section>` — from
`<section className="border-b border-rule bg-background">` through its closing
`</section>` — with:

```tsx
      {/* Faixa sólida: etapas do processo */}
      <section className="relative bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-16">
          <div className="border-t border-rule">
            {processo.map((item, i) => (
              <Reveal key={item.n} delay={i * 90}>
                <div className="group relative grid gap-4 py-7 transition-colors duration-300 hover:bg-secondary/50 md:grid-cols-[80px_220px_1fr] md:gap-10 md:items-baseline">
                  <div className="font-serif text-2xl font-light text-primary transition-transform duration-300 ease-out group-hover:translate-x-1">
                    {item.n}
                  </div>
                  <div className="font-serif text-2xl font-light tracking-tight text-primary">
                    {item.title}
                  </div>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                  <Reveal
                    variant="rule"
                    delay={i * 90 + 120}
                    className="absolute inset-x-0 bottom-0 h-px bg-rule"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal
          variant="rule"
          className="absolute inset-x-0 bottom-0 h-px bg-rule"
        />
      </section>
```

The row's `border-b border-rule` was removed precisely so the nested `rule`
Reveal owns that hairline and can draw it left-to-right, 120ms after its row
rises. The nested Reveal carries its own observer subscription, which the shared
observer from Task 2 handles without extra cost.

- [ ] **Step 3: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 4: Verify the old borders are gone and the stagger fits budget**

```bash
rg -n "border-b border-rule" app/process/page.tsx app/services/page.tsx
```

Expected: **nothing**. Both section borders and the process row border are now
`rule` Reveals.

Longest chain on `/process` is `3 * 90 + 120 = 390ms`, which is 4 steps of
stagger. Within the global budget.

- [ ] **Step 5: Commit**

```bash
git add app/services/page.tsx app/process/page.tsx
git commit -m "feat(motion): per-item stagger on services cards and process rows"
```

---

### Task 9: Contact, Terms and Footer

**Files:**
- Modify: `app/contact/page.tsx`
- Modify: `app/terms/page.tsx:122-162`
- Modify: `components/site-footer.tsx`

**Interfaces:**
- Consumes: `Reveal` variants (Task 3).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Animate the contact hero**

`app/contact/page.tsx` does not currently import `Reveal`. Add:

```tsx
import { Reveal } from "@/components/reveal"
```

Then replace the inner `<div>` holding the heading, paragraph and CTAs (the
second child of the `md:grid-cols-[200px_1fr]` grid) with:

```tsx
            <div>
              <Reveal variant="mask">
                <h1 className="max-w-2xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-6xl">
                  Tem um sistema para construir?
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 max-w-lg text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                  Conte o problema. A gente devolve com escopo, prazo e preço — sem
                  buzzword.
                </p>
              </Reveal>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Reveal delay={200}>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98]"
                  >
                    Falar no WhatsApp
                  </a>
                </Reveal>
                <Reveal delay={260}>
                  <a
                    href="https://instagram.com/monoolithus"
                    className="inline-block border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-[transform,color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground active:translate-y-0 active:scale-[0.98]"
                  >
                    @monoolithus
                  </a>
                </Reveal>
              </div>
            </div>
```

The `inline-block` added to both anchors preserves their padding box now that
each sits inside a block-level `Reveal` wrapper inside a flex row.

- [ ] **Step 2: Add quiet reveals to the terms clauses**

In `app/terms/page.tsx`, add the import:

```tsx
import { Reveal } from "@/components/reveal"
```

Then replace the `secoes.map(...)` block (currently lines 123-161) with:

```tsx
          {secoes.map((secao) => (
            <Reveal key={secao.n} variant="quiet">
              <section className="grid gap-3 border-b border-rule py-10 md:grid-cols-[64px_1fr] md:gap-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary md:pt-1">
                  § {secao.n}
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-light tracking-tight">
                    {secao.title}
                  </h2>
                  {secao.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="mt-4 leading-relaxed text-muted-foreground"
                    >
                      {p}
                    </p>
                  ))}
                  {secao.list && (
                    <ul className="mt-4 space-y-3">
                      {secao.list.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-3 leading-relaxed text-muted-foreground"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-px w-4 shrink-0 bg-primary"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </Reveal>
          ))}
```

The `key` moved from `<section>` to `<Reveal>`, since `Reveal` is now the
mapped element. No `delay` anywhere: legal copy gets no stagger. `quiet` has no
translate, so nothing shifts under a reader mid-clause. The
`border-b border-rule` on each section stays a plain border — drawing rules
under legal text is noise.

- [ ] **Step 3: Animate the footer**

In `components/site-footer.tsx`, add the import:

```tsx
import { Reveal } from "@/components/reveal"
```

Change the root element and add the drawing hairline as its first child:

```tsx
    <footer className="relative">
      <Reveal variant="rule" className="absolute inset-x-0 top-0 h-px bg-rule" />
```

Then wrap each of the three columns in the `md:grid-cols-3` grid. Replace the
grid block (currently lines 9-60) with:

```tsx
        <div className="grid gap-12 md:grid-cols-3">
          <Reveal>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Marca
            </h4>
            <p className="font-serif text-xl leading-snug">Monoolithus</p>
            <p className="font-serif text-xl leading-snug text-muted-foreground">
              Desenvolvimento web sob medida
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              São José dos Campos · BR
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Contato
            </h4>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-fit font-serif text-xl leading-snug transition-[color,transform] duration-200 ease-out hover:translate-x-1 hover:text-primary"
            >
              WhatsApp · {WHATSAPP_DISPLAY}
            </a>
            <a
              href="https://instagram.com/monoolithus"
              className="block w-fit font-serif text-xl leading-snug transition-[color,transform] duration-200 ease-out hover:translate-x-1 hover:text-primary"
            >
              @monoolithus
            </a>
            <a
              href="mailto:contato@monoolithus.com"
              className="block w-fit font-serif text-xl leading-snug transition-[color,transform] duration-200 ease-out hover:translate-x-1 hover:text-primary"
            >
              contato@monoolithus.com
            </a>
          </Reveal>

          <Reveal delay={160}>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Legal
            </h4>
            <Link
              href="/terms"
              className="block w-fit font-serif text-xl leading-snug transition-[color,transform] duration-200 ease-out hover:translate-x-1 hover:text-primary"
            >
              Termos de acesso aos dados
            </Link>
          </Reveal>
        </div>
```

Each column's outer `<div>` is replaced by the `Reveal` itself rather than
wrapped, so the grid still sees exactly three direct children and the layout is
unchanged.

Leave the bottom bar (`mt-16 ... border-t border-rule pt-6`) exactly as it is,
border included. It is a structural divider inside an already-revealed block.

- [ ] **Step 4: Verify types and lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: both pass.

- [ ] **Step 5: Verify every route and the footer now have reveals**

```bash
for f in app/page.tsx app/services/page.tsx app/process/page.tsx \
         app/contact/page.tsx app/terms/page.tsx components/site-footer.tsx; do
  printf '%s: ' "$f"; rg -c "<Reveal" "$f" || echo 0
done
```

Expected: every line prints a count of at least 1.

- [ ] **Step 6: Commit**

```bash
git add app/contact/page.tsx app/terms/page.tsx components/site-footer.tsx
git commit -m "feat(motion): reveals for contact, terms and footer"
```

---

### Task 10: Full verification pass

Nothing is complete until this task passes. Do not skip a step because an
earlier task looked fine.

**Files:**
- Modify: only if a check fails.

**Interfaces:**
- Consumes: everything.
- Produces: a verified branch.

- [ ] **Step 1: Clean build**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

Expected: all three succeed. Paste the real build output into the task report.
If the build fails, fix it here — do not report the task complete.

- [ ] **Step 2: Assert the zero-listeners invariant**

```bash
rg -n "addEventListener\(['\"](scroll|wheel|touchmove)|onScroll=|onWheel=" app/ components/ lib/
```

Expected: **nothing**. Any hit is a spec violation and must be removed.

- [ ] **Step 3: Assert the native smooth-scroll rule is gone**

```bash
rg -n "scroll-behavior: smooth" app/ components/ lib/
```

Expected: **nothing**.

- [ ] **Step 4: Assert the 24px translate ceiling**

```bash
rg -n "translate3d\(0, ?-?[0-9]+px|--parallax|distance=\{-?[0-9]+\}" app/ components/
```

Expected: every numeric value is 24 or less in absolute terms. The known set is
`8`, `12`, `16`, `24`. Anything larger violates a global constraint.

- [ ] **Step 5: Visual verification with the-viewer**

Start the dev server and use the `the-viewer` skill across mobile, tablet and
desktop viewports, on all five routes (`/`, `/services`, `/process`, `/contact`,
`/terms`).

```bash
pnpm dev
```

Confirm for each route:
- No console errors or warnings.
- No horizontal overflow at any viewport.
- Every CTA is visible and reachable.
- Content is visible after scrolling — no element stuck at `opacity: 0`.
- On `/`, the four `FIG. 01` corner labels are still pinned to the square's
  corners. If any drifted, apply the fix noted in Task 7 Step 4.
- On `/process`, each row's hairline draws left-to-right.
- The field band's amber canvas drifts against the content and never exposes a
  bare edge at the top or bottom of the band.

- [ ] **Step 6: Reduced-motion verification**

In the browser devtools, emulate `prefers-reduced-motion: reduce` and reload
each route.

Confirm:
- Scrolling is native — no momentum, no glide.
- No parallax drift on the field band.
- All content is fully visible immediately; nothing is stuck hidden.

- [ ] **Step 7: Mobile menu scroll lock**

At a mobile viewport, open the nav menu and attempt to scroll the background.

Expected: the background does not move. Close the menu; scrolling resumes
normally with momentum.

- [ ] **Step 8: Route transition scroll position**

Scroll to the bottom of `/`, then click a nav link.

Expected: the new route renders scrolled to the top, immediately, with no
visible glide from the previous position.

- [ ] **Step 9: No-JavaScript check**

Disable JavaScript in devtools and load `/`.

Expected: all text content is visible. This confirms the `<noscript>` override
from Task 4 Step 3 works and content is not gated behind JS.

- [ ] **Step 10: Commit any fixes**

```bash
git add -A
git commit -m "fix(motion): verification pass corrections"
```

If no fixes were needed, skip the commit and say so explicitly in the report.
