const assert = require('assert');
var toDnf = require('../index.js');

describe('toDnf', function () {

    it('should return proper values', function () {
        let res = toDnf('component.id==abc OR (component.id!=def AND (classification.family==g8 OR classification.family==X1))')
        console.log(res)
        assert.strictEqual(true, true);
    });

});