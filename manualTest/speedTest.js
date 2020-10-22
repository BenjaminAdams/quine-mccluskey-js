const fs = require('fs');
const callPython = require('../tests/python/callPython.js')
const toDnf = require('../index.js')

let inputStr = ''

for (let i = 0; i < 50; i++) {
    inputStr += ` ${i}xx==${i}xx and`
    let startDnf = Date.now()
    toDnf(inputStr)
    console.log(`${i + 1} variables took ${Date.now() - startDnf}ms`)
}