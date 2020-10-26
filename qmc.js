//Quine–McCluskey algorithm
var _ = require('lodash');

module.exports = function QuineMcCluskey(noOfVars, truthTableResult) {
    this.noOfVars = noOfVars;
    this.funcdata = truthTableResult


    function bitCount(value) {
        let counter = 0;
        while (value > 0) {
            if ((value & 1) === 1) counter++;
            value >>= 1;
        }
        return counter;
    }

    this.findMergeCandidate = function (imp1, imp2) {
        let xor = -1;
        for (let m in imp1.imp) {
            for (let n in imp2.imp) {
                let i1 = imp1.imp[m];
                let i2 = imp2.imp[n];
                //console.log(i1 + "<->" + i2);
                xor = (i1 ^ i2) & (~imp1.bitMask);
                if (bitCount(xor) === 1) {
                    // console.log("found merge candidate" + i1 + "<->" + i2);
                    return { found: true, xor: xor }
                }
                break;
            }
            break;
        }
        return { found: false, xor: xor }
    }

    //97% of CPU time is spent here in findInGroupMatch() and createImplicantGroups
    // determine if this combination of implicants is already in the group
    this.findInGroupMatch = function (group, impl) {
        let res = _.findIndex(group, function (existing) {
            return existing.hash === impl.hash
            //console.log(self.findInGroupMatchWasCalled++)
            //  return _.isEqual(impl.imp, existing.imp)
        });
        return res > -1
    }

    this.howMany = 0

    //very high CPU usage from this function!
    this.createImplicantGroups = function () {
        let counter = 0;
        let lastIg = null;
        let continueLoop = true;
        let implicantGroups = []
        while (continueLoop) {

            continueLoop = false;
            let ig = new ImplicantGroup();

            if (counter === 0) {
                for (let i = 0; i < this.funcdata.length; i++) {
                    if (this.funcdata[i] > 0) {
                        let impl = new Implicant();
                        impl.imp[i] = i;
                        impl.isPrim = true;
                        impl.calculateHash()
                        ig.group.push(impl);
                        continueLoop = true;
                    }
                }
            } else {
                continueLoop = this.compareLastGroup(lastIg, ig)
            }

            if (continueLoop) implicantGroups.push(ig);
            lastIg = ig;
            counter++;
        }
        return implicantGroups
    }

    this.compareLastGroup = function (lastIg, ig) {
        let continueLoop = false
        for (let i = 0; i < lastIg.group.length; i++) {
            for (let j = i + 1; j < lastIg.group.length; j++) {
                let imp1 = lastIg.group[i];
                let imp2 = lastIg.group[j];
                // console.log(this.howMany++)

                if (imp1.bitMask !== imp2.bitMask) continue;

                let candidates = this.findMergeCandidate(imp1, imp2)

                if (candidates.found) {
                    imp1.isPrim = false;
                    imp2.isPrim = false;

                    let impl = new Implicant();
                    impl.isPrim = true;
                    impl.bitMask = imp1.bitMask | candidates.xor;
                    for (let m in imp1.imp)
                        impl.imp[m] = parseInt(m);
                    for (let n in imp2.imp)
                        impl.imp[n] = parseInt(n);

                    impl.calculateHash()
                    let foundMatch = this.findInGroupMatch(ig.group, impl)

                    if (!foundMatch) {
                        ig.group.push(impl);
                        continueLoop = true;
                    }
                }

            }
        }
        return continueLoop
    }

    this.collectEssentialPrimterms = function (primTerms) {
        let minimalTermPrims = []
        let primTermTables = []
        // looking for essential prime implicants 
        let remaining = {}
        for (let i = 0; i < this.funcdata.length; i++) {
            if (this.funcdata[i] === 1) {
                remaining[i] = i;
            }
        }


        let primTableLoop = 0;
        let primTableFound = (primTerms.length > 0);
        let cyclicCoveringFound = false;
        let primTermTable;
        while (primTableFound) {

            primTableFound = false;

            primTermTable = new PrimTermTable(primTableLoop);
            for (let r in remaining) {
                primTermTable.remainingVars.push(remaining[r]);
            }

            if (primTableLoop === 0) {
                for (let j = 0; j < primTerms.length; j++) {
                    primTermTable.remainingPrimTerms.push(primTerms[j]);
                }
            } else {
                // remove rows
                let prevTable = primTermTables[primTableLoop - 1];
                for (let k = 0; k < prevTable.remainingPrimTerms.length; k++) {
                    if (!prevTable.remainingPrimTerms[k].used) {

                        let superseded = false;
                        let impA = prevTable.remainingPrimTerms[k].implicant.imp;
                        let varCover = {}
                        let countA = 0;
                        for (let r in remaining) {
                            let v = remaining[r];
                            if (v in impA) {
                                varCover[v] = v;
                                countA++;
                            }
                        }

                        for (let l = 0; l < prevTable.remainingPrimTerms.length && !superseded; l++) {
                            if (!prevTable.remainingPrimTerms[l].used && k !== l) {
                                let impB = prevTable.remainingPrimTerms[l].implicant.imp;
                                let countB = 0;
                                for (let r in varCover) {
                                    let v = varCover[r];
                                    if (v in impB) {
                                        countB++;
                                    }
                                }
                                if (countA === countB) {
                                    let countBInRemaining = 0;
                                    for (let r in remaining) {
                                        let v = remaining[r];
                                        if (v in impB) {
                                            countBInRemaining++;
                                        }
                                    }
                                    if (countBInRemaining > countA) {
                                        superseded = true;
                                    } else {
                                        if (k > l) {
                                            superseded = true;
                                        }
                                    }
                                }

                            }
                        }

                        if (!superseded) {
                            primTermTable.remainingPrimTerms.push(prevTable.remainingPrimTerms[k]);
                        } else {
                            prevTable.supersededPrimTerms.push(prevTable.remainingPrimTerms[k]);
                        }
                    }
                }
            }

            let remainingCount = 0;
            if (primTermTable.remainingPrimTerms.length > 0) {
                primTermTables.push(primTermTable);
                let currentTerms = primTermTable.remainingPrimTerms;

                let toBeRemoved = {}

                for (let r in remaining) {
                    let i = remaining[r];
                    let count = 0;
                    let term = -1;
                    for (let j = 0; j < currentTerms.length && count < 2; j++) {
                        if (i in currentTerms[j].implicant.imp) {
                            term = j;
                            count++;
                        }
                    }

                    if (count === 1) {
                        currentTerms[term].neededByVar[i] = primTableLoop;
                        if (!currentTerms[term].used) {
                            minimalTermPrims.push(currentTerms[term]);
                            currentTerms[term].used = true;
                            primTermTable.essentialPrimTerms.push(currentTerms[term]);
                            primTableFound = true;

                            for (let r in remaining) {
                                let ii = remaining[r];
                                if (ii in currentTerms[term].implicant.imp) {
                                    toBeRemoved[ii] = ii;
                                }
                            }
                        }
                    }
                }

                // remove columns
                let tmpRemaining = {}
                for (let e in remaining) {
                    let ee = remaining[e];
                    tmpRemaining[ee] = ee;
                    delete remaining[e];
                }
                remainingCount = 0;
                for (let r in tmpRemaining) {
                    let t = tmpRemaining[r];
                    if (!(t in toBeRemoved)) {
                        remaining[t] = t;
                        remainingCount++;
                    }
                }
            }

            if (remainingCount === 0) {
                primTableFound = false; // break loop
                break;
            } else {
                if (!primTableFound) {
                    cyclicCoveringFound = true;
                    console.error(`petrickSolver is commented out, was not sure if I needed it or not`)
                }
            }

            primTableLoop++;
        }
        return minimalTermPrims
    }

    this.compute = function () {
        let start = Date.now()
        let implicantGroups = this.createImplicantGroups()
        console.log(`this.createImplicantGroups() took ${Date.now() - start}ms`)


        start = Date.now()
        let primTerms = this.collectPrimterms(implicantGroups)
        console.log(`this.collectPrimterms() took ${Date.now() - start}ms`)


        start = Date.now()
        let minimalTermPrims = this.collectEssentialPrimterms(primTerms)
        console.log(`this.collectEssentialPrimterms() took ${Date.now() - start}ms`)


        if (minimalTermPrims && minimalTermPrims.length > 0) {
            return minimalTermPrims.map(x => x.termString);
        } else {
            console.error('Error: The cyclic covering problem is too large (increase the "maxProblemSize" parameter)')
            return []
        }
    }

    this.collectPrimterms = function (implicantGroups) {
        let primTerms = []
        for (let i = implicantGroups.length - 1; i >= 0; i--) {
            let g = implicantGroups[i].group;

            for (let j = 0; j < g.length; j++) {
                if (g[j].isPrim) {

                    // prim terms introduced by don't cares
                    // must have at least one 1
                    let containsOne = false;
                    let allFuncPrimTerm = g[j].imp;
                    for (let kk in allFuncPrimTerm) {
                        let k = allFuncPrimTerm[kk];
                        if (this.funcdata[k] === 1) {
                            containsOne = true;
                            break;
                        }
                    }

                    if (!containsOne) {
                        g[j].isOnlyDontCare = true;
                    } else {
                        let primTerm = new PrimTerm();
                        primTerm.implicant = g[j];

                        // extract minTerm as string
                        for (let thisVal in primTerm.implicant.imp) {
                            let minTerm = "";
                            let one = 1;
                            let needed = (~primTerm.implicant.bitMask);
                            for (let v = 0; v < this.noOfVars; v++) {
                                if ((needed & one) === one) {
                                    if ((thisVal & one) === one) {
                                        minTerm = "x" + v + minTerm;
                                    } else {
                                        minTerm = "x!" + v + minTerm;
                                    }
                                }
                                one = one << 1;
                            }


                            if (primTerm.implicant.bitMask === Math.pow(2, this.noOfVars) - 1)
                                minTerm = "1";

                            primTerm.termString = minTerm;
                            break;
                        }

                        primTerms.push(primTerm);
                    }
                }
            }
        }
        return primTerms
    }

    return this.compute()
}




function PrimTerm() {
    this.implicant = -1;
    this.termString = "";
    this.used = false;
    this.neededByVar = {}
}

function Implicant() {
    this.imp = {}
    this.isPrim = false;
    this.isOnlyDontCare = false;
    this.bitMask = 0;

    this.calculateHash = function () {
        this.hash = JSON.stringify(this.imp);
        // let hash = '';
        // for (let num in this.imp) {
        //     hash += `_${num}_`
        // }
        // this.hash = hash
    }


}

function ImplicantGroup() {
    this.group = [];
    this.order = -1;
}

function PrimTermTable(ord) {
    this.essentialPrimTerms = []
    this.order = ord;
    this.remainingVars = []
    this.remainingPrimTerms = []
    this.supersededPrimTerms = []
}


















