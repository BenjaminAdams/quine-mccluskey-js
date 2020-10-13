
const firstSplitRegex = /(AND|OR|\(|\))/g
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃)/g
const placeholders = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
let placeholderIndex = -1
let expDict = {}

function toDnf(input) {
    let tokens = prepareTokens(input)
    let res = evalTokens(tokens)

}

function evalTokens(tokens) {
    let evalStatement = ''
    for (let i = 0; i < tokens.length; i++) {

        if (typeof (tokens[i]) === 'string') {
            evalStatement += tokens[i]
        } else {
            evalStatement += tokens[i].value
        }
    }
    console.log(evalStatement, eval(evalStatement))
    return eval(evalStatement)
}

function prepareTokens(input) {
    console.log(input)

    let tokens = input.replace(/\s/g, '').split(firstSplitRegex)
        .filter(x => x !== '')  //todo find better regex pattern that does not leave empty spaces as tokens so we can avoid .filter()

    for (let i = 0; i < tokens.length; i++) {

        if (isAndOr(tokens[i])) {
            var currentPlaceholder = getNextPlaceholder()
            expDict[currentPlaceholder] = tokens[i]
            tokens[i] = replaceConditionWithObj(tokens[i], currentPlaceholder)
        } else if (tokens[i] == 'AND') {
            tokens[i] = '&&'
        } else if (tokens[i] == 'OR') {
            tokens[i] = '||'
        }
    }

    console.log(expDict, tokens)
    return tokens
}

function replaceConditionWithObj(token, currentPlaceholder) {
    let split = token.split(expressionSplitRegex)
    return {
        left: split[0],
        placeHolder: currentPlaceholder,
        symbol: split[1],
        right: split[2],
        originalToken: token,
        value: true
    }

}

function isAndOr(token) {
    return (token != '(' && token != ')' && token != 'AND' && token != 'OR')
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

module.exports = toDnf
