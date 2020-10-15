process.env.DEBUG = true
const assert = require('assert');
const callPython = require('./python/callPython.js')
const toDnf = require('../index.js')

//("a+(b'(c+d))") 
//a OR ( !b AND (c OR d))

describe('toDnf', function () {
    this.timeout(50000)

    it('invalid input, echos input', async function () {
        let inputStr = 'x=5' //not enough chars, it needs to be x==5
        let res = toDnf(inputStr)
        assert.ok(res.includes('x=5'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('x=5'))
        assert.strictEqual(pythonRes.length, 1)
    });


    it('jibberish no valid tokens, expect error', async function () {
        let inputStr = 'component.id23g23g23gabc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.id23g23g23gabc'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('component.id23g23g23gabc'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('jibberish containing and /or valid tokens', async function () {
        let inputStr = 'component.idand3g23gabc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.idand3g23gabc'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('component.idand3g23gabc'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Andrews first example in the excel document', async function () {
        let inputStr = 'component.id==abc or (component.id!=def and (classification.family==g8 or classification.family==X1))'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.id==abc'))
        assert.ok(res.includes('And(component.id!=def, classification.family==X1)'))
        assert.ok(res.includes('And(component.id!=def, classification.family==g8)'))
        assert.strictEqual(res.length, 3)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('component.id==abc'))
        assert.ok(pythonRes.includes('And(component.id!=def, classification.family==X1)'))
        assert.ok(pythonRes.includes('And(component.id!=def, classification.family==g8)'))
        assert.strictEqual(pythonRes.length, 3)
    });

    it('complex valid input with ⊃⊃', async function () {
        let inputStr = 'component.id==abc or (component.id⊃⊃def and (classification.family==g8 or classification.family==X1))'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.id==abc'))
        assert.ok(res.includes('And(component.id⊃⊃def, classification.family==X1)'))
        assert.ok(res.includes('And(component.id⊃⊃def, classification.family==g8)'))
        assert.strictEqual(res.length, 3)

        let pythonRes = await callPython(inputStr)  //even the python code does not simplify it to !B
        assert.ok(pythonRes.includes('component.id==abc'))
        assert.ok(pythonRes.includes('And(component.id⊃⊃def, classification.family==X1)'))
        assert.ok(pythonRes.includes('And(component.id⊃⊃def, classification.family==g8)'))
        assert.strictEqual(pythonRes.length, 3)
    });

    it('One condition', async function () {
        let inputStr = 'component.id==abc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.id==abc'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('component.id==abc'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('expression with ⊃⊃ and !⊃', async function () {
        let inputStr = 'component.id⊃⊃abc and component.id!⊃xxx'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(component.id⊃⊃abc, component.id!⊃xxx)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(component.id⊃⊃abc, component.id!⊃xxx)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Two conditions (and)', async function () {
        let inputStr = 'classification.family==g8 and component.id==abc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(classification.family==g8, component.id==abc)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(classification.family==g8, component.id==abc)'))
        assert.strictEqual(pythonRes.length, 1)

    });


    it('Two conditions (or)', async function () {
        let inputStr = 'classification.family==g8 or component.id==abc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('classification.family==g8'))
        assert.ok(res.includes('component.id==abc'))
        assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('many conditions', async function () {
        let inputStr = 'clly==g8 or comp==abc and asd==123 or fff!=sss and fda⊃⊃ggg or gas!⊃kkf and eee==uuu or jjj!=aaa and ttt⊃⊃sss or kas==kok'
        let res = toDnf(inputStr)
        assert.ok(res.includes('clly==g8'))
        assert.ok(res.includes('kas==kok'))
        assert.ok(res.includes('And(gas!⊃kkf, eee==uuu)'))
        assert.ok(res.includes('And(fff!=sss, fda⊃⊃ggg)'))
        assert.ok(res.includes('And(comp==abc, asd==123)'))
        assert.ok(res.includes('And(jjj!=aaa, ttt⊃⊃sss)'))
        assert.strictEqual(res.length, 6)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('clly==g8'))
        assert.ok(pythonRes.includes('kas==kok'))
        assert.ok(pythonRes.includes('And(gas!⊃kkf, eee==uuu)'))
        assert.ok(pythonRes.includes('And(fff!=sss, fda⊃⊃ggg)'))
        assert.ok(pythonRes.includes('And(comp==abc, asd==123)'))
        assert.ok(pythonRes.includes('And(jjj!=aaa, ttt⊃⊃sss)'))
        assert.strictEqual(pythonRes.length, 6)
    });

    it('Two conditions (and) with crazy, but correct syntax', async function () {
        let inputStr = '(((classification.family==g8)) or ((component.id==abc)))'
        let res = toDnf(inputStr)
        assert.ok(res.includes('component.id==abc'))
        assert.ok(res.includes('classification.family==g8'))
        assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
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
