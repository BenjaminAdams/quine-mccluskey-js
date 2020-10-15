const spawn = require("child_process").spawn
const { promises } = require('fs');

async function callPython(inputStr) {
    const pythonProcess = spawn('py', ["tests/python/runExpr.py", inputStr]);
    return new Promise((resolve, reject) => {

        pythonProcess.stdout.on('data', function (data) {
            console.log('python result=', data.toString())
            resolve(JSON.parse(data.toString()
                .replace('\r\n', '')
                .replace(/\u2283/g, '⊃')
                .replace(/'/g, '"')))
        });

        pythonProcess.stderr.on('data', function (data) {
            console.log('python result=', data.toString())
            reject(data.toString())
        });

        pythonProcess.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
        });

        pythonProcess.on('message', (msg) => {
            console.log('Message from child', msg);
        });

    });
}

module.exports = callPython