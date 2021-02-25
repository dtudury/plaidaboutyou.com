import { createProgram, createShader } from '../webglHelpers.js'

export function createTieUpProgram (gl) {
  return createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, `
      precision mediump float;
      uniform vec2 scale;
      uniform int tieUp[64];
      uniform float treadles;
      uniform float shafts;
      attribute vec4 vertPosition;
      varying vec4 fragColor;

      bool isWarp (float x, float y) {
        int treadle = int(y + 0.5);
        int shaft = int(x + 0.5);
        int a = tieUp[treadle * int(0.5 + shafts) + shaft];
        return a == 1;
      }

      void main() {
        float x = floor(0.5 + vertPosition.x);
        float y = floor(0.5 + vertPosition.y);
        float ox = floor(0.5 + vertPosition.z);
        float oy = floor(0.5 + vertPosition.w);
        if (isWarp(x, y)) {
          fragColor = vec4(1.0, 1.0, 1.0, 1.0);
        } else {
          fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_Position = vec4(
          2.0 * (x + ox) / treadles - 1.0,
          -2.0 * (y + oy) / shafts + 1.0,
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
