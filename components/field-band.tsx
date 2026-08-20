import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { ShaderCanvas } from "@/components/ui/shader-canvas"
import { MONOLITH_FRAG } from "@/lib/shaders"
import { Parallax } from "@/components/parallax"

type FieldBandProps = {
  children: ReactNode
  className?: string
  /** Field strength for this page (1 = baseline). Lower = quieter. */
  intensity?: number
}

/**
 * Full-bleed band that runs the living amber field behind its content, then
 * blends down into the solid page background so the sections below read as
 * solid "faixas". Reused as the opening band on every route; `intensity` lets
 * each page dial the field up or down.
 */
export function FieldBand({ children, className, intensity }: FieldBandProps) {
  return (
    <div className={cn("relative overflow-hidden border-b border-rule", className)}>
      {/* Inset vertically so the drifting canvas never exposes a bare edge. */}
      <Parallax
        distance={24}
        className="pointer-events-none absolute -inset-y-8 inset-x-0"
      >
        {/* Static by design: the shader is fill-rate bound, and any live
            redraw leaves frames that miss the budget on weaker GPUs. Drawn
            once, it costs nothing per frame and the scroll stays at 60fps.
            Pass `animated` to bring the drift back. */}
        <ShaderCanvas
          fragmentSource={MONOLITH_FRAG}
          intensity={intensity}
          animated={false}
          ariaLabel="Campo de filamentos âmbar sobre fundo escuro"
        />
      </Parallax>
      {/* Scrims: legibility on the left, blend into the page top and bottom.
          Tighter on small screens where the single column sits over the field. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40 lg:via-background/80 lg:to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background lg:from-background/60" />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
