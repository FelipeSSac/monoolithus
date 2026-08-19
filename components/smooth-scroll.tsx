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
