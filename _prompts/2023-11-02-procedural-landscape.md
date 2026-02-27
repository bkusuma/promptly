---
title: "Procedural Landscape in Shader Code"
date: 2023-11-02
model: "GPT-4"
tags: [code, glsl, generative-art]
prompt_text: |
  Write a GLSL fragment shader that generates a procedural alien landscape
  using layered FBM (fractal Brownian motion) noise. The terrain should have
  three height zones: deep violet canyons, ochre plains, and ice-white peaks.
  Include a procedural atmosphere haze using exponential depth fog.
  Add a single point light source simulating a red dwarf star at 15 degrees
  above the horizon. The shader must run in real-time at 60fps in Shadertoy.
  Comment each major function.
---

This prompt works because it **specifies the target runtime** (Shadertoy) and a concrete **performance budget** (60fps), which forces the model to avoid expensive per-fragment operations like ray-marching without explicit optimisation passes.

The three-zone terrain constraint transforms what would be a uniform noise field into a readable, structured landscape.

### Key technique

Specifying `FBM` by name is critical. Without it, GPT-4 defaults to a single-octave noise function that looks flat. FBM produces self-similar terrain detail at multiple scales — the difference between a render and a believable world.

### Output excerpt

```glsl
// Three-zone terrain colouring based on normalised height
vec3 terrainColor(float h) {
    vec3 canyon = vec3(0.28, 0.08, 0.38); // deep violet
    vec3 plains = vec3(0.72, 0.52, 0.18); // ochre
    vec3 peaks  = vec3(0.92, 0.96, 1.00); // ice white
    if (h < 0.35) return mix(canyon, plains, h / 0.35);
    if (h < 0.72) return mix(plains, peaks, (h - 0.35) / 0.37);
    return peaks;
}
```
