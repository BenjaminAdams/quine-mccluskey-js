const spawn = require("child_process").spawn

async function callPython(inputStr) {
    const pythonProcess = spawn('py', ["tests/python/runExpr.py", inputStr]);
    return new Promise((resolve, reject) => {

        pythonProcess.stdout.on('data', function (data) {
            // console.log('python result=', data.toString())
            resolve(JSON.parse(data.toString()
                .replace('\r\n', '')
                .replace(/\u2283/g, '⊃')
                .replace(/'/g, '"')))
        });

        pythonProcess.stderr.on('data', function (data) {
            console.error('python result=', data.toString())
            reject(data.toString())
        });

        // pythonProcess.on('exit', function (code, signal) {
        //     console.log('child process exited with ' +
        //         `code ${code} and signal ${signal}`);
        // });

    });
}

module.exports = callPython