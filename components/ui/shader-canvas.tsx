"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export type ShaderCanvasProps = {
  /** GLSL ES 3.00 fragment shader. Receives `uniform float time` and `uniform vec2 resolution`. */
  fragmentSource: string
  className?: string
  /**
   * Cap device pixel ratio to protect fill-rate on retina screens. This shader
   * is fill-rate bound, so cost scales with the square of this value — 1 is a
   * deliberate default, not a conservative guess. See `maxFps`.
   */
  dprMax?: number
  /**
   * Frames per second the shader redraws at. The field drifts slowly, so 30 is
   * visually indistinguishable from 60 while leaving every other frame free for
   * scroll compositing.
   */
  maxFps?: number
  /**
   * Lower bound for the adaptive resolution scale. On a GPU that cannot hold
   * the frame budget the backing store steps down towards this before giving up.
   */
  qualityFloor?: number
  /**
   * When false the shader is drawn exactly once and no animation loop ever
   * starts, so the field costs nothing per frame. This is the only setting that
   * fully frees the frame budget for scrolling — throttling and downscaling a
   * live shader still leaves redraw frames that blow the budget on weaker GPUs.
   */
  animated?: boolean
  /** Multiplier applied to elapsed time before it reaches the shader. */
  timeScale?: number
  /** Optional `uniform float intensity` fed to the shader (1 = baseline). */
  intensity?: number
  clearColor?: [number, number, number, number]
  /** Accessible description of the ambient visual. */
  ariaLabel?: string
}

const VERTEX_SOURCE = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`

function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number,
) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "Unknown shader error"
    gl.deleteShader(shader)
    throw new Error(info)
  }
  return shader
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertex = compileShader(gl, vertexSource, gl.VERTEX_SHADER)
  const fragment = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER)
  const program = gl.createProgram()!
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || "Program link error"
    gl.deleteProgram(program)
    throw new Error(info)
  }
  return program
}

/**
 * Lean WebGL2 fragment-shader background. Renders a full-bleed quad and feeds
 * `time`/`resolution` uniforms to the supplied shader. Pauses when offscreen or
 * the tab is hidden, and honours `prefers-reduced-motion` by drawing one frame.
 *
 * The brand shader is fill-rate bound — its per-pixel cost is roughly constant,
 * so frame time tracks the backing store's pixel count almost exactly. Three
 * things keep that from eating the scroll: the backing store is capped at 1
 * device pixel per CSS pixel, redraws are throttled to `maxFps`, and if frames
 * still run long the resolution steps down until they don't. The element's CSS
 * size never changes — only how many pixels the shader fills it with.
 */
export function ShaderCanvas({
  fragmentSource,
  className,
  dprMax = 1,
  maxFps = 30,
  qualityFloor = 0.4,
  animated = true,
  timeScale = 1,
  intensity = 1,
  clearColor = [0, 0, 0, 1],
  ariaLabel = "Ambient shader background",
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true })
    if (!gl) return

    let program: WebGLProgram
    try {
      program = createProgram(gl, VERTEX_SOURCE, fragmentSource)
    } catch (error) {
      console.error("[ShaderCanvas]", error)
      return
    }

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])
    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)

    gl.useProgram(program)
    const posLoc = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uniTime = gl.getUniformLocation(program, "time")
    const uniRes = gl.getUniformLocation(program, "resolution")
    const uniIntensity = gl.getUniformLocation(program, "intensity")
    if (uniIntensity) gl.uniform1f(uniIntensity, intensity)
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3])

    // Adaptive resolution scale. Only ever decreases, so it converges instead of
    // oscillating between two settings that each look wrong half the time.
    let quality = 1

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax))
      const rect = canvas.getBoundingClientRect()
      const scale = dpr * quality
      const width = Math.floor(Math.max(1, rect.width) * scale)
      const height = Math.floor(Math.max(1, rect.height) * scale)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (seconds: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      if (uniRes) gl.uniform2f(uniRes, canvas.width, canvas.height)
      if (uniTime) gl.uniform1f(uniTime, seconds * timeScale)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const isStatic = !animated || reduceMotion

    // Resizing a canvas clears its drawing buffer. The animated path redraws on
    // the next frame anyway, but a static one never would — so it must redraw
    // here or the band goes black on resize and on mobile orientation change.
    const onResize = () => {
      fit()
      if (isStatic) draw(8)
    }

    fit()

    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)
    window.addEventListener("resize", onResize)

    // Static: render a single representative frame and stop. No rAF loop, no
    // observers, no per-frame GPU work — the canvas becomes an image. Taken
    // both when the caller asks for it and under reduced motion.
    if (isStatic) {
      draw(8)
      return () => {
        ro.disconnect()
        window.removeEventListener("resize", onResize)
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      }
    }

    let raf: number | null = null
    let onscreen = true
    let elapsed = 0
    let last: number | null = null

    // Frame pacing + adaptive quality state.
    const minFrameMs = 1000 / Math.max(1, maxFps)
    let lastDraw = 0
    let costEma = 16.7
    let samples = 0

    // Freeze while the page is scrolling. The shader's cost only ever hurts by
    // competing with the scroll, so the cheapest possible fix is to not compete:
    // sample the scroll position from the loop we already run — no extra
    // listener, no coupling to Lenis — and skip the draw while it is changing.
    // `elapsed` is frozen too, so the field resumes where it left off instead of
    // jumping forward by however long the scroll lasted.
    const scrollIdleMs = 140
    let lastScrollY = window.scrollY
    let lastScrollAt = 0

    const frame = (now: number) => {
      if (last === null) last = now
      const delta = now - last
      last = now

      const y = window.scrollY
      if (y !== lastScrollY) {
        lastScrollY = y
        lastScrollAt = now
      }
      if (now - lastScrollAt < scrollIdleMs) {
        raf = requestAnimationFrame(frame)
        return
      }

      elapsed += delta * 1e-3

      // rAF-to-rAF spacing is the honest signal for "are we holding the frame
      // budget". If the GPU is saturated the browser cannot call us on time, so
      // this grows regardless of how long our own draw call appears to take.
      if (delta > 0 && delta < 1000) costEma += (delta - costEma) * 0.1

      if (quality > qualityFloor && ++samples > 45 && costEma > 24) {
        quality = Math.max(qualityFloor, quality - 0.25)
        samples = 0
        costEma = 16.7
        fit()
      }

      // Throttle the redraw, not the loop: rAF keeps running so `costEma` stays
      // an accurate read on the page's real frame pacing.
      if (now - lastDraw >= minFrameMs) {
        lastDraw = now
        draw(elapsed)
      }

      raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      last = null
    }

    const start = () => {
      if (raf === null && onscreen && !document.hidden) {
        raf = requestAnimationFrame(frame)
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting
        if (onscreen) start()
        else stop()
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener("visibilitychange", onVisibility)

    start()

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [
    fragmentSource,
    dprMax,
    maxFps,
    qualityFloor,
    animated,
    timeScale,
    intensity,
    clearColor,
  ])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      className={cn("block h-full w-full select-none", className)}
      style={{ touchAction: "none" }}
    />
  )
}

export default ShaderCanvas
