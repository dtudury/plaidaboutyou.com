import { proxy } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'

export const unproxy = p => JSON.parse(JSON.stringify(p))

export function saveModel () {
  document.location.hash = encodeModel(model)
}

export const model = window.model = proxy({
  vars: {
    R: decodeString('0x773300'),
    B: decodeString('0x331100'),
    W: decodeString('0xffddaa'),
    GLEN: decodeString('[[B*8,W*8]*4,[B*4,R*4]*8]'),
    POINTADV: decodeString('[1,2,3,4,3,2,1]+1*4')
  },
  warp: 'GLEN',
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

console.log(expandValue(model.vars.POINTADV))

export function expandValue (inValue, dictionary, offset = 0, direction = 1, offsetMap = new Map(), indent = '') {
  // console.log(indent, 'expanding', JSON.stringify(inValue), typeof inValue)
  let outValue
  if (!inValue) throw new Error('no value')
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
      offsetMap.set(inValue, currentOffset + arrayDirection * offsetStep)
    }
    outValue = outValue.flat()
  } else if (typeof inValue === 'number') outValue = inValue + offset
  else if (typeof inValue === 'string' && inValue.startsWith('0x')) outValue = [inValue]
  else outValue = expandValue(dictionary[inValue], dictionary, offset, direction, offsetMap, indent + '  ')
  // console.log(indent, 'expanded to', outValue)
  return outValue
}

export function encodeValue (value) {
  if (Array.isArray(value)) return `[${value.map(encodeValue).join(',')}]`
  if (typeof value === 'object') {
    const minusSign = value.reverse ? '-' : ''
    const encodedValue = encodeValue(value.value)
    const offetSize = value.offset ? (value.offset > 0 ? `+${value.offset}` : value.offset) : ''
    const timesHowMany = value.count > 1 ? `*${value.count}` : ''
    return `${minusSign}${encodedValue}${offetSize}${timesHowMany}`
  }
  return value
}

function encodeModel (model) {
  const varsPart = `VARS=${Object.entries(model.vars).map(([name, value]) => `${name}:${encodeValue(value)}`).join(';')}`
  const warpPart = `WARP=${encodeValue(model.warp)}`
  const weftPart = `WEFT=${encodeValue(model.weft)}`
  const shafts = model.tieUp.reduce((acc, row) => Math.max(acc, row.length), 0)
  const tieUpPart = `TIE-UP=${
    model.tieUp
      .map(row => row.concat(Array(shafts - row.length).fill(0)))
      .map(row => `0b${BigInt(`0b${row.join('')}`).toString(2)
  }`).join(';')}`
  const constantsPart = `CONSTANTS=${['treadles', 'shafts', 'scale'].map(key => `${key}:${model[key]}`).join(';')}`
  return [varsPart, warpPart, weftPart, tieUpPart, constantsPart].join('___')
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
      case 'VARS':
        obj.vars = Object.fromEntries(data.split(';')
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
