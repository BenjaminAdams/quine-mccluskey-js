const spawn = require("child_process").spawn

async function callPython(inputStr) {
    try {
        const pythonProcess = spawn('py', ["tests/python/runExpr.py", inputStr]);
        return new Promise((resolve, reject) => {

            pythonProcess.stdout.on('data', function (data) {
                try {
                    resolve(JSON.parse(data.toString()
                        .replace('\r\n', '')
                        .replace(/\u2283/g, '⊃')
                        .replace(/'/g, '"')))
                } catch (ex) {
                    reject(ex)
                }

            });

            pythonProcess.stderr.on('data', function (data) {
                // console.error('python result=', data.toString())
                reject(data.toString())
            });

            // pythonProcess.on('exit', function (code, signal) {
            //     console.log('child process exited with ' +
            //         `code ${code} and signal ${signal}`);
            // });

        });
    } catch (ex) {
        return ex.message
    }
}

module.exports = callPython