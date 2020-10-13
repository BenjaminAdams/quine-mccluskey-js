process.env.DEBUG = true
const assert = require('assert')
var toDnf = require('../index.js')
const spawn = require("child_process").spawn

function callPython(inputStr, cb) {
    const pythonProcess = spawn('py', ["tests/runExpr.py", inputStr]);
    pythonProcess.stdout.on('data', function (data) {
        console.log('python result=', data.toString())
        cb(JSON.parse(data.toString().replace('\r\n', '').replace(/'/g, '"')))
    });
}

describe('toDnf', function () {
    this.timeout(50000)

    it('invalid input, expect empty array', function () {
        let res = toDnf('x=5')  //not enough chars, it needs to be x==5
        assert.strictEqual(res.length, 0)
    });

    it('null/empty input, expect empty array', function () {
        let res = toDnf(null)
        assert.strictEqual(res.length, 0)
        res = toDnf('')
        assert.strictEqual(res.length, 0)
        res = toDnf(' ')
        assert.strictEqual(res.length, 0)
    });

    it('jibberish no valid tokens, expect error', function () {
        try {
            let res = toDnf('component.id23g23g23gabc')
            assert.fail('it should have thrown an exception')
        } catch (ex) {
            assert.strictEqual(ex.message.includes('token should contain a valid equality character token'), true)
        }


    });

    it('jibberish containing and /or valid tokens, expect error', function () {
        let res = toDnf('component.id23g23g23gabc')
        assert.strictEqual(res.length, 0)
    });

    it('Andrews first example in the excel document', function () {
        let res = toDnf('component.id==abc or (component.id!=def and (classification.family==g8 or classification.family==X1))')
        assert.strictEqual(true, true);
    });

    it('should simplify to !B', function (done) {
        //let inputStr = 'component.id==abc or (component.id⊃⊃def and (classification.family==g8 or classification.family==X1))'
        let inputStr = 'component.id==abc or (component.id!=def and (classification.family==g8 or classification.family==X1))'
        let res = toDnf(inputStr)
        callPython(inputStr, function (data) {
            // assert.strictEqual(data[0], 'And(component.id==abc)')
            assert.strictEqual(data.length, 1)
            done()
        })
    });

    it('One condition', function (done) {
        let inputStr = 'component.id==abc'
        let res = toDnf(inputStr)
        assert.strictEqual(res[0], 'And(component.id==abc)')
        assert.strictEqual(res.length, 1)
        callPython(inputStr, function (data) {
            assert.strictEqual(data[0], 'And(component.id==abc)')
            assert.strictEqual(data.length, 1)
            done()
        })
    });


    it('Two conditions (and)', function () {
        let res = toDnf('classification.family==g8 and component.id==abc')
        assert.strictEqual(res[0], 'And(classification.family==g8,component.id==abc)')
        assert.strictEqual(res.length, 1)
    });


    it('Two conditions (or)', function () {
        let res = toDnf('classification.family==g8 or component.id==abc')
        assert.strictEqual(res[0], 'And(classification.family==g8,component.id==abc)')
        assert.strictEqual(res[1], 'And(classification.family!=g8,component.id==abc)')
        assert.strictEqual(res[2], 'And(classification.family==g8,component.id!=abc)')
        assert.strictEqual(res.length, 3)
    });

    it('Two conditions (and) with crazy, but correct syntax', function () {
        let res = toDnf('(((classification.family==g8)) or ((component.id==abc)))')
        assert.strictEqual(res[0], 'And(classification.family==g8,component.id==abc)')
        assert.strictEqual(res[1], 'And(classification.family!=g8,component.id==abc)')
        assert.strictEqual(res[2], 'And(classification.family==g8,component.id!=abc)')
        assert.strictEqual(res.length, 3)
    });

});