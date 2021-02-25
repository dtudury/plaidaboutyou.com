import { watchFunction, render, h } from './horseless.0.5.2.min.esm.js' // '/unpkg/horseless/horseless.js'
import { model, saveModel } from './model.js'
import { DRAWDOWN_ELEMENT } from './draft/DrawdownElement.js'
import { TIE_UP_ELEMENT } from './draft/TieUpElement.js'

function updateDimensions () {
  model.dimensions = { width: window.innerWidth, height: window.innerHeight }
}
updateDimensions()
window.addEventListener('resize', updateDimensions, false)
watchFunction(saveModel)

render(document.body, h`
  <${DRAWDOWN_ELEMENT}/>
  <div style="position: absolute; top: 10px; left: 10px;">
    <${TIE_UP_ELEMENT}/>
  </div>
`)
