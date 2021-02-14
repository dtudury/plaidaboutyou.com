import { proxy } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'

export const unproxy = p => JSON.parse(JSON.stringify(p))

export function saveModel () {
  document.location.hash = encodeModel(model)
}

export function expandColors (colors) {
  if (!colors) throw new Error('no colors')
  if (Array.isArray(colors)) return colors.map(expandColors).flat()
  if (typeof colors === 'object') {
    let { color, count } = colors
    if (typeof color === 'string') {
      color = expandColors(color)
    }
    return Array(count).fill(expandColors(color)).flat(2)
  }
  if (typeof colors === 'string' && colors.startsWith('0x')) return [colors]
  return expandColors(model.colors[colors])
}

export const model = window.model = proxy({
  colors: {
    B: { color: '0x000000', count: 1 },
    W: { color: '0xffffff', count: 1 },
    GLEN: {
      color: [
        {
          color: [
            { color: 'B', count: 8 },
            { color: 'W', count: 8 }
          ],
          count: 4
        },
        {
          color: [
            { color: 'B', count: 4 },
            { color: 'W', count: 4 }
          ],
          count: 8
        }
      ],
      count: 1
    }
  },
  patterns: {
    N: [1],
    REL: [
      { name: 'N', offset: 1 }
    ],
    ABS: [1, 2, 3, 4],
    TEST: [
      { name: 'REL', count: 3 },
      { name: 'REL', count: 3, direction: -1 },
      { name: 'ABS' },
      { name: 'ABS', offset: 10, count: 2, direction: -1 }
    ]
  },
  warp: { color: 'GLEN', count: 1 },
  weft: { color: 'GLEN', count: 1 },
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

/*
function encodePatternsValue (patterns) {
  return `[${patterns.map(pattern => {
    if (typeof pattern === 'number') return pattern
    let encoded = ''
    if (pattern.direction === -1) encoded += '-'
    encoded += pattern.name
    if (pattern.offset > 0) encoded += `+${pattern.offset}`
    if (pattern.offset < 0) encoded += pattern.offset
    if (pattern.count > 1) encoded += `*${pattern.count}`
    return encoded
  }).join(',')}]`
}
Object.entries(model.patterns).forEach(([name, value]) => console.log(name, encodePatternsValue(value)))
*/

function expandPatterns (patterns, offset = 0, direction = 1, patternOffsets = {}, indent = '') {
  if (typeof patterns === 'number') {
    console.error('patterns is a number?!')
    throw new Error('patterns should be arrays')
  }
  const expanded = []
  if (direction === -1) {
    patterns = patterns.slice().reverse()
  }
  patterns.forEach(pattern => {
    if (typeof pattern === 'number') {
      expanded.push(pattern + offset)
    } else {
      const name = pattern.name
      const patternDirection = direction * (pattern.direction ?? 1)
      for (let i = 0; i < (pattern.count ?? 1); ++i) {
        patternOffsets[name] = patternOffsets[name] ?? 0
        const subPattern = expandPatterns(model.patterns[name], offset + patternOffsets[name], patternDirection, patternOffsets, indent + '  ')
        patternOffsets[name] += (pattern.offset ?? 0) * patternDirection
        expanded.push(subPattern)
      }
    }
  })
  return expanded.flat()
}

console.log(
  JSON.parse(JSON.stringify(
    expandPatterns(model.patterns.TEST)
  ))
)

function encodeColorsValue (colors) {
  if (Array.isArray(colors)) return `[${colors.map(encodeColorsValue).join(',')}]`
  if (typeof colors === 'object') return `${encodeColorsValue(colors.color)}${colors.count > 1 ? `*${colors.count}` : ''}`
  if (typeof colors === 'string') return colors
}

function encodeModel (model) {
  const colorPart = `COLORS=${Object.entries(model.colors).map(([name, value]) => `${name}:${encodeColorsValue(value)}`).join(';')}`
  const warpPart = `WARP=${encodeColorsValue(model.warp)}`
  const weftPart = `WEFT=${encodeColorsValue(model.weft)}`
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
  let i = 0
  return readColor()
  function readArray () {
    const array = []
    ++i
    while (colors.charAt(i) !== ']') {
      array.push(readColor())
      if (colors.charAt(i) === ',') {
        ++i
      }
    }
    ++i
    return array
  }
  function readColor () {
    const color = { color: '', count: 1 }
    if (colors.charAt(i) === '[') {
      color.color = readArray()
    } else {
      while (!colors.charAt(i).match(/[*,\]]/) && i < colors.length) {
        color.color += colors.charAt(i)
        ++i
      }
    }
    if (colors.charAt(i) === '*') {
      ++i
      let numString = ''
      while (!colors.charAt(i).match(/[,\]]/) && i < colors.length) {
        numString += colors.charAt(i)
        ++i
      }
      color.count = +numString
    }
    return color
  }
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
        obj.warp = decodeColorsValue(data)
        break
      case 'WEFT':
        obj.weft = decodeColorsValue(data)
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
