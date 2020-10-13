
const firstSplitRegex = /(AND|OR|\(|\))/g
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃)/g
const placeholders = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
let placeholderIndex = -1
let expDict = {}
const DEBUG = true


function toDnf(input) {
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
            if (currentTokens[j].currentValue) {
                currentCondition += currentTokens[j].symbol
            } else {
                currentCondition += negateSymbol(currentTokens[j].symbol)
            }
            currentCondition += currentTokens[j].right
            currentConditions.push(currentCondition)
        }


        andConditions.push('And(' + currentConditions.join(',') + ')')
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
            trueTokenSets.push(copyObj(tokens))
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
    console.log(evalStatement, eval(evalStatement))
    return eval(evalStatement)
}

function prepareTokens(input) {
    console.log(input)

    let tokens = input.replace(/\s/g, '').split(firstSplitRegex)
        .filter(x => x !== '')  //todo find better regex pattern that does not leave empty spaces as tokens so we can avoid .filter()

    let newTokens = []
    let nonExprCharHolder = ''

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] == 'AND') {
            tokens[i] = '&&'
        } else if (tokens[i] == 'OR') {
            tokens[i] = '||'
        }

        if (!isExpression(tokens[i])) {
            nonExprCharHolder += tokens[i]
        } else if (isExpression(tokens[i])) {
            var currentPlaceholder = getNextPlaceholder()
            expDict[currentPlaceholder] = tokens[i]
            newTokens.push(replaceExprWithObj(tokens[i], currentPlaceholder, nonExprCharHolder))
            nonExprCharHolder = ''
        }
    }

    //make any leftover characters the value of the last token.rhSideChars
    if (nonExprCharHolder !== '' && newTokens.length > 0) {
        newTokens[newTokens.length - 1].rhSideChars = nonExprCharHolder
    }

    return newTokens
}

function replaceExprWithObj(token, currentPlaceholder, nonExprHolder) {
    let split = token.split(expressionSplitRegex)
    return {
        left: split[0],
        placeHolder: currentPlaceholder,
        symbol: split[1],
        right: split[2],
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

function negateSymbol(symbol) {
    switch (symbol) {
        case '==':
            return '!='
        case '!=':
            return '=='
        case '⊃⊃':
            return '!⊃'
        case '!⊃':
            return '⊃⊃'
        default:
            throw 'Unknown symbol: ' + symbol
    }
}

function copyObj(obj) {
    return JSON.parse(JSON.stringify(obj))
}

function getNextPlaceholder() {
    placeholderIndex++
    if (placeholderIndex > placeholders.length) throw 'placeholder overflow'
    return placeholders[placeholderIndex]
}

/*1 - split by OR, AND, (, ) -> get array of values					
2 - trim all values in the array					
3 - Build dictionary by expression (no duplicates)					{'component.id==abc': 'A', 'component.id⊃⊃def': 'B'…}
4 - Replace original strings with variables using dict 3					string.replace
5 - Replace operators: 			or->||, and->&&		
6 - WORKING FORMULA: 			A || (B && (C || D))		
                	
n - Replace relations operators for negation:					`== -> !=
                    != -> ==
                    ⊃⊃ -> !⊃
                    !⊃ -> ⊃⊃
                    */

if (!DEBUG) {
    console = console || {};
    console.log = function () { };
    console.table = function () { };
}

module.exports = toDnf
