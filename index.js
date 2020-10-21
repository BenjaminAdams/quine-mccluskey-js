
const Token = require('./token.js')
const simplify = require('./simplify.js')
const firstSplitRegex = /\s(and|or|AND|OR)\s|(\(|\))/g
const placeholders = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
let placeholderIndex;
let expDict = {}
const DEBUG = process.env.DEBUG === 'true'



function toDnf(input) {
    placeholderIndex = -1
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
        let terms = getSimplifiedTerms(tokens)
        return createAndConditions(tokens, terms)

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

    return simplify(logicExpression)
}

function createAndConditions(tokens, terms) {
    return terms.map(function (term) {
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
            return unescapeSemiColonValues(expAry.join(', '))
        } else {
            return unescapeSemiColonValues(`And(${expAry.join(', ')})`)
        }

    })

}




function prepareTokens(input) {
    input = removeUnnecessaryParenthesis(input)
    input = escapeSemiColonValues(input)
    let parts = input.split(firstSplitRegex)
    let objTokens = []
    let nonExprCharHolder = ''

    for (let i = 0; i < parts.length; i++) {
        if (!parts[i]) continue;
        parts[i] = parts[i].trim()
        if (parts[i] == 'AND' || parts[i] == 'and') {
            parts[i] = '&&'
        } else if (parts[i] == 'OR' || parts[i] == 'or') {
            parts[i] = '||'
        }

        if (!isExpression(parts[i])) {
            nonExprCharHolder += parts[i]
        } else if (isExpression(parts[i])) {
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



function isExpression(token) {
    return (token != '(' && token != ')' && token != '&&' && token != '||')
}

function getNextPlaceholder() {
    placeholderIndex++
    if (placeholderIndex > placeholders.length) throw 'placeholder overflow'
    return placeholders[placeholderIndex]
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



function removeUnnecessaryParenthesis(str) {
    var i = 0;
    return (function recur(b) {
        var c, s = '';
        while (c = str.charAt(i++)) {          // Keep getting chars
            if (c == ')') return s;            // End of inner part
            if (c == '(') {
                var s1 = recur(true),         // Get inner part
                    s2 = recur();             // Get following part
                return s + (!b || s2 ? '(' + s1 + ')' : s1) + s2;
            }
            s += c;                           // Add current char
            b = false;
        }
        return s;
    })();
}

// function removeUnnecessaryParenthesis(str) {
//     // Tokenize the pattern
//     var pieces = str.split(/(\\.|\[(?:\\.|[^\]\\])+]|\((?:\?[:!=])?|\)(?:[*?+]\??|\{\d+,?\d*}\??)?)/g);
//     var stack = [];
//     for (var i = 0; i < pieces.length; i++) {
//         if (pieces[i].substr(0, 1) == "(") {
//             // Opening parenthesis
//             stack.push(i);
//         } else if (pieces[i].substr(0, 1) == ")") {
//             // Closing parenthesis
//             if (stack.length == 0) {
//                 // Unbalanced; Just skip the next one.
//                 continue;
//             }
//             var j = stack.pop();
//             if ((pieces[j] == "(" || pieces[j] == "(?:") && pieces[i] == ")") {
//                 // If it is a capturing group, or a non-capturing group, and is
//                 // not followed by a quantifier;
//                 // Clear both the opening and closing pieces.
//                 pieces[i] = "";
//                 pieces[j] = "";
//             }
//         }
//     }
//     return pieces.join("").trim()
// }


module.exports = toDnf
