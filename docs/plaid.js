import { watchFunction } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'
import { createProgram, createShader } from './webglHelpers.js'
import { model, saveModel, expandColors } from './model.js'

const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')
if (!gl) {
  console.error('no webgl?!')
}

const program = createProgram(
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
    uniform int tieUp[64];
    uniform float tieUpWidth;
    uniform float tieUpHeight;
    attribute vec4 vertPosition;
    varying vec4 fragColor;


    bool isWarp (float x, float y) {
      x = floor(mod(x + 0.5, tieUpWidth));
      y = floor(mod(y + 0.5, tieUpHeight));
      int a = tieUp[int(0.5 + y * tieUpWidth + x)];
      return a == 0;
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
gl.useProgram(program)

let vertices

const triangleVertexBufferObject = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject)
const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
gl.vertexAttribPointer(positionAttribLocation, 4, gl.FLOAT, gl.FALSE, 4 * Float32Array.BYTES_PER_ELEMENT, 0)
gl.enableVertexAttribArray(positionAttribLocation)

const resolutionLocation = gl.getUniformLocation(program, 'resolution')
const scaleLocation = gl.getUniformLocation(program, 'scale')
const tieUpLocation = gl.getUniformLocation(program, 'tieUp')
const tieUpWidthLocation = gl.getUniformLocation(program, 'tieUpWidth')
const tieUpHeightLocation = gl.getUniformLocation(program, 'tieUpHeight')
const colorsLocation = gl.getUniformLocation(program, 'colors')
const warpLocation = gl.getUniformLocation(program, 'warp')
const warpLengthLocation = gl.getUniformLocation(program, 'warpLength')
const weftLocation = gl.getUniformLocation(program, 'weft')
const weftLengthLocation = gl.getUniformLocation(program, 'weftLength')

function resizeCanvas () {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const step = model.scale
  const xStep = step
  const yStep = step
  vertices = []
  for (let x = 0; x < canvas.width / xStep; ++x) {
    for (let y = 0; y < canvas.height / yStep; ++y) {
      vertices.push([
        x, y, 0, 0,
        x, y, 0, 1,
        x, y, 1, 0,
        x, y, 1, 1,
        x, y, 1, 0,
        x, y, 0, 1
      ])
    }
  }
  vertices = vertices.flat()
  gl.viewport(0, 0, window.innerWidth, window.innerHeight)
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
  gl.uniform2f(scaleLocation, xStep, yStep)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const colorValues = []
  const colorMap = {}
  const hexMapper = hex => {
    if (colorMap[hex] == null) {
      const color = parseInt(hex)
      const r = ((color >>> 16) & 0xff) / 0xff
      const g = ((color >>> 8) & 0xff) / 0xff
      const b = (color & 0xff) / 0xff
      colorMap[hex] = colorValues.length
      colorValues.push([r, g, b])
    }
    return colorMap[hex]
  }
  const warp = expandColors(model.colors[model.warp]).map(hexMapper)
  const weft = expandColors(model.colors[model.weft]).map(hexMapper)

  gl.uniform3fv(colorsLocation, colorValues.flat())
  gl.uniform1iv(warpLocation, warp)
  gl.uniform1f(warpLengthLocation, warp.length)
  gl.uniform1iv(weftLocation, weft)
  gl.uniform1f(weftLengthLocation, weft.length)

  gl.uniform1iv(tieUpLocation, model.tieUp.map(row => row.concat(Array(model.shafts - row.length).fill(0))).flat())
  gl.uniform1f(tieUpWidthLocation, model.treadles)
  gl.uniform1f(tieUpHeightLocation, model.shafts)
  saveModel()

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4)
}

window.addEventListener('resize', resizeCanvas, false)
watchFunction(resizeCanvas)
