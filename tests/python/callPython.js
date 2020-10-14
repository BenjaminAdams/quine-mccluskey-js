const spawn = require("child_process").spawn
const { promises } = require('fs');

async function callPython(inputStr) {
    const pythonProcess = spawn('py', ["tests/python/runExpr.py", inputStr]);
    return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('data', function (data) {
            console.log('python result=', data.toString())
            resolve(JSON.parse(data.toString().replace('\r\n', '').replace(/'/g, '"')))
        });

        pythonProcess.stderr.on('data', function (data) {
            console.log('python result=', data.toString())
            reject(data.toString())
        });


    });
}

module.exports = callPython