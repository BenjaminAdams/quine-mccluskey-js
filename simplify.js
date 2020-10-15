

module.exports = function (input) {
    let min_terms = MinTerms.fromExpression(input);
    let f = new BooleanFunction(min_terms);
    let vars = SumOfProducts.removeDuplicates(input.replace(/[^a-zA-Z]/g, '').split(''));
    let prime_imps = f.findPrimeImplicants();
    let table = PrimeImplicantTable.build(f.getMinTerms(), prime_imps);
    let sum_of_prods = SumOfProducts.fromTable(table);
    let solns = SumOfProducts.reduce(sum_of_prods);
    let pretty = SumOfProducts.toSymbols(solns, prime_imps, vars);
    let terms = SumOfProducts.toTerms(solns, prime_imps, vars);
    return terms;
};

function TruthTableIterator(vars) {
    let iterations = Math.pow(2, vars.length);
    let index = 0;

    this.hasNext = function () {
        return index < iterations;
    }

    this.next = function () {
        let n = index;
        let symbol_values = {};
        for (let i = vars.length - 1; i >= 0; i--) {
            symbol_values[vars[i]] = n & 1;
            n = n >> 1;
        }
        index++;
        return symbol_values;
    }
}



function MinTerm(covers, bit_length, is_dont_care) {
    let that = this;
    this.covers = covers; // list of minterms (numbers) that this MinTerm covers (a joined MinTerm may cover multiple minterms)
    this.bits = new Array(bit_length); // the bit representation of the MinTerm ordered from lsb to msb (i.e. 7 = [001])
    this.is_dont_care = typeof (is_dont_care) == "undefined" ? false : is_dont_care;
    this.must_be_used = !is_dont_care; // when a pair of terms are joined, they no longer need to be used in the minimized function
    this.id = MinTerms.nextId();
    let number_of_ones = -1; // calculate this later

    this.toString = function () {
        return this.bits.toString();
    }


    this.getNumberOfOnes = function () {
        if (number_of_ones == -1) {
            number_of_ones = 0;
            for (let i = 0; i < this.bits.length; i++) {
                if (this.bits[i] == 1)
                    number_of_ones++;
            }
        }
        return number_of_ones;
    }

    // determine if two MinTerms can be joined together (based on their bits). 
    // Returns the index of the difference if the terms can be joined, otherwise -1
    let canJoin = function (min_term) {
        if (that === min_term) return -1; // can't join with itself
        if (that.bits.length == 1 && min_term.bits.length == 1) return -1; // can't join 0 and 1

        let index_of_diff = 0; // index were the difference occured
        let differences = 0
        for (let i = 0; i < that.bits.length; i++) {
            let a = that.bits[i];
            let b = min_term.bits[i];

            // the _ *must* match up
            if (a == "_" && b != "_")
                return -1;
            if (b == "_" && a != "_")
                return -1;

            // found a difference
            if (a != b) {
                differences++;
                index_of_diff = i;
            }

            // we got too many differences
            if (differences > 1)
                return -1;
        }

        // if they are the same, don't join
        if (differences == 0)
            return -1;

        //alert(this.toString() + "\n" + min_term.toString());
        return index_of_diff;
    }

    this.join = function (min_term) {
        let index_of_diff = canJoin(min_term);
        if (index_of_diff == -1)
            return false;

        // build a new MinTerm that covers both terms
        let covers = this.covers.concat(min_term.covers);
        // its only a don't care if both the joined terms are don't cares
        let is_dont_care = this.is_dont_care && min_term.is_dont_care;
        let new_term = new MinTerm(covers, this.bits.length, is_dont_care);

        // set the bits of the new term
        for (let i = 0; i < bit_length; i++) {
            new_term.bits[i] = this.bits[i];

            // mark the different bit
            if (i == index_of_diff)
                new_term.bits[i] = "_";
        }

        // flag the terms that were combined (they don't need to be used anymore)
        this.must_be_used = min_term.must_be_used = false;

        return new_term;
    }

    // determine if a minterm (m) is covered by this minterm
    this.coversMinTerm = function (m) {
        for (let i = 0; i < this.covers.length; i++) {
            if (m == this.covers[i])
                return true;
        }
        return false;
    }

    // construct the bit array
    let n = this.covers[0]; // build the bits array based on the first minterm covered
    for (let i = this.bits.length - 1, tmp = n, j = 0; i >= 0; i--) {
        this.bits[j++] = tmp & 1;
        tmp = tmp >> 1;
    }
}

