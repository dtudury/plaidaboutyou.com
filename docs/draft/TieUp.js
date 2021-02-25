/* eslint-disable accessor-pairs */
import { createTieUpProgram } from './TieUpProgram.js'

export class TieUp {
  constructor (gl) {
    this.gl = gl
    this.program = createTieUpProgram(gl)
    gl.useProgram(this.program)
    this.triangleVertexBufferObject = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexBufferObject)
    this.positionAttribLocation = gl.getAttribLocation(this.program, 'vertPosition')
    gl.vertexAttribPointer(this.positionAttribLocation, 4, gl.FLOAT, gl.FALSE, 4 * Float32Array.BYTES_PER_ELEMENT, 0)
    gl.enableVertexAttribArray(this.positionAttribLocation)
    this.scaleLocation = gl.getUniformLocation(this.program, 'scale')
    this.tieUpLocation = gl.getUniformLocation(this.program, 'tieUp')
    this.treadlesLocation = gl.getUniformLocation(this.program, 'treadles')
    this.shaftsLocation = gl.getUniformLocation(this.program, 'shafts')
  }

  draw () {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 4)
  }

  _updateVertices () {
    if (this._scale && this._shafts && this._treadles) {
      this.gl.viewport(0, 0, this._treadles * this._scale, this._shafts * this._scale)
      this.vertices = []
      for (let x = 0; x < this._treadles; ++x) {
        for (let y = 0; y < this._shafts; ++y) {
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

  setScale (scale) {
    this.gl.uniform2f(this.scaleLocation, scale, scale)
    this._scale = scale
    this._updateVertices()
  }

  setTieUp (tieUp) {
    this.gl.uniform1iv(this.tieUpLocation, tieUp)
  }

  setTreadles (treadles) {
    this.gl.uniform1f(this.treadlesLocation, treadles)
    this._treadles = treadles
    this._updateVertices()
  }

  setShafts (shafts) {
    this.gl.uniform1f(this.shaftsLocation, shafts)
    this._shafts = shafts
    this._updateVertices()
  }
}
