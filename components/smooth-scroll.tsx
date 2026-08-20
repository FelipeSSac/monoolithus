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
      // Lerp, not duration+easing. In duration mode every wheel event restarts
      // the animation toward a new target, so the longer the animation the more
      // often it is interrupted — weight turns into grabbiness. Lerp approaches
      // the target by a constant fraction each frame and never restarts, so a
      // lower number reads as heavier inertia while staying perfectly even.
      // ~94% of the distance in half a second, fully settled around 1.2s.
      lerp: 0.055,
      // Each wheel notch travels a little further, reinforcing the momentum.
      wheelMultiplier: 1.1,
      // Touch keeps native momentum. Hijacking it is what makes smooth-scroll
      // sites feel broken on phones, and long inertia layered over the platform's
      // own momentum is exactly what makes a page feel like it ignores the finger.
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
    // Bail before consuming the skip while there is no instance yet. This
    // effect first runs with `lenis === null`; `setLenis` then changes a
    // dependency and re-runs it. Consuming the skip on that first null pass
    // would let the re-run scroll to top on EVERY initial load, which is
    // precisely the deep-link case the skip exists to protect.
    if (!lenis) return
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    lenis.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
