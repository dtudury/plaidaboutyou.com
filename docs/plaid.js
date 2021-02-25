import { model, expandValue } from './model.js'
import { Drawdown } from './Drawdown.js'

export function createPlaidRenderer (canvas, gl) {
  const drawdown = new Drawdown(gl)
  const program = drawdown.program

  const triangleVertexBufferObject = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject)
  const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
  gl.vertexAttribPointer(positionAttribLocation, 4, gl.FLOAT, gl.FALSE, 4 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.enableVertexAttribArray(positionAttribLocation)

  return function plaidRenderer () {
    const step = model.scale
    const xStep = step
    const yStep = step
    const vertices = []
    for (let x = 0; x < model.dimensions.width / xStep; ++x) {
      for (let y = 0; y < model.dimensions.height / yStep; ++y) {
        vertices.push(
          x, y, 0, 0,
          x, y, 0, 1,
          x, y, 1, 0,
          x, y, 1, 1,
          x, y, 1, 0,
          x, y, 0, 1
        )
      }
    }

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
    const shafts = model.shafts
    const treadles = model.treadles
    const wrap = (i, m) => ((i - 1) % m + m) % m
    const shaftMapper = i => wrap(i, shafts)
    const treadleMapper = i => wrap(i, treadles)
    const warp = expandValue(model.warp, model.vars).map(hexMapper)
    const weft = expandValue(model.weft, model.vars).map(hexMapper)
    const threading = expandValue(model.threading, model.vars).map(shaftMapper)
    const treadling = expandValue(model.treadling, model.vars).map(treadleMapper)

    gl.useProgram(program)
    gl.viewport(0, 0, model.dimensions.width, model.dimensions.height)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.uniform2f(drawdown.resolutionLocation, model.dimensions.width, model.dimensions.height)
    gl.uniform2f(drawdown.scaleLocation, xStep, yStep)
    gl.uniform3fv(drawdown.colorsLocation, colorValues.flat())
    gl.uniform1iv(drawdown.warpLocation, warp)
    gl.uniform1f(drawdown.warpLengthLocation, warp.length)
    gl.uniform1iv(drawdown.weftLocation, weft)
    gl.uniform1f(drawdown.weftLengthLocation, weft.length)
    gl.uniform1iv(drawdown.threadingLocation, threading)
    gl.uniform1f(drawdown.threadingLengthLocation, threading.length)
    gl.uniform1iv(drawdown.treadlingLocation, treadling)
    gl.uniform1f(drawdown.treadlingLengthLocation, treadling.length)
    gl.uniform1iv(drawdown.tieUpLocation, model.tieUp.map(arr => arr.slice().reverse()).flat())
    gl.uniform1f(drawdown.treadlesLocation, treadles)
    gl.uniform1f(drawdown.shaftsLocation, shafts)
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4)
  }
}
