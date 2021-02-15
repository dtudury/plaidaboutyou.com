import { proxy } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'

export const unproxy = p => JSON.parse(JSON.stringify(p))

export function saveModel () {
  document.location.hash = encodeModel(model)
}

export function expandValue (inValue, dictionary, offset = 0, direction = 1, offsetMap = new Map(), indent = '') {
  // console.log(indent, 'expanding', JSON.stringify(inValue), typeof inValue)
  let outValue
  if (!inValue) throw new Error('no colors')
  if (Array.isArray(inValue)) {
    outValue = []
    inValue.forEach(v => {
      if (direction === 1) {
        outValue.push(expandValue(v, dictionary, offset, direction, offsetMap, indent + '  '))
      } else {
        outValue.unshift(expandValue(v, dictionary, offset, direction, offsetMap, indent + '  '))
      }
    })
    outValue = outValue.flat()
  } else if (typeof inValue === 'object') {
    const count = inValue.count
    const arrayDirection = inValue.reverse ? -direction : direction
    const offsetStep = inValue.offset
    inValue = inValue.value
    outValue = []
    for (let i = 0; i < count; ++i) {
      const currentOffset = offsetMap.get(inValue) || 0
      outValue.push(expandValue(inValue, dictionary, offset + currentOffset, arrayDirection, offsetMap, indent + '  '))
      offsetMap.set(inValue, currentOffset + direction * offsetStep)
    }
    outValue = outValue.flat()
  } else if (typeof inValue === 'number') outValue = inValue + offset * direction
  else if (typeof inValue === 'string' && inValue.startsWith('0x')) outValue = [inValue]
  else outValue = expandValue(dictionary[inValue], dictionary, offset, direction, offsetMap, indent + '  ')
  // console.log(indent, 'expanded to', outValue)
  return outValue
}

export const model = window.model = proxy({
  colors: {
    B: { value: '0x000000', count: 1 },
    W: { value: '0xffffff', count: 1 },
    GLEN: {
      value: [
        {
          value: [
            { value: 'B', count: 8 },
            { value: 'W', count: 8 }
          ],
          count: 4
        },
        {
          value: [
            { value: 'B', count: 4 },
            { value: 'W', count: 4 }
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
  warp: { value: 'GLEN', count: 1 },
  weft: { value: 'GLEN', count: 1 },
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

/*
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
*/

export function encodeValue (value) {
  if (Array.isArray(value)) return `[${value.map(encodeValue).join(',')}]`
  if (typeof value === 'object') {
    const minusSign = value.reverse ? '-' : ''
    const encodedValue = encodeValue(value.value)
    const offetSize = value.offset ? (value.offset > 0 ? `+${value.offset}` : value.offset) : ''
    const timesHowMany = value.count > 1 ? `*${value.count}` : ''
    return `${minusSign}${encodedValue}${offetSize}${timesHowMany}`
  }
  if (typeof value === 'string') return value
}

function encodeModel (model) {
  const colorPart = `COLORS=${Object.entries(model.colors).map(([name, value]) => `${name}:${encodeValue(value)}`).join(';')}`
  const warpPart = `WARP=${encodeValue(model.warp)}`
  const weftPart = `WEFT=${encodeValue(model.weft)}`
  const shafts = model.tieUp.reduce((acc, row) => Math.max(acc, row.length), 0)
  const tieUpPart = `TIE-UP=${
    model.tieUp
      .map(row => row.concat(Array(shafts - row.length).fill(0)))
      .map(row => `0b${BigInt(`0b${row.join('')}`).toString(2)
  }`).join(';')}`
  const constantsPart = `CONSTANTS=${['treadles', 'shafts', 'scale'].map(key => `${key}:${model[key]}`).join(';')}`
  return [colorPart, warpPart, weftPart, tieUpPart, constantsPart].join('___')
}

export function decodeString (string) {
  let i = 0
  return readNode()
  function readArray () {
    const array = []
    ++i
    while (string.charAt(i) !== ']') {
      array.push(readNode())
      if (string.charAt(i) === ',') {
        ++i
      }
    }
    ++i
    // console.log('read array', JSON.stringify(array), i, string)
    return array
  }
  function readInt () {
    let numberPart = ''
    while (string.charAt(i).match(/\d/)) {
      numberPart += string.charAt(i)
      ++i
    }
    // console.log('read int', numberPart, i, string)
    return parseInt(numberPart)
  }
  function readNode () {
    const node = { value: '', count: 1 }
    while (!string.charAt(i).match(/[,\]]/) && i < string.length) {
      switch (string.charAt(i)) {
        case '[':
          node.value = readArray()
          break
        case '*': {
          ++i
          node.count = readInt()
          break
        }
        case '+':
          ++i
          node.offset = readInt()
          break
        case '-': {
          ++i
          const offset = readInt()
          if (offset) {
            node.offset = -offset
          } else {
            node.reverse = true
          }
          break
        }
        default:
          while (!string.charAt(i).match(/[-+*,\]]/) && i < string.length) {
            node.value += string.charAt(i)
            ++i
          }
          if (node.value.match(/^[-\d]*$/)) node.value = +node.value
      }
    }
    // console.log('read node', JSON.stringify(node), i, string)
    return node
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
            return [name, decodeString(value)]
          }))
        break
      case 'WARP':
        obj.warp = decodeString(data)
        break
      case 'WEFT':
        obj.weft = decodeString(data)
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
