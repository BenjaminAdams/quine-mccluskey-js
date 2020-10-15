const Token = require('./token.js')
const simplify = require('./simplify.js')
const firstSplitRegex = /(and|or|AND|OR|\(|\))/g
const placeholders = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
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

    try {
        let tokens = prepareTokens(input)
        // let tokenSets = findTrueTokens(tokens)

        let terms = getSimplifiedTerms(tokens)
        let result = createAndConditions(tokens, terms)

        return result
    } catch (ex) {
        console.error('exception in toDnf ', ex)
        return [input]
    }

}

function getSimplifiedTerms(tokens) {
    let logicExpression = ''
    for (let i = 0; i < tokens.length; i++) {
        logicExpression += tokens[i].getFullExpression()
    }

    let terms = simplify(logicExpression)

    return terms
}

function createAndConditions(tokens, terms) {
    return terms.map(function (term, iterator) {
        let expAry = []
        for (let i = 0; i < term.length; i++) {
            let token = tokens.filter(x => x.placeHolder == term[i])
            if (term[i + 1] === "'") {
                expAry.push(token[0].getRebuiltExpression(true))
                i++
            } else {
                expAry.push(token[0].getRebuiltExpression(false))
            }

        }
        if (term.length === 1) {
            return expAry.join(', ')
        } else {
            return `And(${expAry.join(', ')})`
        }

    })
}

// function createAndConditions(tokenSets) {
//     let andConditions = []
//     for (let i = 0; i < tokenSets.length; i++) {
//         let currentTokens = tokenSets[i]
//         if (currentTokens.result === false) continue;

//         let currentConditions = []
//         for (let j = 0; j < currentTokens.length; j++) {
//             let currentCondition = currentTokens[j].left
//             currentCondition += currentTokens[j].getConditionalSymbol()
//             currentCondition += currentTokens[j].right
//             currentConditions.push(currentCondition)
//         }

//         if (currentConditions.length === 1) {
//             andConditions.push(currentConditions[0])
//         } else if (currentConditions.length > 1) {
//             andConditions.push('And(' + currentConditions.join(', ') + ')')
//         }
//     }

//     console.table(andConditions)
//     return andConditions
// }

function findTrueTokens(tokens) {
    let tokenSets = []
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

        tokenSets.push(copyTokens(tokens, result))
    }

    printTruthTable(truthTable, tokens)
    return tokenSets
}

function evalTokens(tokens) {
    let evalStatement = ''
    for (let i = 0; i < tokens.length; i++) {
        evalStatement += tokens[i].getEval()
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

// function simplify(expression) {
//     let result = ''; // Result for calculation expression

//     const expressionInLowerCase = expression.toLowerCase();

//     const value = ['false', 'true'];
//     for (let i = 0; i < 2; i++) {
//         for (let j = 0; j < 2; j++) {
//             let localResult = eval(
//                 expressionInLowerCase
//                     .replace(/a(?!lse)/g, value[i]) // Replace 'a' variable
//                     .replace(/b/g, value[j])  // Replace 'b' variable
//             );
//             result += !!localResult ? '1' : '0';
//         }
//     }

//     return {
//         '0000': 'false',
//         '0001': 'a && b',
//         '0010': 'a && !b',
//         '0011': 'a',
//         '0100': '!a && b',
//         '0101': 'b',
//         '0110': 'a != b',
//         '0111': 'a || b',
//         '1000': '!(a || b)',
//         '1001': 'a == b',
//         '1010': '!b',
//         '1011': 'a || !b',
//         '1100': '!a',
//         '1101': '!a || b',
//         '1110': '!(a && b)',
//         '1111': 'true'
//     }[result];
// };

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



function copyTokens(arrayOfTokens, result) {
    if (!arrayOfTokens || arrayOfTokens.length === 0) return arrayOfTokens

    let tokenSet = arrayOfTokens.map(function (token) {
        return Object.assign(Object.create(Object.getPrototypeOf(token)), token)
    })
    tokenSet.result = result

    return tokenSet

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
