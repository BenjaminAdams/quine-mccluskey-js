const Token = require('./token.js')
const firstSplitRegex = /(and|or|AND|OR|\(|\))/g
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃)/g
const placeholders = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
let placeholderIndex = -1
let expDict = {}
const DEBUG = process.env.DEBUG === 'true'


function toDnf(input) {
    if (input == null) {
        return ['null']
    } else if (input === '' || input === ' ') {
        throw 'unexpected token'
    }
    else if (!input || input.length < 4) {
        return
    }
    let tokens = prepareTokens(input)
    let trueTokenSets = findTrueTokens(tokens)
    let result = createAndConditions(trueTokenSets)
    console.table(result)
    return result
}

function createAndConditions(trueTokenSets) {
    let andConditions = []
    for (let i = 0; i < trueTokenSets.length; i++) {
        let currentTokens = trueTokenSets[i]
        let currentConditions = []
        for (let j = 0; j < currentTokens.length; j++) {
            let currentCondition = currentTokens[j].left
            currentCondition += currentTokens[j].getConditionalSymbol()
            currentCondition += currentTokens[j].right
            currentConditions.push(currentCondition)
        }

        if (currentConditions.length === 1) {
            andConditions.push(currentConditions[0])
        } else if (currentConditions.length > 1) {
            andConditions.push('And(' + currentConditions.join(', ') + ')')
        }

    }

    return andConditions
}

function findTrueTokens(tokens) {
    let trueTokenSets = []
    let row = []
    let rows = []
    rows.push(getLetters(tokens))

    for (var i = (Math.pow(2, tokens.length) - 1); i >= 0; i--) {
        for (var j = (tokens.length - 1); j >= 0; j--) {
            row[j] = (i & Math.pow(2, j)) ? true : false
            tokens[j].currentValue = row[j]
        }

        let result = evalTokens(tokens)
        rows.push(getCurrentValues(tokens, result))

        if (result) {
            trueTokenSets.push(copyTokens(tokens))
        }
    }

    printRows(rows, tokens)
    return trueTokenSets
}

function evalTokens(tokens) {
    let evalStatement = ''
    for (let i = 0; i < tokens.length; i++) {
        evalStatement += tokens[i].lhSideChars
        evalStatement += tokens[i].currentValue
        evalStatement += tokens[i].rhSideChars
    }
    console.log(evalStatement, '==', eval(evalStatement))
    return eval(evalStatement)
}

function prepareTokens(input) {
    console.log(input)

    let tokens = input.replace(/\s/g, '').split(firstSplitRegex)
        .filter(x => x !== '')  //todo maybe find a better regex pattern that does not leave empty spaces as tokens so we can avoid .filter()

    let objTokens = []
    let nonExprCharHolder = ''

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] == 'AND' || tokens[i] == 'and') {
            tokens[i] = '&&'
        } else if (tokens[i] == 'OR' || tokens[i] == 'or') {
            tokens[i] = '||'
        }

        if (!isExpression(tokens[i])) {
            nonExprCharHolder += tokens[i]
        } else if (isExpression(tokens[i])) {
            // if (tokens[i].includes(validEqualityChars)) {
            //     throw `token should contain a valid equality character token: ${tokens[i]} must be ${validEqualityChars.join()}`
            // }
            var currentPlaceholder = getNextPlaceholder()
            expDict[currentPlaceholder] = tokens[i]
            objTokens.push(new Token(tokens[i], currentPlaceholder, nonExprCharHolder))
            nonExprCharHolder = ''
        }
    }

    //make any leftover characters the value of the last elements token.rhSideChars
    if (nonExprCharHolder !== '' && objTokens.length > 0) {
        objTokens[objTokens.length - 1].rhSideChars = nonExprCharHolder
    }

    return objTokens
}

function replaceExprWithObj(token, currentPlaceholder, nonExprHolder) {
    let split = token.split(expressionSplitRegex)
    return {
        left: split[0] || '',
        placeHolder: currentPlaceholder,
        symbol: split[1] || '',
        right: split[2] || '',
        originalToken: token,
        lhSideChars: nonExprHolder,
        rhSideChars: '',
        currentValue: true
    }
}

function getLetters(tokens) {
    if (!DEBUG) return []
    let letters = []
    for (let i = 0; i < tokens.length; i++) {
        letters.push(tokens[i].placeHolder)
    }
    letters.push('result')
    return letters
}

function getCurrentValues(tokens, result) {
    if (!DEBUG) return []
    let currentValues = []
    for (let i = 0; i < tokens.length; i++) {
        currentValues.push(tokens[i].currentValue)
    }
    currentValues.push(result)
    return currentValues
}

function printRows(rows, tokens) {
    if (!DEBUG) return
    console.table(rows)
}

function isExpression(token) {
    return (token != '(' && token != ')' && token != '&&' && token != '||')
}



function copyTokens(arrayOfTokens) {
    if (!arrayOfTokens || arrayOfTokens.length === 0) return arrayOfTokens
    // return JSON.parse(JSON.stringify(obj))
    return arrayOfTokens.map(function (token) {
        return Object.assign(Object.create(Object.getPrototypeOf(token)), token)
    })

}

function getNextPlaceholder() {
    placeholderIndex++
    if (placeholderIndex > placeholders.length) throw 'placeholder overflow'
    return placeholders[placeholderIndex]
}


if (!DEBUG) {
    console = console || {};
    console.log = function () { };
    console.table = function () { };

}

module.exports = toDnf
