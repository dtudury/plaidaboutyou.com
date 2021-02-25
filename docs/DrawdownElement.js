import { h, watchFunction } from './horseless.0.5.2.min.esm.js' // '/unpkg/horseless/horseless.js'
import { Drawdown } from './Drawdown.js'
import { model, expandValue } from './model.js'

class DrawdownElement extends window.HTMLCanvasElement {
  connectedCallback () {
    const gl = this.getContext('webgl')
    if (!gl) { console.error('no webgl?!') }

    const drawdown = new Drawdown(gl)
    function plaidRenderer () {
      const colorValues = []
      const colorMap = {}
      const hexMapper = hex => {
        if (colorMap[hex] == null) {
          const color = parseInt(hex)
          const r = ((color >>> 16) & 0xff) / 0xff
          const g = ((color >>> 8) & 0xff) / 0xff
          const b = (color & 0xff) / 0xff
          colorMap[hex] = colorValues.length / 3
          colorValues.push(r, g, b)
        }
        return colorMap[hex]
      }
      drawdown.setWarp(expandValue(model.warp, model.vars).map(hexMapper))
      drawdown.setWeft(expandValue(model.weft, model.vars).map(hexMapper))
      drawdown.setColors(colorValues.flat())

      const wrap = (i, m) => ((i - 1) % m + m) % m
      const shaftMapper = i => wrap(i, model.shafts)
      const treadleMapper = i => wrap(i, model.treadles)
      drawdown.setThreading(expandValue(model.threading, model.vars).map(shaftMapper))
      drawdown.setTreadling(expandValue(model.treadling, model.vars).map(treadleMapper))

      drawdown.setDimensions(model.dimensions)
      drawdown.setScale(model.scale)
      drawdown.setTieUp(model.tieUp.map(arr => arr.slice().reverse()).flat())
      drawdown.setTreadles(model.treadles)
      drawdown.setShafts(model.shafts)
      drawdown.draw()
    }

    watchFunction(() => {
      this.width = model.dimensions.width
      this.height = model.dimensions.height
      plaidRenderer()
    })
  }
}

const drawdownElementName = 'drawdown-element'
window.customElements.define(drawdownElementName, DrawdownElement, { extends: 'canvas' })
export const DRAWDOWN_ELEMENT = () => h`<canvas is="${drawdownElementName}"/>`
