import { watchFunction } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'
import { model, saveModel } from './model.js'
import { createPlaidRenderer } from './plaid.js'

const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')
if (!gl) {
  console.error('no webgl?!')
}
function updateDimensions () {
  model.dimensions = { width: window.innerWidth, height: window.innerHeight }
}
updateDimensions()

const plaidRenderer = createPlaidRenderer(canvas, gl)

window.addEventListener('resize', updateDimensions, false)
watchFunction(() => {
  canvas.width = model.dimensions.width
  canvas.height = model.dimensions.height
  plaidRenderer()
})
watchFunction(saveModel)