// MinTerm utilities
let MinTerms = {
    id: 0,
    nextId: function () {
        return this.id++;
    },

    // get the number of bits neccessary to store the largest min term or don't care
    getNormalizedBitLength: function (min_terms, dont_cares) {
        let max = 1;
        for (let i = 0; i < min_terms.length; i++) {
            if (min_terms[i] > max)
                max = min_terms[i];
        }
        for (let j = 0; j < dont_cares.length; j++) {
            if (dont_cares[j] > max)
                max = dont_cares[j];
        }

        return Math.ceil(Math.log(max + 1) / Math.log(2))
    },

    // build a set of min terms using arrays of integers
    fromArray: function (min_terms, dont_cares) {
        if (typeof (dont_cares) == "undefined")
            dont_cares = [];

        let bit_length = this.getNormalizedBitLength(min_terms, dont_cares);
        let terms = [];
        for (let i = 0; i < min_terms.length; i++) {
            terms.push(new MinTerm([min_terms[i]], bit_length));
        }

        for (let i = 0; i < dont_cares.length; i++) {
            terms.push(new MinTerm([dont_cares[i]], bit_length, true));
        }

        return terms;
    },

    fromExpression: function (expr) {
        let mins = [];
        let lexer = new BooleanExpressionLexer(expr);
        let vars = lexer.variables();
        let evaluator = Bool(lexer);
        for (let i = 0, iter = new TruthTableIterator(vars); iter.hasNext(); i++) {
            let symbol_values = iter.next();
            if (evaluator.eval(symbol_values)) {
                mins.push(i);
            }
        }
        return this.fromArray(mins);
    }
}

function BooleanFunction(min_terms) {
    this.findPrimeImplicants = function () {
        let groups = this.joinTerms();
        let terms = this.getRemainingTerms(groups);
        return terms;
    }

    this.joinTerms = function () {
        let groups = [];
        groups.push(min_terms);

        // foreach group (we start off with one group, but add groups as we go...)
        for (let i = 0; i < groups.length; i++) {
            // categorize the group by the number of ones in each term
            let by_ones = {};
            let max_ones = 0; // keep track of this so we can skip the last group
            for (let j = 0; j < groups[i].length; j++) {
                let ones = groups[i][j].getNumberOfOnes();
                // create list if it doesn't already exist
                if (!by_ones[ones])
                    by_ones[ones] = [];

                by_ones[ones].push(groups[i][j]);
                if (ones > max_ones)
                    max_ones = ones;
            }

            // build the next group using a hash table to avoid duplicate terms
            let next_group = {};
            let add_new_group = false;

            for (let ones_length in by_ones) {
                ones_length = parseInt(ones_length, 10); // this saves us from stupid bugs
                let search_group = by_ones[ones_length + 1];

                // skip the max group and the group with no group with 1 more 1
                if (ones_length == max_ones || !search_group)
                    continue;

                // for each term in the group
                for (let j = 0; j < by_ones[ones_length].length; j++) {
                    let a_term = by_ones[ones_length][j];
                    // try to find a match if the search group
                    for (let k = 0; k < search_group.length; k++) {
                        let b_term = search_group[k];
                        let new_term = a_term.join(b_term);
                        if (new_term) {
                            // create the joined term and add it to the next group
                            next_group[new_term.toString()] = new_term;
                            add_new_group = true;
                        }
                    }
                }
            }

            // add the new group
            if (add_new_group) {
                groups.push([]);
                for (let k in next_group)
                    groups[i + 1].push(next_group[k]);
            }
        }
        return groups;
    }

    this.getRemainingTerms = function (groups) {
        let remaining_terms = {}; // using a hash table to eliminate duplicates
        // go through each group
        for (let i = 0; i < groups.length; i++) {
            // go through each term in the group
            for (let j = 0; j < groups[i].length; j++) {
                let term = groups[i][j]
                // is it essential?
                if (!term.is_dont_care && term.must_be_used)
                    remaining_terms[term.toString()] = term;
            }
        }

        // we have all the essential terms (in a hash table). Convert it to an array
        let terms = [];
        for (let k in remaining_terms) {
            terms.push(remaining_terms[k]);
            //alert(essential_terms[k].bits.toString());
        }
        return terms;
    }

    this.getMinTerms = function () {
        return min_terms;
    }

    this.isMinTerm = function (n) {
        for (let i = 0; i < min_terms.length; i++) {
            if (min_terms[i].covers[0] == n)
                return true;
        }
        return false;
    }

    this.getNumberOfVars = function () {
        let max = 1;
        for (let i = 0; i < min_terms.length; i++) {
            if (min_terms[i].covers[0] > max)
                max = min_terms[i].covers[0];
        }
        return Math.log(max) / Math.log(2) + 1;
    }
}

