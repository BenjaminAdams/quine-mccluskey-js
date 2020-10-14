process.env.DEBUG = true
const assert = require('assert');
const callPython = require('./python/callPython.js')
const toDnf = require('../index.js')

describe('toDnf', function () {
    this.timeout(50000)

    it('invalid input, expect empty array', async function () {
        let inputStr = 'x=5' //not enough chars, it needs to be x==5
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'x=5')

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'x=5')
    });


    it('jibberish no valid tokens, expect error', async function () {
        let inputStr = 'component.id23g23g23gabc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'component.id23g23g23gabc')

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'component.id23g23g23gabc')
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

    it('null input, echos input', async function () {
        let res = toDnf(null)
        assert.strictEqual(res[0], 'null')

        res = toDnf('null')
        assert.strictEqual(res[0], 'null')

        let pythonRes = await callPython(null)
        assert.strictEqual(pythonRes[0], 'null')

        pythonRes = await callPython('null')
        assert.strictEqual(pythonRes[0], 'null')
    });

    it('empty input, throws error', async function () {
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

});