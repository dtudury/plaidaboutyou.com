import { proxy, watchFunction } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'
import { createProgram, createShader } from './webglHelpers.js'

const model = window.model = proxy({})

function setFromHash () {
  Object.assign(model, {})
  if (document.location.hash) {
    try {
      const hash = JSON.parse(unescape(document.location.hash.substring(1)))
      Object.assign(model, hash)
    } catch (err) {
      console.error(err)
    }
  }
}
setFromHash()

window.addEventListener('hashchange', setFromHash)

const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')
if (!gl) {
  console.error('no webgl?!')
}

const program = createProgram(
  gl,
  createShader(gl, gl.VERTEX_SHADER, `
    precision lowp float;
    uniform vec2 resolution;
    uniform float time;
    uniform int weave[64];
    uniform vec3 warp[16];
    uniform vec3 weft[16];
    attribute vec4 vertPosition;
    varying vec4 fragColor;
    void main() {
      float x = vertPosition.x - resolution.x * 0.5;
      float y = vertPosition.y - resolution.y * 0.5;
      float z = mod(vertPosition.z, 8.0);
      float w = mod(vertPosition.w, 8.0);
      int a = weave[int(w * 8.0 + z)];
      if (a == 0) {
        fragColor = vec4(warp[int(mod(vertPosition.z, 16.0))], 1.0);
      } else {
        fragColor = vec4(weft[int(mod(vertPosition.w, 16.0))], 1.0);
      }
      gl_Position = vec4(
        2.0 * vertPosition.x / resolution.x - 1.0,// + sin(time + x) * 0.01,
        -2.0 * vertPosition.y / resolution.y + 1.0,// + sin(time + y) * 0.01,
        0.0,
        1.0
      );
    }
  `),
  createShader(gl, gl.FRAGMENT_SHADER, `
    precision lowp float;
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

const timeLocation = gl.getUniformLocation(program, 'time')
const resolutionLocation = gl.getUniformLocation(program, 'resolution')
const weaveLocation = gl.getUniformLocation(program, 'weave')
const warpLocation = gl.getUniformLocation(program, 'warp')
const weftLocation = gl.getUniformLocation(program, 'weft')

function resizeCanvas () {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const step = 3
  const xStep = step
  const yStep = step
  vertices = []
  for (let x = 0; x < canvas.width / xStep; ++x) {
    for (let y = 0; y < canvas.height / yStep; ++y) {
      vertices.push([
        x * xStep, y * yStep, x, y,
        x * xStep, (y + 1) * yStep, x, y,
        (x + 1) * xStep, y * yStep, x, y,
        (x + 1) * xStep, (y + 1) * yStep, x, y,
        (x + 1) * xStep, y * yStep, x, y,
        x * xStep, (y + 1) * yStep, x, y
      ])
    }
  }
  vertices = vertices.flat()
  gl.viewport(0, 0, window.innerWidth, window.innerHeight)
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
}
window.addEventListener('resize', resizeCanvas, false)

watchFunction(() => {
  resizeCanvas()
  gl.uniform1iv(weaveLocation, [
    1, 1, 1, 1, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 0,
    0, 0, 0, 0, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 1
  ])
  gl.uniform3fv(warpLocation, [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    1, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  ])
  gl.uniform3fv(weftLocation, [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  ])
  document.location.hash = escape(JSON.stringify(model))
})

function redraw (t) {
  const time = (t / 1000) % 0x10000
  gl.uniform1f(timeLocation, time)
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4)
  window.requestAnimationFrame(redraw)
}
redraw(0)
