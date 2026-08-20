/**
 * Pre-renders the brand field shader to a seamless looping WebM.
 *
 * Run by hand when `lib/shaders.ts` changes; the output is committed to
 * `public/` so neither Playwright nor ffmpeg is needed at build time.
 *
 *   node scripts/render-field.mjs
 *
 * Why pre-render at all: MONOLITH_FRAG costs nine iterations of atan/log/sin
 * per pixel, which is fill-rate bound and competes with the scroll for the
 * frame budget. Played back as video the per-frame cost is a hardware decode
 * off the main thread, so the field can keep moving during scroll.
 *
 * Why square: `<source media>` inside `<video>` is not re-evaluated on resize
 * in most browsers, so shipping separate landscape and portrait encodes is
 * fragile. The field is radial and centred, so one square source cropped with
 * `object-fit: cover` reads correctly at any aspect. The shader itself resolves
 * to the same framing constant (0.5) on both branches when width equals height.
 *
 * Why a crossfade: the shader's three filament layers repeat at 13.8s, 7.8s and
 * 5.4s, but the radial drift only realigns with them at 179.5s — far too long to
 * ship. Dissolving the tail over the head hides the seam, which works here
 * because the field is diffuse and has no rigid structure to misalign.
 */

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/**
 * Playwright is deliberately not a project dependency — it pulls tens of
 * megabytes of browser binaries for a script that runs a handful of times in
 * the life of the site. Resolve it from wherever it already exists, and say
 * plainly what to do when it doesn't.
 */
async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core"]) {
    try {
      return (await import(specifier)).chromium
    } catch {
      /* try the next one */
    }
  }
  if (process.env.PLAYWRIGHT_PATH) {
    return (await import(process.env.PLAYWRIGHT_PATH)).chromium
  }
  throw new Error(
    "playwright not found. Either `pnpm add -D playwright` (then " +
      "`pnpm exec playwright install chromium`), or point PLAYWRIGHT_PATH at an " +
      "existing install, e.g.\n" +
      "  PLAYWRIGHT_PATH=/path/to/playwright/index.mjs node scripts/render-field.mjs",
  )
}

const SIZE = 1600 // square source; cropped by object-fit at every aspect
const FPS = 24 // the field drifts slowly, so 24 is indistinguishable from 30
const LOOP_SECS = 14 // final loop length
const FADE_SECS = 2 // tail dissolved over the head
const CRF = 38 // measured: visually indistinguishable under the band's scrims

/**
 * Per-route dimming is plain `opacity`, which is exact rather than approximate
 * here: the shader adds amber over a #0a0a0a base and the page behind the band
 * is that same colour, so compositing at opacity a over it yields
 * BASE + a*AMBER*v*INTENSITY — identical to having rendered at a*INTENSITY.
 * `filter: brightness()` is the obvious alternative and was measured at 50.3fps
 * against opacity's 57.4, because a filter forces a per-pixel pass over the
 * whole layer every frame.
 *
 * Rendered at 1.0, not at the 1.3 `/contact` asks for. At 1.3 the brightest
 * filament cores clip: 1.88% of pixels saturate the red channel and 10.3% pass
 * 250. That is faithful to what the live shader showed on `/contact`, but every
 * other route would then scale *down* from an already-clipped image and lose
 * highlight detail it should have had. One route's boost is the cheaper thing
 * to give up, so opacity is clamped at 1 in FieldVideo.
 */
const INTENSITY = 1.0

const OUT_VIDEO = path.join(ROOT, "public", "field.webm")
const OUT_POSTER = path.join(ROOT, "public", "field-poster.jpg")

/** Pull the shader source straight from the app so it cannot drift. */
function readShader() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "shaders.ts"), "utf8")
  const match = src.match(/MONOLITH_FRAG = `([\s\S]*?)`/)
  if (!match) throw new Error("MONOLITH_FRAG not found in lib/shaders.ts")
  return match[1]
}

