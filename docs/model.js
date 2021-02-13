import { proxy } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'

export function saveModel () {
  document.location.hash = encodeModel(model)
}

export function expandColors (colors) {
  if (Array.isArray(colors)) return colors.map(({ color, count }) => Array(count).fill(expandColors(model.colors[color]))).flat(2)
  if (typeof colors === 'string') return [colors]
}

export const model = window.model = proxy({
  colors: {
    B: '0x000000',
    W: '0xffffff',
    B8W8: [
      { color: 'B', count: 8 },
      { color: 'W', count: 8 }
    ],
    B4W4: [
      { color: 'B', count: 4 },
      { color: 'W', count: 4 }
    ],
    GLEN: [
      { color: 'B8W8', count: 4 },
      { color: 'B4W4', count: 8 }
    ]
  },
  fills: {
    N: [1],
    STRAIGHT: [
      { fill: 'N', offset: 1 }
    ],
    POINT4: [
      { fill: 'STRAIGHT', count: 3 },
      { fill: 'STRAIGHT', count: 3, reverse: true }
    ]
  },
  warp: 'GLEN',
  weft: 'GLEN',
  tieUp: [
    [1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1]
  ],
  treadles: 8,
  shafts: 8,
  scale: 3
})

function expandFills (fills, offsets = {}) {
  // const output = []
  return fills
}

console.log(
  JSON.parse(JSON.stringify(
    expandFills(model.fills.POINT4)
  ))
)

function encodeColorsValue (colors) {
  if (Array.isArray(colors)) return `[${colors.map(({ color, count }) => `${color}*${count}`).join(',')}]`
  if (typeof colors === 'string') return colors
}

function encodeModel (model) {
  const colorPart = `COLORS=${Object.entries(model.colors).map(([name, value]) => `${name}:${encodeColorsValue(value)}`).join(';')}`
  const warpPart = `WARP=${model.warp}`
  const weftPart = `WEFT=${model.weft}`
  const shafts = model.tieUp.reduce((acc, row) => Math.max(acc, row.length), 0)
  const tieUpPart = `TIE-UP=${
    model.tieUp
      .map(row => row.concat(Array(shafts - row.length).fill(0)))
      .map(row => `0b${BigInt(`0b${row.join('')}`).toString(2)
  }`).join(';')}`
  const constantsPart = `CONSTANTS=${['treadles', 'shafts', 'scale'].map(key => `${key}:${model[key]}`).join(';')}`
  return [colorPart, warpPart, weftPart, tieUpPart, constantsPart].join('___')
}

function decodeColorsValue (colors) {
  if (colors.charAt(0) === '[') {
    return colors.slice(1, colors.length - 1).split(',').map(stripe => {
      const [color, count] = stripe.split('*')
      return { color, count: +count }
    })
  } else return colors
}

function decodeModel (string) {
  const obj = {}
  string.split('___').forEach(part => {
    const [label, data] = part.split('=')
    switch (label.toUpperCase()) {
      case 'COLORS':
        obj.colors = Object.fromEntries(data.split(';')
          .map(namevalue => {
            const [name, value] = namevalue.split(/:(.*)/)
            return [name, decodeColorsValue(value)]
          }))
        break
      case 'WARP':
        obj.warp = data
        break
      case 'WEFT':
        obj.weft = data
        break
      case 'TIE-UP': {
        obj.tieUp = data.split(';')
          .map(row => BigInt(row).toString(2).split('').map(n => +n))
        break
      }
      case 'CONSTANTS':
        data.split(';').forEach(namevalue => {
          const [name, value] = namevalue.split(':')
          obj[name] = +value
        })
        break
    }
  })
  obj.tieUp = obj.tieUp.map(row => Array(obj.treadles - row.length).fill(0).concat(row))
  return obj
}

function setFromHash () {
  if (document.location.hash) {
    try {
      const hash = decodeModel(document.location.hash.substring(1))
      Object.assign(model, hash)
    } catch (err) {
      console.error(err)
    }
  }
}
setFromHash()
window.addEventListener('hashchange', setFromHash)
