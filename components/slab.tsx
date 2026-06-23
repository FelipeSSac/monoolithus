import { cn } from "@/lib/utils"

interface SlabProps {
  className?: string
  /** width in pixels of the slab itself */
  width?: number
}

/**
 * O glyph da marca: retângulo vertical âmbar (proporção 4:9)
 * com uma fissura na base à direita (~78% da altura, 40% da largura).
 */
export function Slab({ className, width = 16 }: SlabProps) {
  return (
    <span
      className={cn("relative inline-block bg-primary", className)}
      style={{ width, aspectRatio: "4 / 9" }}
      aria-hidden="true"
    >
      <span
        className="absolute bg-background"
        style={{ right: 0, top: "75.8%", width: "40%", height: "1.95%" }}
      />
    </span>
  )
}
