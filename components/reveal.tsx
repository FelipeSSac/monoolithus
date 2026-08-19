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
