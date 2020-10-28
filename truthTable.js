const fs = require('fs');
const DEBUG = process.env.DEBUG === 'true'

//builds a truth table/minTerms in the format of  [0, 0, 0, 1, 0, 0, 0, 0]
module.exports = function findTrueTokens(tokens) {
    let tokenSets = []
    let truthTableResult = []
    let truthTable = []

    for (let i = 0, iter = new TruthTableIterator(tokens.length); iter.hasNext(); i++) {
        iter.next(tokens);

        let result = runEval(evalTokens(tokens))
        truthTableResult.push(result === true ? 1 : 0)

        truthTable.push(getValues(tokens, result))
        tokenSets.push(copyTokens(tokens, result))
    }

    printTruthTable(truthTable, tokens)
    return truthTableResult
}


function evalTokens(tokens) {
    let evalStatement = ''
    for (let i = 0; i < tokens.length; i++) {
        evalStatement += tokens[i].getEvalPart()
    }
    //console.log(evalStatement, '==', eval(evalStatement))
    return evalStatement
    //return eval(evalStatement)
}

//moving eval to its own function allows the parent function to optimize better
function runEval(str) {
    return eval(str)
}

function TruthTableIterator(tokensLength) {
    let iterations = Math.pow(2, tokensLength);
    let index = 0;

    this.hasNext = function () {
        return index < iterations;
    }

    this.next = function (tokens) {
        let n = index;
        for (let i = tokensLength - 1; i >= 0; i--) {
            tokens[i].valueBit = n & 1;
            tokens[i].value = tokens[i].valueBit == 1
            n = n >> 1;
        }
        index++;
    }
}



function getVariableNames(tokens) {
    if (!DEBUG) return []
    let letters = []
    for (let i = 0; i < tokens.length; i++) {
        letters.push(tokens[i].id)
    }
   // letters.push('result')
    return letters
}

function getValues(tokens, result) {
    if (!DEBUG) return []
    let values = []
    for (let i = 0; i < tokens.length; i++) {
        values.push(tokens[i].value === true ? 1 : 0)
    }
    values.push(result === true ? 1 : 0)
    return values
}

function printTruthTable(truthTable, tokens) {
    if (!DEBUG) return

    let minTerms = ''
    let variableNames= getVariableNames(tokens)
    let str=`${variableNames.length} ${variableNames.join(' ')} ${truthTable.length}\r\n`
    for (let i = 0; i < truthTable.length; i++) {
        str+= `${truthTable[i].join(' ')}\r\n`
        if(truthTable[i][truthTable[i].length-1] ==1 )
            minTerms+= `${i},`
    }
    writeTruthTableFile(str)
    console.table(truthTable)
}

function writeTruthTableFile(str) {

    fs.writeFileSync('truthTable.txt', str, {
       // flag: 'a+'
    });
}


function copyTokens(arrayOfTokens, result) {
    if (!arrayOfTokens || arrayOfTokens.length === 0) return arrayOfTokens

    let tokenSet = arrayOfTokens.map(function (token) {
        return Object.assign(Object.create(Object.getPrototypeOf(token)), token)
    })
    tokenSet.result = result
    tokenSet.valueBit = result === true ? 1 : 0

    return tokenSet
}