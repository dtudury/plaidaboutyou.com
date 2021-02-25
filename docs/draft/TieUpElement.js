import { h, watchFunction } from '../horseless.0.5.2.min.esm.js' // '/unpkg/horseless/horseless.js'
import { TieUp } from './TieUp.js'
import { model } from '../model.js'

class TieUpElement extends window.HTMLCanvasElement {
  connectedCallback () {
    const gl = this.getContext('webgl')
    if (!gl) { console.error('no webgl?!') }
    const tieUp = new TieUp(gl)

    watchFunction(() => {
      this.width = model.treadles * model.scale
      this.height = model.shafts * model.scale
      tieUp.setTieUp(model.tieUp.flat())
      tieUp.setTreadles(model.treadles)
      tieUp.setShafts(model.shafts)
      tieUp.setScale(model.scale)
      tieUp.draw()
    })
  }
}

const tieUpElementName = 'tie-up-element'
window.customElements.define(tieUpElementName, TieUpElement, { extends: 'canvas' })
const tieUps = new Map()
export const TIE_UP_ELEMENT = (attributes, children, description) => {
  if (!tieUps.has(description)) tieUps.set(description, h`<canvas is="${tieUpElementName}"/>`)
  return tieUps.get(description)
}
