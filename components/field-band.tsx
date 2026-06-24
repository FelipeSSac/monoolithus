import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { ShaderCanvas } from "@/components/ui/shader-canvas"
import { MONOLITH_FRAG } from "@/lib/shaders"

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
      <div className="pointer-events-none absolute inset-0">
        <ShaderCanvas
          fragmentSource={MONOLITH_FRAG}
          intensity={intensity}
          ariaLabel="Campo de filamentos âmbar em movimento sobre fundo escuro"
        />
      </div>
      {/* Scrims: legibility on the left, blend into the page top and bottom.
          Tighter on small screens where the single column sits over the field. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40 lg:via-background/80 lg:to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background lg:from-background/60" />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
