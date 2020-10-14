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
        this.currentValue = true
    }

    getConditionalSymbol() {
        if (this.currentValue) {
            return this.symbol
        } else {
            return negateSymbol(this.symbol)
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