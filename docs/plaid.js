import { proxy, watchFunction } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'
import { createProgram, createShader } from './webglHelpers.js'

const model = window.model = proxy({
  colors: {
    B: '0x000000',
    W: '0xffffff',
    R: '0xff0000'
  },
  warp: [
    { color: 'W', count: 8 },
    { color: 'B', count: 3 },
    { color: 'R', count: 1 },
    { color: 'B', count: 4 }
  ],
  weft: [
    { color: 'W', count: 8 },
    { color: 'B', count: 8 }
  ],
  drawdown: [
    [1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1]
  ]
})

function encodeModel (model) {
  const colorPart = `COLORS=${Object.entries(model.colors).map(([name, value]) => `${name}:${value}`).join(',')}`
  const warpPart = `WARP=${model.warp.map(({ color, count }) => `${color}:${count}`).join(',')}`
  const weftPart = `WEFT=${model.weft.map(({ color, count }) => `${color}:${count}`).join(',')}`
  const shafts = model.drawdown.reduce((acc, row) => Math.max(acc, row.length), 0)
  const drawdownPart = `DRAWDOWN=${shafts}:${
    model.drawdown
      .map(row => row.concat(Array(shafts - row.length).fill(0)))
      .map(row => `0x${BigInt(`0b${row.join('')}`).toString(16)
  }`).join(',')}`
  return [colorPart, warpPart, weftPart, drawdownPart].join(';')
}

function decodeModel (string) {
  const obj = {}
  string.split(';').forEach(part => {
    const [label, data] = part.split('=')
    switch (label.toUpperCase()) {
      case 'COLORS':
        obj.colors = Object.fromEntries(data.split(',')
          .map(namevalue => namevalue.split(':')))
        break
      case 'WARP':
      case 'WEFT':
        obj[label.toLowerCase()] = data.split(',')
          .map(colorcount => colorcount.split(':'))
          .map(([color, count]) => ({ color, count: +count }))
        break
      case 'DRAWDOWN': {
        const [width, encodedPattern] = data.split(':')
        obj.drawdown = encodedPattern.split(',')
          .map(row => BigInt(row).toString(2).split('').map(n => +n))
          .map(row => Array(width - row.length).fill(0).concat(row))
        break
      }
    }
  })
  return obj
}

function setFromHash () {
  Object.assign(model, {})
  if (document.location.hash) {
    try {
      const hash = decodeModel(document.location.hash.substring(1))
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
    uniform vec3 colors[128];
    uniform int warp[256];
    uniform float warpLength;
    uniform int weft[256];
    uniform float weftLength;
    uniform int drawdown[256];
    uniform float drawdownWidth;
    uniform float drawdownHeight;
    attribute vec4 vertPosition;
    varying vec4 fragColor;
    void main() {
      float x = vertPosition.x - resolution.x * 0.5;
      float y = vertPosition.y - resolution.y * 0.5;
      float threadX = vertPosition.z;
      float threadY = vertPosition.w;
      int a = drawdown[int(mod(threadY, drawdownHeight) * drawdownWidth + mod(threadX, drawdownWidth))];
      if (a == 0) {
        fragColor = vec4(colors[warp[int(mod(threadX, warpLength))]], 1.0);
      } else {
        fragColor = vec4(colors[weft[int(mod(threadY, weftLength))]], 1.0);
      }
      gl_Position = vec4(
        2.0 * vertPosition.x / resolution.x - 1.0, // + sin(time + x / 100.0) * 0.01,
        -2.0 * vertPosition.y / resolution.y + 1.0, // + sin(time + y / 100.0) * 0.01,
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
const drawdownLocation = gl.getUniformLocation(program, 'drawdown')
const drawdownWidthLocation = gl.getUniformLocation(program, 'drawdownWidth')
const drawdownHeightLocation = gl.getUniformLocation(program, 'drawdownHeight')
const colorsLocation = gl.getUniformLocation(program, 'colors')
const warpLocation = gl.getUniformLocation(program, 'warp')
const warpLengthLocation = gl.getUniformLocation(program, 'warpLength')
const weftLocation = gl.getUniformLocation(program, 'weft')
const weftLengthLocation = gl.getUniformLocation(program, 'weftLength')

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
  const colorValues = []
  const colorNamesMap = {}
  Object.keys(model.colors).forEach(key => {
    colorNamesMap[key] = colorValues.length
    const color = parseInt(model.colors[key])
    const r = ((color >>> 16) & 0xff) / 0xff
    const g = ((color >>> 8) & 0xff) / 0xff
    const b = (color & 0xff) / 0xff
    colorValues.push([r, g, b])
  })
  gl.uniform3fv(colorsLocation, colorValues.flat())

  const warp = model.warp.map(({ color, count }) => Array(count).fill(colorNamesMap[color])).flat()
  gl.uniform1iv(warpLocation, warp)
  gl.uniform1f(warpLengthLocation, warp.length)

  const weft = model.weft.map(({ color, count }) => Array(count).fill(colorNamesMap[color])).flat()
  gl.uniform1iv(weftLocation, weft)
  gl.uniform1f(weftLengthLocation, weft.length)

  const shafts = model.drawdown.reduce((acc, row) => Math.max(acc, row.length), 0)
  gl.uniform1iv(drawdownLocation, model.drawdown.map(row => row.concat(Array(shafts - row.length).fill(0))).flat())
  gl.uniform1f(drawdownWidthLocation, shafts)
  gl.uniform1f(drawdownHeightLocation, model.drawdown.length)
  document.location.hash = encodeModel(model)
})

function redraw (t) {
  const time = (t / 1000) % 0x10000
  gl.uniform1f(timeLocation, time)
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4)
  window.requestAnimationFrame(redraw)
}
redraw(0)