let PrimeImplicantTable = {
    // build a table that lists which MinTerm object covers the min_terms (passed in when this object was created)
    // For example, table would look like
    // {1 : [MinTerm obj, MinTerm obj],
    //  4 : [MinTerm obj],
    //  7 : [MinTerm obj, MinTerm obj, MinTerm obj}	
    build: function (min_terms, primes) {
        let table = {};
        // loop through each min term number
        for (let i = 0; i < min_terms.length; i++) {
            // ignore don't cares
            if (min_terms[i].is_dont_care)
                continue;

            let n = min_terms[i].covers[0];
            table[n] = []; // create the list for the covering MinTerm objects
            // find the MinTerm objects that cover this min term, and push it onto this min term's list
            for (let j = 0; j < primes.length; j++) {
                if (primes[j].coversMinTerm(n)) {
                    table[n].push(primes[j]);
                    //					alert(table[min_terms[i].covers[0]]);
                }
            }
        }
        return table;
    }
}



/* Represented A + BC = [A, [B,C] */
let SumOfProducts = {
    distribute: function (x, y) {
        let z = [];
        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < y.length; j++) {
                let tmp = this.removeDuplicates(x[i].concat(y[j]));
                z.push(tmp);
            }
        }

        z = this.applyIdentity(z);
        return z;
        //alert(this.prettyify(z));
        //alert(z.join("+"));
    },

    removeDuplicates: function (a) {
        let b = {};
        for (let i = 0; i < a.length; i++) {
            b[a[i]] = true;
        }
        let tmp = [];
        for (let k in b) {
            tmp.push(k);
        }
        return tmp;
    },

    // apply the identity x = x+xy
    applyIdentity: function (terms) {
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (terms[j] != null && terms[i] != null && i != j && this.arrayContainsArray(terms[i], terms[j])) {
                    if (terms[j].length > terms[i].length) {
                        terms[j] = null;
                    } else {
                        terms[i] = terms[j];
                        terms[j] = null;
                    }
                }
            }
        }

        let new_terms = [];
        for (let i = 0; i < terms.length; i++) {
            if (terms[i] != null)
                new_terms.push(terms[i]);
        }
        return new_terms;
    },

    inArray: function (a, c) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] == c)
                return true;
        }
        return false;
    },

    arrayContainsArray: function (a, b) {
        let len = Math.min(a.length, b.length);
        if (a.length < b.length) {
            let tmp = a;
            a = b;
            b = tmp;
        }
        for (let i = 0; i < len; i++) {
            if (!this.inArray(a, b[i]))
                return false;
        }
        return true;
    },

    fromTable: function (table) {
        let terms = [];
        for (let k in table) {
            let tuple = [];
            for (let i = 0; i < table[k].length; i++) {
                tuple.push([table[k][i].id]);
            }
            terms.push(tuple);
        }
        return terms;
    },

    reduce: function (set) {
        if (set.length == 0) {
            return [];
        } else if (set.length == 1) {
            return this.applyIdentity(set[0]);
        }

        let dis = this.distribute(set[0], set[1]);
        for (let i = 2; i < set.length; i++) {
            dis = this.distribute(dis, set[i]);
        }

        return dis;
    },
    toTerms: function (solns, primes, letters) {
        if (solns.length == 0)
            return [0]; // contradiction

        // first build a lookup table
        primes_lookup = {};
        for (let i = 0; i < primes.length; i++) {
            primes_lookup[primes[i].id] = primes[i];
        }
        let terms = []
        // loop through every solution
        for (let i = 0; i < solns.length; i++) {

            // loop through every MinTerm in this particular clause, map the bit pattern to letters, and join it with a "+"
            for (let j = 0; j < solns[i].length; j++) {
                let term = [];
                let bits = primes_lookup[solns[i][j]].bits;
                let letters_offset = bits.length - 1;
                for (let k = bits.length - 1; k >= 0; k--) {
                    if (bits[k] == "0") {
                        term.push(letters[letters_offset - k] + "'");
                    } else if (bits[k] == "1") {
                        term.push(letters[letters_offset - k]);
                    }
                }
                terms.push(term.join(""))
            }
        }

        return terms
    },
    toSymbols: function (solns, primes, letters) {
        if (solns.length == 0)
            return [0]; // contradiction

        // first build a lookup table
        primes_lookup = {};
        for (let i = 0; i < primes.length; i++) {
            primes_lookup[primes[i].id] = primes[i];
        }

        let list = [];
        // loop through every solution
        for (let i = 0; i < solns.length; i++) {
            let clause = [];
            // loop through every MinTerm in this particular clause, map the bit pattern to letters, and join it with a "+"
            for (let j = 0; j < solns[i].length; j++) {
                let term = [];
                let bits = primes_lookup[solns[i][j]].bits;
                let letters_offset = bits.length - 1;
                for (let k = bits.length - 1; k >= 0; k--) {
                    if (bits[k] == "0") {
                        term.push(letters[letters_offset - k] + "'");
                    } else if (bits[k] == "1") {
                        term.push(letters[letters_offset - k]);
                    }
                }
                clause.push(term.join(""));
            }
            list.push(clause.join("+"));
        }

        if (list.length == 1 && list[0] == "")
            list[0] = "1"; // it's a tautology
        return list;
    }
}

