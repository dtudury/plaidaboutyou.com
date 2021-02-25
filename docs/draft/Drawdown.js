/* eslint-disable accessor-pairs */
import { createDrawdownProgram } from './DrawdownProgram.js'

export class Drawdown {
  constructor (gl) {
    this.gl = gl
    this.program = createDrawdownProgram(gl)
    gl.useProgram(this.program)
    this.triangleVertexBufferObject = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexBufferObject)
    this.positionAttribLocation = gl.getAttribLocation(this.program, 'vertPosition')
    gl.vertexAttribPointer(this.positionAttribLocation, 4, gl.FLOAT, gl.FALSE, 4 * Float32Array.BYTES_PER_ELEMENT, 0)
    gl.enableVertexAttribArray(this.positionAttribLocation)
    this.resolutionLocation = gl.getUniformLocation(this.program, 'resolution')
    this.scaleLocation = gl.getUniformLocation(this.program, 'scale')
    this.tieUpLocation = gl.getUniformLocation(this.program, 'tieUp')
    this.treadlesLocation = gl.getUniformLocation(this.program, 'treadles')
    this.shaftsLocation = gl.getUniformLocation(this.program, 'shafts')
    this.colorsLocation = gl.getUniformLocation(this.program, 'colors')
    this.warpLocation = gl.getUniformLocation(this.program, 'warp')
    this.warpLengthLocation = gl.getUniformLocation(this.program, 'warpLength')
    this.weftLocation = gl.getUniformLocation(this.program, 'weft')
    this.weftLengthLocation = gl.getUniformLocation(this.program, 'weftLength')
    this.threadingLocation = gl.getUniformLocation(this.program, 'threading')
    this.threadingLengthLocation = gl.getUniformLocation(this.program, 'threadingLength')
    this.treadlingLocation = gl.getUniformLocation(this.program, 'treadling')
    this.treadlingLengthLocation = gl.getUniformLocation(this.program, 'treadlingLength')
  }

  draw () {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 4)
  }

  _updateVertices () {
    if (this._scale && this._dimensions) {
      const step = this._scale
      const xStep = step
      const yStep = step
      this.vertices = []
      for (let x = 0; x < this._dimensions.width / xStep; ++x) {
        for (let y = 0; y < this._dimensions.height / yStep; ++y) {
          this.vertices.push(
            x, y, 0, 0,
            x, y, 0, 1,
            x, y, 1, 0,
            x, y, 1, 1,
            x, y, 1, 0,
            x, y, 0, 1
          )
        }
      }
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW)
    }
  }

  setDimensions (dimensions) {
    this._dimensions = dimensions
    this.gl.viewport(0, 0, dimensions.width, dimensions.height)
    this.gl.uniform2f(this.resolutionLocation, dimensions.width, dimensions.height)
    this._updateVertices()
  }

  setScale (scale) {
    this.gl.uniform2f(this.scaleLocation, scale, scale)
    this._scale = scale
    this._updateVertices()
  }

  setColors (colors) {
    this.gl.uniform3fv(this.colorsLocation, colors)
  }

  setWarp (warp) {
    this.gl.uniform1iv(this.warpLocation, warp)
    this.gl.uniform1f(this.warpLengthLocation, warp.length)
  }

  setWeft (weft) {
    this.gl.uniform1iv(this.weftLocation, weft)
    this.gl.uniform1f(this.weftLengthLocation, weft.length)
  }

  setThreading (threading) {
    this.gl.uniform1iv(this.threadingLocation, threading)
    this.gl.uniform1f(this.threadingLengthLocation, threading.length)
  }

  setTreadling (treadling) {
    this.gl.uniform1iv(this.treadlingLocation, treadling)
    this.gl.uniform1f(this.treadlingLengthLocation, treadling.length)
  }

  setTieUp (tieUp) {
    this.gl.uniform1iv(this.tieUpLocation, tieUp)
  }

  setTreadles (treadles) {
    this.gl.uniform1f(this.treadlesLocation, treadles)
  }

  setShafts (shafts) {
    this.gl.uniform1f(this.shaftsLocation, shafts)
  }
}
