process.env.DEBUG = true
const assert = require('assert');
const { promises } = require('fs');
var toDnf = require('../index.js')
const spawn = require("child_process").spawn

async function callPython(inputStr) {
    const pythonProcess = spawn('py', ["tests/runExpr.py", inputStr]);
    return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('data', function (data) {
            console.log('python result=', data.toString())
            resolve(JSON.parse(data.toString().replace('\r\n', '').replace(/'/g, '"')))
        });

        pythonProcess.stderr.on('error', function (data) {
            console.log('python result=', data.toString())
            reject(data.toString())
        });
        pythonProcess.stderr.on('data', function (data) {
            console.log('python result=', data.toString())
            reject(data.toString())
        });

        pythonProcess.on('error', function (data) {
            console.log('python result=', data.toString())
            reject(data.toString())
        });
    });
}

describe('toDnf', function () {
    this.timeout(50000)

    it('invalid input, expect empty array', function () {
        let res = toDnf('x=5')  //not enough chars, it needs to be x==5
        assert.strictEqual(res.length, 0)
    });

    it('null/empty input, expect empty array', async function () {
        let res = toDnf(null)
        assert.strictEqual(res[0], 'null')
        try {
            res = toDnf('')
            assert.fail('it should have thrown an exception')
        } catch (ex) {

        }
        try {
            res = toDnf(' ')
            assert.fail('it should have thrown an exception')
        } catch (ex) {

        }

        res = await callPython(null)
        assert.strictEqual(res[0], 'null')

        try {
            res = await callPython('')
            assert.fail('it should have thrown an exception')
        } catch (ex) {

        }

        try {
            res = await callPython(' ')
            assert.fail('it should have thrown an exception')
        } catch (ex) {

        }
    });

    it('jibberish no valid tokens, expect error', async function () {
        let inputStr = 'component.id23g23g23gabc'
        let res = toDnf(inputStr)
        res = await callPython(inputStr)
        assert.strictEqual(res[0], 'component.id23g23g23gabc')
    });

    it('jibberish containing and /or valid tokens, expect error', async function () {
        let inputStr = 'component.id23g23g23gabc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'component.id23g23g23gabc')

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'component.id23g23g23gabc')
    });

    it('Andrews first example in the excel document', async function () {
        let inputStr = 'component.id==abc or (component.id!=def and (classification.family==g8 or classification.family==X1))'
        let res = toDnf(inputStr)
        assert.strictEqual(true, true);

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'component.id==abc')
        assert.strictEqual(pythonRes[1], 'And(component.id!=def, classification.family==X1)')
        assert.strictEqual(pythonRes[2], 'And(component.id!=def, classification.family==g8)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('should simplify to !B', async function () {
        //let inputStr = 'component.id==abc or (component.id⊃⊃def and (classification.family==g8 or classification.family==X1))'
        let inputStr = 'component.id==abc or (component.id!=def and (classification.family==g8 or classification.family==X1))'
        let res = toDnf(inputStr)
        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'component.id==abc')
        assert.strictEqual(pythonRes[1], 'And(component.id!=def, classification.family==X1)')
        assert.strictEqual(pythonRes[2], 'And(component.id!=def, classification.family==g8)')
        assert.strictEqual(pythonRes.length, 3)
    });

    it('One condition', async function () {
        let inputStr = 'component.id==abc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'component.id==abc')
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'component.id==abc')
        assert.strictEqual(pythonRes.length, 1)
    });


    it('Two conditions (and)', async function () {
        let inputStr = 'classification.family==g8 and component.id==abc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)

    });


    it('Two conditions (or)', async function () {
        let inputStr = 'classification.family==g8 or component.id==abc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(res[1], 'And(classification.family!=g8, component.id==abc)')
        assert.strictEqual(res[2], 'And(classification.family==g8, component.id!=abc)')
        assert.strictEqual(res.length, 3)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Two conditions (and) with crazy, but correct syntax', async function () {
        let inputStr = '(((classification.family==g8)) or ((component.id==abc)))'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(res[1], 'And(classification.family!=g8, component.id==abc)')
        assert.strictEqual(res[2], 'And(classification.family==g8, component.id!=abc)')
        assert.strictEqual(res.length, 3)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'And(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

});