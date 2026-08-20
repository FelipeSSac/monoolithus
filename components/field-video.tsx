"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type FieldVideoProps = {
  className?: string
  /** Field strength for this page (1 = baseline). Lower = quieter. */
  intensity?: number
}

/**
 * The brand field, pre-rendered from `lib/shaders.ts` by `scripts/render-field.mjs`.
 *
 * Playing it back costs a hardware video decode off the main thread instead of
 * nine transcendental iterations per pixel per frame, so the field keeps moving
 * during scroll without competing for the frame budget.
 *
 * Playback starts from an effect rather than the `autoplay` attribute. That way
 * `prefers-reduced-motion` never sees even a frame of movement, and without
 * JavaScript the poster simply stays — which is a complete, correct rendering
 * of a decorative background.
 */
export function FieldVideo({ className, intensity = 1 }: FieldVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Autoplay can still be refused (data saver, iOS low power). The poster
    // stays in that case, so there is nothing to recover from.
    void video.play().catch(() => {})
  }, [])

  return (
    <video
      ref={ref}
      src="/field.webm"
      poster="/field-poster.jpg"
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      // Opacity, not `filter: brightness()`. It is exact here — the video is
      // rendered at intensity 1 over a #0a0a0a base and the page behind the band
      // is that same colour, so compositing at opacity a reproduces intensity a
      // precisely. It is also far cheaper: brightness measured 50.3fps against
      // opacity's 57.4, because a filter forces a per-pixel pass over the whole
      // layer every frame.
      //
      // Clamped at 1: the source is rendered at intensity 1 to avoid clipping
      // the filament cores, so a route asking for more (contact asks 1.3) gets
      // 1 rather than a boost. See scripts/render-field.mjs for why that trade
      // was chosen over rendering brighter.
      style={{ opacity: Math.min(intensity, 1) }}
      className={cn("block h-full w-full object-cover select-none", className)}
    />
  )
}
