process.env.DEBUG = true
const assert = require('assert');
const fs = require('fs');
const callPython = require('./python/callPython.js')
const toDnf = require('../index.js')

//("a+(b'(c+d))") 
//a OR ( !b AND (c OR d))



//Component.id==683-23437 and Classification.id==baseitem_apjc_ps9000_48671

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

    it('contains a semicolon, XXX;value==', async function () {
        let inputStr = 'Component.id==487-bbdw and Classification.type==Family;value==14437'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==487-bbdw, Classification.type==Family;value==14437)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==487-bbdw, Classification.type==Family;value==14437)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('contains a semicolon, XXX;value!=', async function () {
        let inputStr = 'Component.id==487-bbdw and Classification.type==Family;value!=14437'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==487-bbdw, Classification.type==Family;value!=14437)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==487-bbdw, Classification.type==Family;value!=14437)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('contains a semicolon, XXX;value⊃⊃', async function () {
        let inputStr = 'Component.id==487-bbdw and Classification.type==Family;value⊃⊃14437'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==487-bbdw, Classification.type==Family;value⊃⊃14437)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==487-bbdw, Classification.type==Family;value⊃⊃14437)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('contains a semicolon, XXX;value⊃⊃', async function () {
        let inputStr = 'Component.id==487-bbdw and Classification.type==Family;value⊃⊃14437'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==487-bbdw, Classification.type==Family;value⊃⊃14437)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==487-bbdw, Classification.type==Family;value⊃⊃14437)'))
        assert.strictEqual(pythonRes.length, 1)
    });


    it('when (and) or (or) exist in the variable name or value', async function () {
        let inputStr = 'Compandonent.id==723-bbor and Classiorfication.id==f_1and4641'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Compandonent.id==723-bbor, Classiorfication.id==f_1and4641)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Compandonent.id==723-bbor, Classiorfication.id==f_1and4641)'))
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
        //'a+(b(c+d))'
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


    it('weird spacing/outside parenthesis issue around expr', async function () {
        let inputStr = '( Item.id==fTestBasha )'
        let res = toDnf(inputStr)
        assert.ok(res.includes('Item.id==fTestBasha'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('Item.id==fTestBasha'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('even more weird spacing/outside parenthesis issue around expr', async function () {

        let inputStr = '(( ( Component.id==1013187 and Classification.id ==p4/b1163/713 )) and ((  Item.id==cmlsc9000_v4_emea_1_dssc460enclosure)))'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==1013187, Classification.id ==p4/b1163/713, Item.id==cmlsc9000_v4_emea_1_dssc460enclosure)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==1013187, Classification.id ==p4/b1163/713, Item.id==cmlsc9000_v4_emea_1_dssc460enclosure)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('this simple test fails :( getNormalizedBitLength returns the wrong number, should be 3', async function () {
        //(a'b)(c)
        let inputStr = 'Component.id!=1013187 and Classification.id==555 and Item.id==cmlsc9000_v4_emea_1_dssc460enclosure'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id!=1013187, Classification.id==555, Item.id==cmlsc9000_v4_emea_1_dssc460enclosure)'))
        assert.strictEqual(res.length, 1)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id!=1013187, Classification.id==555, Item.id==cmlsc9000_v4_emea_1_dssc460enclosure)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('getNormalizedBitLength returns the wrong number, should be 3', async function () {
        //(a'b)(c)
        let inputStr = 'xxx!=111 and sss==555 and yyy==222'
        let res = toDnf(inputStr)
        //assert.ok(res.includes('And(xxx!=111, sss==555, yyy==222)'))
        assert.strictEqual(res.length, 1)
        let tmpTestStr = 'xxx!=111 and sss!=555 and yyy==222'
        let res2 = toDnf(tmpTestStr)
        let pythonRes2 = await callPython(tmpTestStr)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(xxx!=111, sss==555, yyy==222)'))
        assert.strictEqual(pythonRes.length, 1)
    });

    it('value contains a /', async function () {
        let inputStr = '(Component.id==gscx3rp or Component.id==ggw894q) and Classification.id==p4/b1220/1516'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==ggw894q, Classification.id==p4/b1220/1516)'))
        assert.ok(res.includes('And(Component.id==gscx3rp, Classification.id==p4/b1220/1516)'))
        assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==ggw894q, Classification.id==p4/b1220/1516)'))
        assert.ok(pythonRes.includes('And(Component.id==gscx3rp, Classification.id==p4/b1220/1516)'))
        assert.strictEqual(pythonRes.length, 2)
    });

    it('same formula as above but without a /', async function () {
        let inputStr = '(Component.id==gscx3rp or Component.id==ggw894q) and Classification.id==555'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(Component.id==ggw894q, Classification.id==555)'))
        assert.ok(res.includes('And(Component.id==gscx3rp, Classification.id==555)'))
        assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(Component.id==ggw894q, Classification.id==555)'))
        assert.ok(pythonRes.includes('And(Component.id==gscx3rp, Classification.id==555)'))
        assert.strictEqual(pythonRes.length, 2)
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

    it('Two (ands) one (or)', async function () {
        let inputStr = '(classification.family==g8 and hhh==555) or component.id==abc'
        let res = toDnf(inputStr)
        assert.ok(res.includes('And(classification.family==g8, hhh==555)'))
        assert.ok(res.includes('component.id==abc'))
        assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        assert.ok(pythonRes.includes('And(classification.family==g8, hhh==555)'))
        assert.ok(pythonRes.includes('component.id==abc'))
        assert.strictEqual(pythonRes.length, 2)
    });

    it('Five (and) conditions', async function () {
        let inputStr = 'xxx==g8 and yyy==abc and ggg==333 and kku==999 and eee==223'
        let res = toDnf(inputStr)
        // assert.ok(res.includes('classification.family==g8'))
        // assert.ok(res.includes('component.id==abc'))
        // assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        // assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Five (or) conditions', async function () {
        let inputStr = 'xxx==g8 or yyy==abc or ggg==333 or kku==999 or eee==223'
        let res = toDnf(inputStr)
        // assert.ok(res.includes('classification.family==g8'))
        // assert.ok(res.includes('component.id==abc'))
        // assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        // assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Ten (and) conditions', async function () {
        let inputStr = 'xxx==g8 and yyy==abc and ggg==333 and kku==999 and eee==223 and lfx==g8 and fyy==abc and fgg==333 and fku==999 and fee==223'
        let res = toDnf(inputStr)
        // assert.ok(res.includes('classification.family==g8'))
        // assert.ok(res.includes('component.id==abc'))
        // assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        // assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
    });

    it('Ten (or) conditions', async function () {
        let inputStr = 'xxx==g8 or yyy==abc or ggg==333 or kku==999 or eee==223 or lfx==g8 or fyy==abc or fgg==333 or fku==999 or fee==223'
        let res = toDnf(inputStr)
        // assert.ok(res.includes('classification.family==g8'))
        // assert.ok(res.includes('component.id==abc'))
        // assert.strictEqual(res.length, 2)

        let pythonRes = await callPython(inputStr)
        // assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
        assert.strictEqual(pythonRes.length, 1)
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


    // it('many conditions', async function () {
    //     let start = Date.now()
    //     let inputStr = 'clly==g8 or comp==abc and asd==123 or fff!=sss and fda⊃⊃ggg or gas!⊃kkf and eee==uuu or jjj!=aaa and ttt⊃⊃sss or kas==kok'
    //     let res = toDnf(inputStr)
    //     console.log(`dnf ms=${Date.now() - start}`)
    //     assert.ok(res.includes('clly==g8'))
    //     assert.ok(res.includes('kas==kok'))
    //     assert.ok(res.includes('And(gas!⊃kkf, eee==uuu)'))
    //     assert.ok(res.includes('And(fff!=sss, fda⊃⊃ggg)'))
    //     assert.ok(res.includes('And(comp==abc, asd==123)'))
    //     assert.ok(res.includes('And(jjj!=aaa, ttt⊃⊃sss)'))
    //     assert.strictEqual(res.length, 6)

    //     start = Date.now()
    //     let pythonRes = await callPython(inputStr)
    //     console.log(`python ms=${Date.now() - start}`)
    //     assert.ok(pythonRes.includes('clly==g8'))
    //     assert.ok(pythonRes.includes('kas==kok'))
    //     assert.ok(pythonRes.includes('And(gas!⊃kkf, eee==uuu)'))
    //     assert.ok(pythonRes.includes('And(fff!=sss, fda⊃⊃ggg)'))
    //     assert.ok(pythonRes.includes('And(comp==abc, asd==123)'))
    //     assert.ok(pythonRes.includes('And(jjj!=aaa, ttt⊃⊃sss)'))
    //     assert.strictEqual(pythonRes.length, 6)
    // });

    // it('very large input', async function () {
    //     let inputStr = '((( Classification.type==brand;value==7 or Classification.type==brand;value==21 or Classification.type==brand;value==1002 or Classification.type==brand;value==1000 or Classification.type==brand;value==1 or Classification.type==brand;value==26 or Classification.type==brand;value==1171 or Classification.type==brand;value==1166 or Classification.type==brand;value==1170 or Classification.type==brand;value==6 or Classification.type==brand;value==1177 ) and ( Item.id!=fndnm2605sso and Item.id!=fddogsk101hw10so and Item.id!=fdcwrp207hw10so and Item.id!=dddngsk105hw10so and Item.id!=dddngsk101hw10so and Item.id!=ddcwgsk101hw10so and Item.id!=dndn3800w7sbso and Item.id!=dddnrp207bw10so and Item.id!=dndot5123bw10so and Item.id!=dndot5130bw10so and Item.id!=fddorp201bw102so and Item.id!=fddorp207hw10so and Item.id!=dddogsk120hw10so and Item.id!=ddcwgsk120hw10so and Item.id!=ddcwgsk121bw10so and Item.id!=fdcwrp207hw10so and Item.id!=fdcwrp207hw10bso and Item.id!=ddcwgsk105hw10so and Item.id!=dddorp217bw10so and Item.id!=dddorp227bw10so and Item.id!=dncwj1938b1so and Item.id!=fndov2380hso and Item.id!=fndov2380hso and Item.id!=dndnu2436hso and Item.id!=dndnw5003hso and Item.id!=dndow5003hso and Item.id!=dndnv2372hso and Item.id!=dndna003hso and Item.id!=dndoa003hso and Item.id!=dndnw5014hso and Item.id!=dndnu2441hso and Item.id!=dddorp207bw10so and Item.id!=ddcwrp207bw10so and Item.id!=dndov2367bw10so and Item.id!=ddcwgs121hw10so and Item.id!=ddcwrp227bw10so and Item.id!=ddcwrp202bw10so and Item.id!=ddcwgs101hw10so and Item.id!=fdcwrp207bw120so and Item.id!=fddorp207bw10so and Item.id!=dddogs101hw10so and Item.id!=dddogs105bw10so and Item.id!=dddogs126bw10so and Item.id!=fddomp708bso and Item.id!=dndnv2367bw10so and Item.id!=fndna002bw10so and Item.id!=dndnw5024bw10so and Item.id!=dndnt5123bw10so and Item.id!=dndnt5103bw10so and Item.id!=dddogs126bw10so and Item.id!=fndov2310bsow10 and Item.id!=fndow5003bw10so and Item.id!=endnr1204sw10so and Item.id!=dndnt5130bw10so and Item.id!=fdcwrp201bw102so and Item.id!=ddcwrp217bw10so and Item.id!=fdcwrp201bw102s0 and Item.id!=fdcwrp201bw103so and Item.id!=ddcwgs105bw106so and Item.id!=fddncp906so and Item.id!=ddcwgs126bw10so and Item.id!=dndnt5122bw10so and Item.id!=fndnv2310bsow10 and Item.id!=endnr1204sw10so and Item.id!=fndnw5003bw10so and Item.id!=dndna003bw10so and Item.id!=fdcwrp207bw10so and Item.id!=ddcwgs105bw10so and Item.id!=fddomp708bso and Item.id!=dddogp102sso and Item.id!=dddogs105bw10so and Item.id!=dddorp220sos and Item.id!=edddogs101bso and Item.id!=fddorp203sso and Item.id!=fddorp203sso and Item.id!=edddogs101bso and Item.id!=dddorp220sos and Item.id!=dddogs105bw10so and Item.id!=dddogp102sso and Item.id!=fddomp708bso and Item.id!=dndot5131bso and Item.id!=ddcwgs121bso and Item.id!=fdcwlp1394sso and Item.id!=fddncp910hso and Item.id!=fncwvamd2811bso and Item.id!=fndow5003bso and Item.id!=fdcwrp207bso and Item.id!=dndna003bso and Item.id!=fndnv2310bsow10 and Item.id!=fdcwrp207bw10so and Item.id!=ddcwgs105bw10so and Item.id!=fdcwrp207sso and Item.id!=ddcwrp207bso and Item.id!=fndovamd2811bso and Item.id!=fndov2310bso and Item.id!=fndnv2310bso and Item.id!=fndnvamd2811bso and Item.id!=dndnu2226bso and Item.id!=fndnv2319bso and Item.id!=fndnw5003bso and Item.id!=dndnu2440bso and Item.id!=dndnj1904bso and Item.id!=dndnt5131bso and Item.id!=dndnq5236bso and Item.id!=fdcwmp705b3dso and Item.id!=fdcwlp2141bso and Item.id!=dndnq5208bso and Item.id!=dndnx1601bso and Item.id!=dndnt5132bso and Item.id!=fdcwrp203sso and Item.id!=dndnx1603bso and Item.id!=dndnu2226bso and Item.id!=fndnv2319bso and Item.id!=fndnw5003bso and Item.id!=dndnu2440bso and Item.id!=dndnj1904bso and Item.id!=dndnt5131bso and Item.id!=dndnq5236bso and Item.id!=dndnq5208bso and Item.id!=dndnx1601bso and Item.id!=dndnt5132bso and Item.id!=dndnx1603bso and Item.id!=fddnlp1394sso and Item.id!=fndnm2612sw7pso and Item.id!=dndnl2516hso and Item.id!=fdcwgs104bso and Item.id!=eddcwgs101bso and Item.id!=ddcwgs211bso and Item.id!=fdcwmp708bso and Item.id!=fdcwgs104bso and Item.id!=eddcwgs101bso and Item.id!=ddcwgs211bso and Item.id!=fdcwmp708bso and Item.id!=fdcwlp1394bso and Item.id!=fdcwlp1394bso and Item.id!=fddnlp1397sso and Item.id!=edcwrp203sso and Item.id!=edcwgp101rsso and Item.id!=edcwgp108rsso and Item.id!=fndnw5003sso and Item.id!=dndom2606sso and Item.id!=ddcwcp910sso and Item.id!=enw3800w7sbso and Item.id!=dndnj1904sso and Item.id!=fddnlp1397sso and Item.id!=edcwrp203sso and Item.id!=edcwgp101rsso and Item.id!=edcwgp108rsso and Item.id!=dndnt5131sso and Item.id!=dndnq5236sso and Item.id!=dndnt5103sso and Item.id!=dndnt5122sso and Item.id!=dndnq5208sso and Item.id!=dndnx1601sso and Item.id!=fddngp101rsso and Item.id!=fddngs121hso and Item.id!=dndnt5132sso and Item.id!=dndnx1603sso and Item.id!=dnw3800w7sbso and Item.id!=fddngs101sso and Item.id!=fdcwgp104rsso and Item.id!=dddnrp220sos and Item.id!=dddngp105sso and Item.id!=dddngp111sso and Item.id!=fddngp104rsso and Item.id!=fddnmp708rsso and Item.id!=enw3800w7sbso and Item.id!=fddnmt710so and Item.id!=dddngp113sso and Item.id!=dddncp903sso and Item.id!=fddnmn7043dso and Item.id!=dddncp910sso and Item.id!=dddngp102sso and Item.id!=dddngp121sso and Item.id!=dksoe04sc and Item.id!=dksoe06h and Item.id!=dksof05 and Item.id!=dksof03 and Item.id!=dksog02 and Item.id!=dksog03 and Item.id!=dksoa02 and Item.id!=dksoa03 and Item.id!=dpsoxy02s and Item.id!=dpsoxy03s and Item.id!=dpsoc01p and Item.id!=dpsoc03p and Item.id!=dpcsoc01p and Item.id!=endnr1204sso and Item.id!=endnq5238sso and Item.id!=endnr1204sso and Item.id!=endnq5238sso and Item.id!=fndnh2434sw7pso and Item.id!=fndnh2434sw7pso and Item.id!=fndoh2434sw7pso and Item.id!=fndow5003sso and Item.id!=fndoh2434sw7pso and Item.id!=fndow5003sso and Item.id!=ddcwgs101bso and Item.id!=ddcwgs101bso and Item.id!=dndnu2409bso and Item.id!=dndou2409bso and Item.id!=dndnu2409bw7pso and Item.id!=dndnu2409bso and Item.id!=dndou2409bso and Item.id!=dndnu2409bw7pso and Item.id!=fdcwrp207bso1 and Item.id!=fdcwmp705b3dso1 and Item.id!=dddngp113sso1 and Item.id!=eddcwgs101bso1 and Item.id!=fddngs121hso1 and Item.id!=fddnlp1397sso1 ) and ( Item.id!=ertl17c2401b and Item.id!=frtl14m2508b and Item.id!=frtl15v2303b and Item.id!=ertl15c2316b and Item.id!=ertl17amdbrzh and Item.id!=ertl17amdbluh and Item.id!=ertl17amdpplh and Item.id!=encwl2514b and Item.id!=ertl17r1216s and Item.id!=ertl15h1810b and Item.id!=ertl14m2516b and Item.id!=encwm2618b and Item.id!=ertl15m2605h and Item.id!=ertlbrd5222h and Item.id!=frtl15v2303b and Item.id!=encwj2124s and Item.id!=ertl12x1402b and Item.id!=ertlx131238s and Item.id!=ertl12mur1111s and Item.id!=efrtlbel001h and Item.id!=efrtlmid02 and Item.id!=efrtlmid05 and Item.id!=efrtljun04 and Item.id!=efddnnt7101h and Item.id!=efddnnt7102h and Item.id!=efddnrt313r and Item.id!=efddnrn208r and Item.id!=efddnep8105s and Item.id!=efddnds411p and Item.id!=efddorn201pr and Item.id!=efddnds409p and Item.id!=efddnfp621s and Item.id!=efddnnp315s and Item.id!=efddngp101rsw7p and Item.id!=efddndp409s and Item.id!=efddnmp709rs and Item.id!=efdcwmp708rs and Item.id!=efddnmn7043d and Item.id!=edkcwg06 and Item.id!=edkcwg07 and Item.id!=edkcwg08 and Item.id!=edkcwx01sb and Item.id!=edkdnx108p ) and ( Classification.type==family;value!=10976 and Classification.type==family;value!=11066 and Classification.type==family;value!=11300 and Classification.type==brand;value!=6 and Item.id!=fdcworc2401mpp and Item.id!=fdcworc2105mpp and Item.id!=fddoorc2401mpp and Item.id!=fddoorc2105mpp and Item.id!=ftcwt01cc and Item.id!=ftcwt01cc3 and Item.id!=efddnnt7101h and Item.id!=efddnrp207hw10do and Item.id!=edddnz300hw10do and Item.id!=efddnst315hw10do and Item.id!=efddnrp216hw7pdo and Item.id!=edddnrp217bw10do and Item.id!=efddngsk101hw10do and Item.id!=efddngsk101hw10dos and Item.id!=edddnrp227bw10do and Item.id!=endnvamd6218hdo and Item.id!=endnr1204sw10do and Item.id!=endna007hdo and Item.id!=endnw5010hdo and Item.id!=endnv2319hdo and Item.id!=endnu2450hdo and Item.id!=endnw5011hdo and Item.id!=endnv2371hdo and Item.id!=endnu2437hdo and Item.id!=endnv2372hdo and Item.id!=endnw5014hdo and Item.id!=endnu2443hdo and Item.id!=efddnlp1394bdo and Item.id!=efdcworb409hw10do and Item.id!=efdcworc2407hw10do and Item.id!=efdcwp714hw10do and Item.id!=efdcwlp1394hw10do and Item.id!=dekcwe02mdo and Item.id!=dekcwf02mdo and Item.id!=dekcwg02mdo and Item.id!=dekcwg02mdo2 and Item.id!=depcwxy02hdo and Item.id!=depcwxy03hdo and Item.id!=depcwc01pdo and Item.id!=efddnnt7102h and Item.id!=efddnrt313r and Item.id!=efddnrn208r and Item.id!=fdcworc2401mpp and Item.id!=efddnep8105s and Item.id!=efddnds411p and Item.id!=efddorn201pr and Item.id!=efddnds409p and Item.id!=efddnfp621s and Item.id!=efddnnp315s and Item.id!=efddngp101rsw7p and Item.id!=efddndp409s and Item.id!=efddnmp709rs and Item.id!=efdcwmp708rs and Item.id!=efddnmn7043d and Item.id!=ftcwy01cc and Item.id!=ftcwb01cc and Item.id!=ftcwb02cc and Item.id!=dkcwa01cc and Item.id!=dkcwa02cc and Item.id!=dkcwa03cc and Item.id!=dkcwa04cc and Item.id!=dncwq5222s and Item.id!=dncwq5223s and Item.id!=ftdnb02cc and Item.id!=ftdnb02cc2ft and Item.id!=ftcwb02cc2 and Item.id!=dkcwe01mpp and Item.id!=fdcworc2401mpp and Item.id!=dpcwxy02mpp and Item.id!=encwr1203s and Item.id!=encwvamd2811b )) and (( PayMethod.id==pn or PayMethod.id==pp ) and ( Order.OriginalPaymentType==cc )))'
    //     //let res = toDnf(inputStr)
    //     // assert.ok(res.includes('classification.family==g8'))
    //     // assert.ok(res.includes('component.id==abc'))
    //     // assert.strictEqual(res.length, 2)

    //     let pythonRes = await callPython(inputStr)
    //     // assert.strictEqual(pythonRes[0], 'Or(classification.family==g8, component.id==abc)')
    //     assert.strictEqual(pythonRes.length, 1)
    // });


});



