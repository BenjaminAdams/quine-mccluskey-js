process.env.DEBUG = true
const fs = require('fs');
const callPython = require('../tests/python/callPython.js')
const toDnf = require('../index.js')

//db.getCollection('adjustmentsDetails').find({},{"tierAdjustments.conditionExpression": 1, "_id":0}).toArray()

async function run() {

    let allUniqueValuesFromDevDb = require('./mongo-dev-db.json')
    let filename = `./manualTest/problems-${Date.now()}.json`

    for (let i = 0; i < allUniqueValuesFromDevDb.length; i++) {
        console.log(i)
        let inputStr = allUniqueValuesFromDevDb[i]
        let startDnf = Date.now()
        let toDnfRes = toDnf(inputStr)
        let dnfMs = Date.now() - startDnf
        let startPython = Date.now()
        let pythonRes = await callPython(inputStr)
        let pythonMs = Date.now() - startPython
        console.log(`dnf ms=${dnfMs} Result=${JSON.stringify(toDnfRes)}`)
        console.log(`py  ms=${pythonMs} Result=${JSON.stringify(pythonRes)}`)

        let errorStr = `inputStr: ${inputStr} generated non-matching results. toDnfRes=${toDnfRes} pythnRes=${pythonRes}`

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
    fs.writeFileSync(filename, JSON.stringify(data, null, 2) + "\r\n", {
        //flag: refresh ? "w" : "a+",
        flag: 'a+'
    });
}

