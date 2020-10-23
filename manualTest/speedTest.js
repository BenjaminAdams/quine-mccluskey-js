const fs = require('fs');
const callPython = require('../tests/python/callPython.js')
const toDnf = require('../index.js')


async function speedTest() {
    let inputStr = 'yyy==yyy'

    for (let i = 1; i < 200; i++) {
        inputStr += getNextVariable(i)

        let start = Date.now()
        // let res = await callPython(inputStr)
        let res = toDnf(inputStr)
        console.log(`${i + 1} variables took ${Date.now() - start}ms`)

    }
}

function getNextVariable(i) {
    // return ` and ${i}xx==${i}xx`
    return ` or ${i}xx==${i}xx`

    let andOr = 'and'
    let eq = '=='
    if (rnd(1) === 0) {
        andOr = 'or'
    }

    switch (rnd(3)) {
        case 0: eq = '!='
            break;
        case 1: eq = '⊃⊃';
            break;
        case 2: eq = '!⊃';
    }
    return ` ${andOr} ${i}xx${eq}${i}xx`
}

function rnd(max) {
    return Math.floor(Math.random() * max)
}
setTimeout(async function () {
    await speedTest()
}, 0)