process.env.DEBUG = true
var os = require('os');
const fs = require('fs');
const callPython = require('../tests/python/callPython.js')
const toDnf = require('../index.js')

//db.getCollection('adjustmentsDetails').find({},{"tierAdjustments.conditionExpression": 1, "_id":0}).toArray()

async function run() {

    let allUniqueValuesFromDevDb = require('./mongo-dev-db.json')
    let filename = `./manualTest/problems-${Date.now()}.txt`

    for (let i = 0; i < allUniqueValuesFromDevDb.length; i++) {
        console.log(`${i}/${allUniqueValuesFromDevDb.length}`)
        let inputStr = allUniqueValuesFromDevDb[i]
        let startDnf = Date.now()
        let toDnfRes = toDnf(inputStr)
        let dnfMs = Date.now() - startDnf
        let startPython = Date.now()
        let pythonRes = await callPython(inputStr)
        let pythonMs = Date.now() - startPython
        console.log(`dnf ms=${dnfMs} Result=${JSON.stringify(toDnfRes)}`)
        console.log(`py  ms=${pythonMs} Result=${JSON.stringify(pythonRes)}`)

        let errorStr = `inputStr: ${inputStr}${os.EOL}toDnfRes=${toDnfRes}${os.EOL}pythonRes=${pythonRes}${os.EOL}${os.EOL}`

        if (pythonRes.length !== toDnfRes.length) {
            writeProblem(filename, errorStr)
            continue;
        }

        for (let x = 0; x < toDnfRes.length; x++) {
            if (!pythonRes.includes(toDnfRes[x])) {
                writeProblem(filename, errorStr)
                break;
            }
        }
    }
}


setTimeout(async function () {
    await run()
}, 1)

function writeProblem(filename, data) {
    console.error(data)
    fs.writeFileSync(filename, data + "\r\n", {
        flag: 'a+'
    });
}