async function renderFrames(frag, dir, totalFrames) {
  const chromium = await loadChromium()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
  })
  page.on("pageerror", (e) => {
    throw e
  })
  await page.setContent(
    `<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>`,
  )

  // Setup and the whole frame loop run in one evaluate. Splitting them across
  // calls previously let the time uniform arrive undefined, which silently
  // produced a folder of byte-identical frames.
  const frames = await page.evaluate(
    ({ frag, size, fps, total, intensity }) => {
      const canvas = document.getElementById("c")
      const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true })
      if (!gl) throw new Error("no webgl2")

      const compile = (source, type) => {
        const s = gl.createShader(type)
        gl.shaderSource(s, source)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(s))
        }
        return s
      }

      const program = gl.createProgram()
      gl.attachShader(
        program,
        compile(
          "#version 300 es\nprecision highp float;\nin vec2 position;\nvoid main(){gl_Position=vec4(position,0.,1.);}",
          gl.VERTEX_SHADER,
        ),
      )
      gl.attachShader(program, compile(frag, gl.FRAGMENT_SHADER))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program))
      }
      gl.useProgram(program)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
        gl.STATIC_DRAW,
      )
      const pos = gl.getAttribLocation(program, "position")
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

      const uTime = gl.getUniformLocation(program, "time")
      gl.uniform1f(gl.getUniformLocation(program, "intensity"), intensity)
      gl.uniform2f(gl.getUniformLocation(program, "resolution"), size, size)
      gl.viewport(0, 0, size, size)

      const out = []
      for (let i = 0; i < total; i++) {
        gl.uniform1f(uTime, i / fps)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        out.push(canvas.toDataURL("image/png"))
      }
      return out
    },
    { frag, size: SIZE, fps: FPS, total: totalFrames, intensity: INTENSITY },
  )

  // A folder of identical frames is the failure mode this script has already
  // hit once, so assert against it rather than encoding silence.
  if (new Set(frames.map((f) => f.length)).size === 1) {
    throw new Error("all frames identical — the time uniform is not advancing")
  }

  frames.forEach((data, i) => {
    fs.writeFileSync(
      path.join(dir, `f${String(i).padStart(5, "0")}.png`),
      Buffer.from(data.split(",")[1], "base64"),
    )
  })

  await browser.close()
  return frames.length
}

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  })
}

const frag = readShader()
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "field-"))
const totalFrames = (LOOP_SECS + FADE_SECS) * FPS

try {
  console.log(
    `rendering ${totalFrames} frames at ${SIZE}x${SIZE}, ${FPS}fps ...`,
  )
  const n = await renderFrames(frag, dir, totalFrames)
  console.log(`  ${n} frames rendered, all distinct`)

  const body = LOOP_SECS - FADE_SECS

  console.log("encoding seamless loop ...")
  ffmpeg([
    "-framerate",
    String(FPS),
    "-i",
    path.join(dir, "f%05d.png"),
    "-filter_complex",
    // body = the part that plays untouched; the tail is dissolved over the head
    // so the last frame flows into the first.
    `[0:v]trim=0:${FADE_SECS},setpts=PTS-STARTPTS[head];` +
      `[0:v]trim=${FADE_SECS}:${LOOP_SECS},setpts=PTS-STARTPTS[body];` +
      `[0:v]trim=${LOOP_SECS}:${LOOP_SECS + FADE_SECS},setpts=PTS-STARTPTS[tail];` +
      `[tail][head]blend=all_expr='A*(1-T/${FADE_SECS})+B*(T/${FADE_SECS})'[xf];` +
      `[body][xf]concat=n=2:v=1:a=0[out]`,
    "-map",
    "[out]",
    "-c:v",
    "libvpx-vp9",
    "-crf",
    String(CRF),
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-an",
    OUT_VIDEO,
  ])

  console.log("extracting poster ...")
  ffmpeg([
    "-i",
    path.join(dir, `f${String(FADE_SECS * FPS).padStart(5, "0")}.png`),
    "-q:v",
    "6",
    OUT_POSTER,
  ])

  const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0)
  console.log(`\n  ${path.relative(ROOT, OUT_VIDEO)}  ${kb(OUT_VIDEO)} KB`)
  console.log(`  ${path.relative(ROOT, OUT_POSTER)}  ${kb(OUT_POSTER)} KB`)
  console.log(`  loop: ${body}s body + ${FADE_SECS}s crossfade = ${LOOP_SECS}s`)
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
