import { createProgram, createShader } from './webglHelpers.js'

export function createDrawdownProgram (gl) {
  return createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, `
      precision mediump float;
      uniform vec2 resolution;
      uniform vec2 scale;
      uniform vec3 colors[16];
      uniform int warp[128];
      uniform float warpLength;
      uniform int weft[128];
      uniform float weftLength;
      uniform int threading[128];
      uniform float threadingLength;
      uniform int treadling[128];
      uniform float treadlingLength;
      uniform int tieUp[64];
      uniform float treadles;
      uniform float shafts;
      attribute vec4 vertPosition;
      varying vec4 fragColor;

      bool isWarp (float x, float y) {
        int treadle = treadling[int(mod(y + 0.5, treadlingLength))];
        int shaft = threading[int(mod(x + 0.5, threadingLength))];
        int a = tieUp[treadle * int(0.5 + shafts) + shaft];
        return a == 1;
      }

      void main() {
        float width = floor(0.5 + warpLength);
        float height = floor(0.5 + weftLength);
        float x = floor(0.5 + vertPosition.x);
        float y = floor(0.5 + vertPosition.y);
        float ox = floor(0.5 + vertPosition.z);
        float oy = floor(0.5 + vertPosition.w);
        float texture = 0.3;
        if (isWarp(x, y)) {
          int warpIndex = int(mod(x + 0.5, width));
          if (ox == 1.0) {
            fragColor = vec4((1.0 - texture) * colors[warp[warpIndex]], 1.0);
          } else {
            fragColor = vec4(texture * vec3(1.0, 1.0, 1.0) + (1.0 - texture) * colors[warp[warpIndex]], 1.0);
          }
        } else {
          int weftIndex = int(mod(y + 0.5, height));
          if (oy == 1.0) {
            fragColor = vec4((1.0 - texture) * colors[weft[weftIndex]], 1.0);
          } else {
            fragColor = vec4(texture * vec3(1.0, 1.0, 1.0) + (1.0 - texture) * colors[weft[weftIndex]], 1.0);
          }
        }
        gl_Position = vec4(
          2.0 * (x + ox) * scale.x / resolution.x - 1.0,
          -2.0 * (y + oy) * scale.y / resolution.y + 1.0,
          0.0,
          1.0
        );
      }
    `),
    createShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 fragColor;

      void main() {
        gl_FragColor = fragColor;
      }
    `)
  )
}
