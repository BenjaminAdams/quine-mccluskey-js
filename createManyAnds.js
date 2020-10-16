//const DEBUG = process.env.DEBUG === 'true'

//Code I used to create non-simplified terms

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

// function findTrueTokens(tokens) {
//     let tokenSets = []
//     let row = []
//     let truthTable = []
//     truthTable.push(getLetters(tokens))

//     for (var i = (Math.pow(2, tokens.length) - 1); i >= 0; i--) {
//         for (var j = (tokens.length - 1); j >= 0; j--) {
//             row[j] = (i & Math.pow(2, j)) ? true : false
//             tokens[j].value = row[j]
//         }

//         let result = evalTokens(tokens)
//         truthTable.push(getValues(tokens, result))

//         tokenSets.push(copyTokens(tokens, result))
//     }

//     printTruthTable(truthTable, tokens)
//     return tokenSets
// }

// function evalTokens(tokens) {
//     let evalStatement = ''
//     for (let i = 0; i < tokens.length; i++) {
//         evalStatement += tokens[i].getEval()
//     }
//     console.log(evalStatement, '==', eval(evalStatement))
//     return eval(evalStatement)
// }


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

// function getLetters(tokens) {
//     if (!DEBUG) return []
//     let letters = []
//     for (let i = 0; i < tokens.length; i++) {
//         letters.push(tokens[i].placeHolder)
//     }
//     letters.push('result')
//     return letters
// }

// function getValues(tokens, result) {
//     if (!DEBUG) return []
//     let values = []
//     for (let i = 0; i < tokens.length; i++) {
//         values.push(tokens[i].value)
//     }
//     values.push(result)
//     return values
// }

// function printTruthTable(truthTable) {
//     if (!DEBUG) return
//     console.table(truthTable)
// }


// function copyTokens(arrayOfTokens, result) {
//     if (!arrayOfTokens || arrayOfTokens.length === 0) return arrayOfTokens

//     let tokenSet = arrayOfTokens.map(function (token) {
//         return Object.assign(Object.create(Object.getPrototypeOf(token)), token)
//     })
//     tokenSet.result = result

//     return tokenSet
// }