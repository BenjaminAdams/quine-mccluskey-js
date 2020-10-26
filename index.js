
const Token = require('./token.js')
const QuineMcCluskey = require('./qmc.js')
const truthTableBuilder = require('./truthTable.js')

const firstSplitRegex = /\s(and|or|AND|OR)\s|(\(|\))/g
const DEBUG = process.env.DEBUG === 'true'


function toDnf(input) {
    if (input == null) {
        return ['null']
    } else if (input === '' || input === ' ') {
        throw 'unexpected token'
    }
    else if (!input || input.length < 4) {
        return [input]
    }

    try {
        let start = Date.now()
        let tokens = prepareTokens(input)
        console.log(`prepareTokens() ${Date.now() - start}ms`)

        start = Date.now()
        let truthTableResult = truthTableBuilder(tokens)
        console.log(`truthTableBuilder() ${Date.now() - start}ms`)

        let qmc = new QuineMcCluskey(tokens.length, truthTableResult);
        let qmcResult = qmc.map(x => qmcBackToAnds(tokens, x))
        return qmcResult

    } catch (ex) {
        console.error('exception in toDnf ', ex)
        return [input]
    }
}

function qmcBackToAnds(tokens, expr) {
    let expAry = []
    let split = expr.split('x')
    for (let i = 0; i < split.length; i++) {
        if (!split[i]) continue;
        let isNegated = split[i].includes('!')
        let id = parseInt(split[i].replace(/!|x/g, ''))
        expAry.push(getTokenById(tokens, id).getRebuiltExpression(isNegated))
    }

    if (expAry.length === 1) {
        return unescapeSemiColonValues(expAry.join(', '))
    } else {
        return unescapeSemiColonValues(`And(${expAry.join(', ')})`)
    }
}

function getTokenById(tokens, id) {
    return tokens.filter(x => x.id === id)[0]
}

function prepareTokens(input) {
    //input = removeUnnecessaryParenthesis(input)
    input = escapeSemiColonValues(input)
    let parts = input.split(firstSplitRegex)
    let objTokens = []
    let nonExprCharHolder = ''

    for (let i = 0; i < parts.length; i++) {
        if (typeof (parts[i]) === 'undefined') continue;
        parts[i] = parts[i].trim()
        if (!parts[i]) continue;

        if (parts[i] == 'AND' || parts[i] == 'and') {
            parts[i] = '&&'
        } else if (parts[i] == 'OR' || parts[i] == 'or') {
            parts[i] = '||'
        }

        if (!isExpression(parts[i])) {
            nonExprCharHolder += parts[i]
        } else if (isExpression(parts[i])) {
            objTokens.push(new Token(parts[i], nonExprCharHolder))
            nonExprCharHolder = ''
        }
    }

    //make any leftover characters the value of the last elements token.rhSideChars
    if (nonExprCharHolder !== '' && objTokens.length > 0) {
        objTokens[objTokens.length - 1].rhSideChars = nonExprCharHolder
    }

    //assign each token an id in desc order
    for (let x = 0; x < objTokens.length; x++) {
        objTokens[objTokens.length - x - 1].id = x
    }

    return objTokens
}



function isExpression(token) {
    return (token != '(' && token != ')' && token != '&&' && token != '||')
}

const equalsEqualsSearchStr = /;value==/g
const equalEqualsPh = 'value_equals_equals_ph'

const notEqualsSearchStr = /;value!=/g
const notEqualsPh = 'value_not_equals_ph'

const containsSearchStr = /;value⊃⊃/g
const containsPh = 'value_contains_ph'

const notContainsSearchStr = /;value!⊃/g
const notContainsPh = 'value_not_contains_ph'

//replaces ;Value== with escaped characters so they are not split in the next step
function escapeSemiColonValues(str) {
    str = str.replace(equalsEqualsSearchStr, equalEqualsPh)
    str = str.replace(notEqualsSearchStr, notEqualsPh)
    str = str.replace(containsSearchStr, containsPh)
    str = str.replace(notContainsSearchStr, notContainsPh)
    return str
}

function unescapeSemiColonValues(str) {
    str = str.replace(equalEqualsPh, ';value==')
    str = str.replace(notEqualsPh, ';value!=')
    str = str.replace(containsPh, ';value⊃⊃')
    str = str.replace(notContainsPh, ';value!⊃')
    return str
}

// function removeUnnecessaryParenthesis(str) {
//     if (!str || str.length < 2) return str
//     let queue = []
//     let removals = []

//     for (let i = 0; i < str.length; i++) {
//         let a = str[i];

//         if (a == '(') {
//             queue.push({ val: i, bool: false });
//         }
//         else if (a == ')') {
//             if (queue[queue.length - 1].bool) {
//                 // remove top.int and i from string in a later step
//                 removals.push(queue[queue.length - 1].val, i)
//             }

//             queue.pop()
//             if (queue.length > 0) {
//                 queue[queue.length - 1].bool = true;
//             }

//         }
//         else if (queue.length > 0) {
//             queue[queue.length - 1].bool = false;
//         }
//     }

//     let removedSoFar = 0
//     str = str.split('')
//     removals = removals.sort((a, b) => a - b)
//     for (let i = 0; i < removals.length; i++) {
//         str.splice(removals[i] - removedSoFar, 1)
//         removedSoFar++
//     }

//     return str.join('')
// }


//let inputStr = 'xxx==g8 or yyy==abc or ggg==333 or kku==999 or eee==223 and (somethig===111 and asdasd==000) and asdasdasd==11111'
//let res = toDnf(inputStr)

module.exports = toDnf
