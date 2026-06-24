"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export type ShaderCanvasProps = {
  /** GLSL ES 3.00 fragment shader. Receives `uniform float time` and `uniform vec2 resolution`. */
  fragmentSource: string
  className?: string
  /** Cap device pixel ratio to protect fill-rate on retina screens. */
  dprMax?: number
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
 */
export function ShaderCanvas({
  fragmentSource,
  className,
  dprMax = 2,
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

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax))
      const rect = canvas.getBoundingClientRect()
      const width = Math.floor(Math.max(1, rect.width) * dpr)
      const height = Math.floor(Math.max(1, rect.height) * dpr)
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

    fit()

    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    window.addEventListener("resize", fit)

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    // Reduced motion: render a single representative frame and stop.
    if (reduceMotion) {
      draw(8)
      return () => {
        ro.disconnect()
        window.removeEventListener("resize", fit)
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      }
    }

    let raf: number | null = null
    let onscreen = true
    let elapsed = 0
    let last: number | null = null

    const frame = (now: number) => {
      if (last === null) last = now
      elapsed += (now - last) * 1e-3
      last = now
      draw(elapsed)
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
      window.removeEventListener("resize", fit)
      document.removeEventListener("visibilitychange", onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [fragmentSource, dprMax, timeScale, intensity, clearColor])

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