/* Grammer 
bool -> bool_term {+ bool_term}
bool_term -> bool_factor {^ bool_factor}
bool_factor -> bool_atom {bool_atom}
bool_atom -> bool_atom' | (bool) | var
*/
let Token = {
    isWhitespace: function (c) {
        switch (c) {
            case " ":
            case "\n":
            case "\t":
            case "\r":
            case "\f":
            case "\v":
            case "\0":
                return true;
        }
        return false;
    },

    isVariable: function (c) {
        return ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
    },

    isOperator: function (c) {
        switch (c) {
            case "+":
            case "^":
            case "'":
            case "(":
            case ")":
                return true;
        }

        return false;
    }
}

function AndExpression(left, right) {
    this.eval = function (symbol_values) {
        return left.eval(symbol_values) && right.eval(symbol_values);
    }
}

function XorExpression(left, right) {
    this.eval = function (symbol_values) {
        p = left.eval(symbol_values);
        q = right.eval(symbol_values);
        return (p && !q) || (!p && q);
    }
}

function OrExpression(left, right) {
    this.eval = function (symbol_values) {
        return left.eval(symbol_values) || right.eval(symbol_values);
    }
}

function VariableExpression(symbol) {
    this.eval = function (symbol_values) {
        return !!symbol_values[symbol];
    }
}

function NotExpression(unary) {
    this.eval = function (symbol_values) {
        return !unary.eval(symbol_values);
    }
}

function Bool(lexer) {
    let e = BoolTerm(lexer);
    while (1) {
        if (lexer.token() == "+") {
            lexer.match("+");
            e = new OrExpression(e, BoolTerm(lexer));
        } else {
            break;
        }
    }
    return e;
}

function BoolTerm(lexer) {
    let e = BoolFactor(lexer);
    while (1) {
        if (lexer.token() == "^") {
            lexer.match("^");
            e = new XorExpression(e, BoolFactor(lexer));
        } else {
            break;
        }
    }

    return e;
}

function BoolFactor(lexer) {
    let e = BoolAtom(lexer);
    while (1) {
        // ANDs can ride up against another variable or a (
        if (Token.isVariable(lexer.token()) || lexer.token() == "(") {
            e = new AndExpression(e, BoolAtom(lexer));
        } else {
            break;
        }
    }

    return e;
}

function BoolAtom(lexer) {
    let e = null;
    if (Token.isVariable(lexer.token())) {
        e = new VariableExpression(lexer.token());
        lexer.match(lexer.token());
    } else if (lexer.token() == "(") {
        lexer.match("(");
        e = Bool(lexer);
        lexer.match(")");
    } else {
        lexer.match('  '); // won't match anything, throws missing token exception
    }

    // look for negative;
    if (lexer.token() == "'") {
        e = new NotExpression(e);
        lexer.match("'")
    }
    return e;
}

function InvalidTokenException(tok, position) {
    this.position = position;
    this.tok = tok;
    this.toString = function () {
        return "Invalid token " + this.tok + " at position " + this.position;
    }
}

function MissingTokenException(given, expected, position) {
    this.position = position;
    this.given = given;
    this.expected = expected;
    this.toString = function () {
        return "Missing token. Expected " + this.expected + " at position " + this.position;
    }
}

function BooleanExpressionLexer(expr) {
    let index = 0;
    let tokens = [];

    let parse = function () {
        // find all the tokens and push them on the stack
        for (let i = 0; i < expr.length; i++) {
            let tok = expr[i];
            if (Token.isWhitespace(tok)) {
                continue;
            } else if (Token.isVariable(tok) || Token.isOperator(tok)) {
                tokens.push(tok);
            } else {
                throw new InvalidTokenException(tok, i + 1);
            }
        }
    }

    // get the next token on the stack
    this.nextToken = function () {
        return tokens[index++];
    }

    // get the current token
    this.token = function () {
        return tokens[index];
    }

    // verify the current token matches the specified token, and move to the next token
    this.match = function (c) {
        if (c != this.token()) {
            throw new MissingTokenException(this.token(), c, index);
        }
        this.nextToken();
    }

    this.toString = function () {
        return tokens.toString();
    }

    // get a sorted list of all the variables in the expression
    this.variables = function () {
        // use a hash table to eliminate duplicate vars
        let vars = {};
        for (let i = 0; i < tokens.length; i++) {
            if (Token.isVariable(tokens[i]))
                vars[tokens[i]] = tokens[i];
        }

        // now load the variables into an array
        let vars_array = []
        for (let k in vars) {
            vars_array.push(vars[k]);
        }
        vars_array.sort();

        return vars_array;
    }

    parse();
}


