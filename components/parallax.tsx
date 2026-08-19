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
