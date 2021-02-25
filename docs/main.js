import { watchFunction, render, h } from './horseless.0.5.2.min.esm.js' // '/unpkg/horseless/horseless.js'
import { model, saveModel } from './model.js'
import { DRAWDOWN_ELEMENT } from './DrawdownElement.js'

function updateDimensions () {
  model.dimensions = { width: window.innerWidth, height: window.innerHeight }
}
updateDimensions()
window.addEventListener('resize', updateDimensions, false)
watchFunction(saveModel)

render(document.body, h`
  <${DRAWDOWN_ELEMENT}/>
`)
