import { h, watchFunction } from './horseless.0.5.2.min.esm.js' // '/unpkg/horseless/horseless.js'
import { createPlaidRenderer } from './plaid.js'
import { model } from './model.js'

class DrawdownElement extends window.HTMLCanvasElement {
  connectedCallback () {
    const drawdownGL = this.getContext('webgl')
    if (!drawdownGL) { console.error('no webgl?!') }

    const plaidRenderer = createPlaidRenderer(this, drawdownGL)

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
