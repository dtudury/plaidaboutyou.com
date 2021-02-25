/* eslint-disable accessor-pairs */
import { createProgram, createShader } from './webglHelpers.js'

export class Drawdown {
  constructor (gl) {
    this.gl = gl
    this.program = _createProgram(gl)
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

  updateVertices () {
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

  draw () {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 4)
  }

  setDimensions (dimensions) {
    this._dimensions = dimensions
    this.gl.viewport(0, 0, dimensions.width, dimensions.height)
    this.gl.uniform2f(this.resolutionLocation, dimensions.width, dimensions.height)
    this.updateVertices()
  }

  setScale (scale) {
    this.gl.uniform2f(this.scaleLocation, scale, scale)
    this._scale = scale
    this.updateVertices()
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

const _createProgram = gl => createProgram(
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
