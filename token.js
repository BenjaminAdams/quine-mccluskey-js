const DEBUG = process.env.DEBUG === 'true'
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃)/g
const positiveSymbols = ['==', '⊃⊃']
const negatedSymbols = ['!=', '!⊃']

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

    getAbstractSyntaxTree() {
        return (this.lhSideChars + this.getSymbolNegation() + this.rhSideChars).replace(/\|\|/g, " OR ").replace(/&&/g, " AND ")
    }

    getSymbolNegation() {
        if (positiveSymbols.includes(this.symbol)) {
            return this.placeHolder
        } else if (negatedSymbols.includes(this.symbol)) {
            //return ` NOT(${this.placeHolder})`
            return ` !${this.placeHolder}`
        } else {
            return this.placeHolder
        }
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