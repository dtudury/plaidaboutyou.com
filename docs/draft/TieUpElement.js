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
      tieUp.setTreadles(model.treadles)
      tieUp.setShafts(model.shafts)
      tieUp.setScale(model.scale)
      tieUp.draw()
    })

    watchFunction(() => {
      tieUp.setTieUp(model.tieUp.flat())
      tieUp.draw()
    })

    this.addEventListener('click', this.onclick)
  }

  onclick (e) {
    const x = Math.floor(e.offsetX / model.scale)
    const y = Math.floor(e.offsetY / model.scale)
    console.log(x, y)
    model.tieUp[y][x] = 1 - model.tieUp[y][x]
  }
}

const tieUpElementName = 'tie-up-element'
window.customElements.define(tieUpElementName, TieUpElement, { extends: 'canvas' })
const tieUps = new Map()
export const TIE_UP_ELEMENT = (attributes, children, description) => {
  if (!tieUps.has(description)) tieUps.set(description, h`<canvas is="${tieUpElementName}"/>`)
  return tieUps.get(description)
}
