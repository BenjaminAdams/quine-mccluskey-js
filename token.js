const DEBUG = process.env.DEBUG === 'true'
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃)/g

class Token {
    constructor(token, currentPlaceholder, nonExprHolder) {
        let split = token.split(expressionSplitRegex)

        this.left = split[0] || ''
        this.placeHolder = currentPlaceholder
        this.symbol = split[1] || ''
        this.right = split[2] || ''
        this.originalToken = token
        this.lhSideChars = nonExprHolder
        this.rhSideChars = ''
        this.value = true
    }

    getEval() {
        return this.lhSideChars + this.value + this.rhSideChars
    }

    getConditionalSymbol() {
        if (this.value) {
            return this.symbol
        } else {
            return this.negateSymbol(this.symbol)
        }
    }

    negateSymbol(symbol) {
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
}

module.exports = Token