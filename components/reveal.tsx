"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
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

  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    // Guard against bubbling: children here have their own hover transitions,
    // and a bubbled `transitionend` would clear `will-change` mid-reveal.
    if (e.target === e.currentTarget) setSettled(true)
  }

  if (variant === "mask") {
    // Chromium factors `clip-path` into IntersectionObserver's
    // intersection ratio: a node at rest with `clip-path: inset(100% ...)`
    // (this variant's hidden state) permanently measures ratio 0, so if the
    // observed node is also the clipped node, `threshold: 0.15` can never be
    // crossed and the reveal never fires. Observe a plain, unclipped
    // wrapper instead, and put the clip-path on an inner node driven by the
    // wrapper's `data-shown` state.
    return (
      <div ref={ref} data-reveal="mask" data-shown={shown ? "true" : undefined}>
        <div
          data-reveal-mask
          onTransitionEnd={onTransitionEnd}
          style={style}
          className={cn(className)}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      data-reveal={variant}
      data-shown={shown ? "true" : undefined}
      onTransitionEnd={onTransitionEnd}
      style={style}
      className={cn(className)}
    >
      {children}
    </div>
  )
}
