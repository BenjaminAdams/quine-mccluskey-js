const DEBUG = process.env.DEBUG === 'true'
const expressionSplitRegex = /(==|!=|⊃⊃|!⊃|>=|<=|>|<)/g
const positiveSymbols = ['==', '⊃⊃', '>', '>=']
const negatedSymbols = ['!=', '!⊃', '<', '<=']

class Token {
    constructor(token, nonExprHolder) {
        let split = token.split(expressionSplitRegex)

        this.left = split[0] || ''
        this.id = null //this gets assigned after we know how many tokens we have
        this.symbol = split[1] || ''
        this.positiveSymbol = this.getPositiveSymbol(this.symbol)
        this.negatedSymbol = this.getNegativeSymbol(this.symbol)
        this.right = split[2] || ''
        this.originalToken = token
        this.lhSideChars = nonExprHolder
        this.rhSideChars = ''
        this.value = true
        this.valueBit = 1
    }

    getEvalPart() {
        return this.lhSideChars + this.getCorrectValue() + this.rhSideChars
    }

    //if the condition is a negated symbol '!=' we want to flip flop the value from true/false and vice versa
    getCorrectValue() {
        if (positiveSymbols.includes(this.symbol)) {
            return this.value
        } else {
            return !this.value
        }
    }

    getFullExpression() {
        //NOT: a'
        //AND: ab
        //OR:  a+b
        //XOR: a^b
        return (this.lhSideChars + this.getSymbolNegation() + this.rhSideChars).replace(/\|\|/g, "+").replace(/&&/g, "")
    }

    getRebuiltExpression(isNegated) {
        let symbolForExp = isNegated ? this.negatedSymbol : this.positiveSymbol

        return this.left + symbolForExp + this.right
    }

    // getSymbolNegation() {
    //     if (positiveSymbols.includes(this.symbol)) {
    //         return this.placeHolder
    //     } else if (negatedSymbols.includes(this.symbol)) {
    //         //return ` NOT(${this.placeHolder})`
    //         //return ` !${this.placeHolder}`
    //         return `${this.placeHolder}'`
    //     } else {
    //         return this.placeHolder
    //     }
    // }

    getPositiveSymbol(symbol) {
        if (positiveSymbols.includes(symbol)) {
            return symbol
        } else {
            return this.negateSymbol(symbol)
        }
    }

    getNegativeSymbol(symbol) {
        if (negatedSymbols.includes(symbol)) {
            return symbol
        } else {
            return this.negateSymbol(symbol)
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
            case '>':
                return '<'
            case '<':
                return '>'
            case '>=':
                return '<='
            case '<=':
                return '>='
            default:
                throw 'Unknown symbol: ' + symbol
        }
    }
}

module.exports = Token