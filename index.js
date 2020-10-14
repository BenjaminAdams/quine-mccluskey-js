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
        return [input]
    }

    let tokens = prepareTokens(input)
    let trueTokenSets = findTrueTokens(tokens)
    let result = createAndConditions(trueTokenSets)

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

    console.table(andConditions)
    return andConditions
}

function findTrueTokens(tokens) {
    let trueTokenSets = []
    let row = []
    let truthTable = []
    truthTable.push(getLetters(tokens))

    for (var i = (Math.pow(2, tokens.length) - 1); i >= 0; i--) {
        for (var j = (tokens.length - 1); j >= 0; j--) {
            row[j] = (i & Math.pow(2, j)) ? true : false
            tokens[j].value = row[j]
        }

        let result = evalTokens(tokens)
        truthTable.push(getValues(tokens, result))

        if (result) {
            trueTokenSets.push(copyTokens(tokens))
        }
    }

    printTruthTable(truthTable, tokens)
    return trueTokenSets
}

function evalTokens(tokens) {
    let evalStatement = ''
    for (let i = 0; i < tokens.length; i++) {
        evalStatement += tokens[i].lhSideChars
        evalStatement += tokens[i].value
        evalStatement += tokens[i].rhSideChars
    }
    console.log(evalStatement, '==', eval(evalStatement))
    return eval(evalStatement)
}

function prepareTokens(input) {
    console.log(input)

    let parts = input.replace(/\s/g, '').split(firstSplitRegex)
        .filter(x => x !== '')  //todo maybe find a better regex pattern that does not leave empty spaces as tokens so we can avoid .filter()

    let objTokens = []
    let nonExprCharHolder = ''

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] == 'AND' || parts[i] == 'and') {
            parts[i] = '&&'
        } else if (parts[i] == 'OR' || parts[i] == 'or') {
            parts[i] = '||'
        }

        if (!isExpression(parts[i])) {
            nonExprCharHolder += parts[i]
        } else if (isExpression(parts[i])) {
            // if (parts[i].includes(validEqualityChars)) {
            //     throw `parts should contain a valid equality character parts: ${parts[i]} must be ${validEqualityChars.join()}`
            // }
            var currentPlaceholder = getNextPlaceholder()
            expDict[currentPlaceholder] = parts[i]
            objTokens.push(new Token(parts[i], currentPlaceholder, nonExprCharHolder))
            nonExprCharHolder = ''
        }
    }

    //make any leftover characters the value of the last elements token.rhSideChars
    if (nonExprCharHolder !== '' && objTokens.length > 0) {
        objTokens[objTokens.length - 1].rhSideChars = nonExprCharHolder
    }

    return objTokens
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

function getValues(tokens, result) {
    if (!DEBUG) return []
    let values = []
    for (let i = 0; i < tokens.length; i++) {
        values.push(tokens[i].value)
    }
    values.push(result)
    return values
}

function printTruthTable(truthTable) {
    if (!DEBUG) return
    console.table(truthTable)
}

function isExpression(token) {
    return (token != '(' && token != ')' && token != '&&' && token != '||')
}



function copyTokens(arrayOfTokens) {
    if (!arrayOfTokens || arrayOfTokens.length === 0) return arrayOfTokens

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
