/**
 * Brand shader for the Monoolithus hero.
 *
 * Monochrome amber (#ffb23f) filaments drifting through a polar field over the
 * near-black brand background — light seeping through the monolith rather than a
 * rainbow aurora. Intensity is kept low so headline type stays legible on top.
 */
export const MONOLITH_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform float intensity;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define MN min(R.x,R.y)

const vec3 AMBER = vec3(1.0, 0.698, 0.247);   // #ffb23f
const vec3 BASE  = vec3(0.039, 0.039, 0.039); // #0a0a0a

float filaments(vec2 uv) {
  float d = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    uv.x += sin(T * 0.35 * (1.0 + i) + uv.y * 1.5) * 0.2;
    d += 0.0032 / abs(uv.x);
  }
  return d;
}

float field(vec2 uv) {
  uv = vec2(atan(uv.x, uv.y) * 2.0 / 6.28318, -log(length(uv)) + T * 0.07);
  float d = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    d += filaments(uv + i * 6.0 / MN);
  }
  return d;
}

void main() {
  vec2 uv = (FC - 0.5 * R) / MN;

  // Faint engineered lattice, breathing slowly.
  float v = 5.5e-4 / abs(sin(uv.x * 12.0) * cos(uv.y * 12.0));

  uv.y += R.x > R.y ? 0.5 : 0.5 * (R.y / R.x);
  v += field(uv);

  v = clamp(v, 0.0, 1.4);
  vec3 col = BASE + AMBER * pow(v, 1.25) * 0.5 * intensity;
  O = vec4(col, 1.0);
}`
