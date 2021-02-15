import { h, mapEntries, render } from './horseless.0.5.1.min.esm.js' // '/unpkg/horseless/horseless.js'
import { decodeString, encodeValue, expandValue } from './model.js'

function testDecoding (inputString, expected) {
  const decodedString = JSON.stringify(decodeString(inputString))
  const expectedString = JSON.stringify(expected)
  console.log('=== decoding')
  console.log('input:', inputString)
  console.log('pass:', decodedString === expectedString)
  console.log('actual:', decodedString)
  console.log('expected:', expectedString)
  return { pass: decodedString === expectedString, title: 'decoding from ' + inputString, expected: decodedString, actual: expectedString }
}

function testEncoding (inputValue, expected) {
  const encodedValue = encodeValue(inputValue)
  console.log('=== encoding')
  console.log('input:', inputValue)
  console.log('pass:', encodedValue === expected)
  console.log('actual:', encodedValue)
  console.log('expected:', expected)
  return { pass: encodedValue === expected, title: 'encoding to ' + expected, expected, actual: encodedValue }
}

function testExpansion (inputValue, expected, dictionary) {
  console.log(inputValue)
  const expectedString = JSON.stringify(expected)
  const expandedString = JSON.stringify(expandValue(inputValue, dictionary))
  console.log(expandedString)
  return {
    pass: expectedString === expandedString,
    title: 'expanding ' + JSON.stringify(inputValue),
    expected: expectedString,
    actual: expandedString
  }
}

const goodEncoded = '-[a,-b+23*456,cd,e-7]*8'
const goodDecoded = {
  value: [
    { value: 'a', count: 1 },
    { value: 'b', count: 456, reverse: true, offset: 23 },
    { value: 'cd', count: 1 },
    { value: 'e', count: 1, offset: -7 }
  ],
  count: 8,
  reverse: true
}
const pointAdvancingEncoded = '[1,2,3]+2*3'
const pointAdvancingDecoded = {
  value: [
    { value: 1, count: 1 },
    { value: 2, count: 1 },
    { value: 3, count: 1 }
  ],
  count: 3,
  offset: 2
}
const tests = [
  testDecoding(goodEncoded, goodDecoded),
  testEncoding(goodDecoded, goodEncoded),
  testDecoding(pointAdvancingEncoded, pointAdvancingDecoded),
  testEncoding(pointAdvancingDecoded, pointAdvancingEncoded),
  testExpansion(
    'A',
    [1, 2, 3, 4],
    {
      A: [1, 2, 3, 4]
    }
  ),
  testExpansion(
    'A',
    [1, 2, 3, 1, 2, 3, 1, 2, 3],
    {
      A: decodeString('[1,2,3]*3')
    }
  ),
  testExpansion(
    'A',
    [1, 2, 3],
    {
      A: decodeString('[1]+1*3')
    }
  ),
  testExpansion(
    'A',
    [3, 2, 1],
    {
      A: decodeString('-[1,2,3]')
    }
  ),
  testExpansion(
    'A',
    [1, 2, 3, 2, 3, 4, 5, 4, 5, 6, 7, 6],
    {
      N: 1,
      A: decodeString('[N+1*2,N-1*2]+2*3')
    }
  ),
  testExpansion(
    'A',
    [100, 200, 300, 101, 201, 301, 302, 202, 102, 301, 201, 101],
    {
      N: [100, 200, 300],
      A: decodeString('[N+1*2,-N+1*2]')
    }
  )
]

const testResultRenderer = ({ pass, title, expected, actual }) => {
  console.log('test result', pass)
  if (pass) {
    return h`
      <span style="color: green;">PASS</span>
      <br>
      title: ${title}
      <br>
      result: ${expected}
      <br>
      <br>
    `
  } else {
    return h`
      <span style="color: red;">FAIL</span>
      <br>
      title: ${title}
      <br>
      expected: ${expected}
      <br>
      actual: ${actual}
      <br>
      <br>
    `
  }
}

render(document.body, h`
  ${mapEntries(tests, testResultRenderer)}
`)
