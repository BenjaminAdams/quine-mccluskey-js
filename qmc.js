//Quine–McCluskey algorithm


module.exports = function QuineMcCluskey(noOfVars, truthTableResult) {
    this.noOfVars = noOfVars;
    this.funcdata = truthTableResult
    this.minimalTermPrims = []
    this.primTermTables = []

    function bitCount(value) {
        let counter = 0;
        while (value > 0) {
            if ((value & 1) === 1) counter++;
            value >>= 1;
        }
        return counter;
    }

    this.createImplicantGroups = function () {
        let counter = 0;
        let lastIg = -1;
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
                        ig.group.push(impl);
                        continueLoop = true;
                    }
                }
            } else {

                for (let i = 0; i < lastIg.group.length; i++) {
                    for (let j = i + 1; j < lastIg.group.length; j++) {
                        let imp1 = lastIg.group[i];
                        let imp2 = lastIg.group[j];

                        if (imp1.bitMask === imp2.bitMask) {

                            let found = false;
                            let xor = -1;
                            for (let m in imp1.imp) {
                                for (let n in imp2.imp) {
                                    let i1 = imp1.imp[m];
                                    let i2 = imp2.imp[n];
                                    //console.log(i1 + "<->" + i2);
                                    xor = (i1 ^ i2) & (~imp1.bitMask);
                                    if (bitCount(xor) === 1) {
                                        //console.log("found merge candidate" + i1 + "<->" + i2);
                                        found = true;
                                    }
                                    break;
                                }
                                break;
                            }
                            if (found) {
                                imp1.isPrim = false;
                                imp2.isPrim = false;

                                let impl = new Implicant();
                                impl.isPrim = true;
                                impl.bitMask = imp1.bitMask | xor;
                                for (let m in imp1.imp)
                                    impl.imp[m] = parseInt(m);
                                for (let n in imp2.imp)
                                    impl.imp[n] = parseInt(n);

                                let foundMatch = false; // determine if this combination is already there
                                for (let k = 0; k < ig.group.length; k++) {
                                    let exist = ig.group[k];
                                    let isTheSame = true;
                                    for (let m in impl.imp) {
                                        let found = false;
                                        for (let n in exist.imp) {
                                            if (parseInt(m) === parseInt(n)) {
                                                found = true;
                                            }
                                        }
                                        if (!found) {
                                            isTheSame = false;
                                            break;
                                        }
                                    }
                                    if (isTheSame) {
                                        foundMatch = true;
                                        break;
                                    }
                                }
                                if (!foundMatch) {
                                    ig.group.push(impl);
                                    continueLoop = true;
                                }
                            }
                        }
                    }
                }
            }

            if (continueLoop) implicantGroups.push(ig);
            lastIg = ig;
            counter++;
        }
        return implicantGroups
    }

    this.compute = function () {
        this.minimalTerm = "0";

        let implicantGroups = this.createImplicantGroups()

        // collect primterms
        let primTerms = this.collectPrimterms(implicantGroups)

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
                let prevTable = this.primTermTables[primTableLoop - 1];
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
                this.primTermTables.push(primTermTable);
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
                            this.minimalTermPrims.push(currentTerms[term]);
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
            } else {
                if (!primTableFound) {
                    cyclicCoveringFound = true;
                    console.error(`petrickSolver is commented out, was not sure if I needed it or not`)
                }
            }

            primTableLoop++;
        }

        let solutionFound = true;


        if (solutionFound) {
            return this.minimalTermPrims.map(x => x.termString);
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

                            // minTerm = "(" + minTerm + ")";
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
    this.color = [0, 0, 0];
    this.coloredTermString = "";
    this.used = false;
    this.neededByVar = {}
}

function Implicant() {
    this.imp = {}
    this.isPrim = false;
    this.isOnlyDontCare = false;
    this.bitMask = 0;
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






















// function PetrickMethod() {
//     this.problem;
//     this.maxProblemSize = 100;
//     this.solution;
//     this.log = "";
//     let that = this;

//     this.solve = function (eq) {

//         this.problem = eq;
//         this.log = "";

//         // multiply out
//         let andArray = eq;
//         let loopCounter = 0;
//         while (andArray.length > 1) {
//             let newAndArray = []
//             for (let i = 1; i < andArray.length; i += 2) {

//                 let orTermA = andArray[i - 1];
//                 let orTermB = andArray[i];
//                 let newOrArray = []
//                 for (let a = 0; a < orTermA.length; a++) {
//                     for (let b = 0; b < orTermB.length; b++) {
//                         let monom1 = orTermA[a];
//                         let monom2 = orTermB[b];
//                         let resultingMonom = {}
//                         for (let m in monom1) {
//                             resultingMonom[monom1[m]] = monom1[m];
//                         }
//                         for (let n in monom2) {
//                             resultingMonom[monom2[n]] = monom2[n];
//                         }
//                         newOrArray.push(resultingMonom);
//                     }
//                 }

//                 newAndArray.push(newOrArray);
//             }
//             // if uneven copy last and-term
//             if (andArray.length % 2 === 1) {
//                 newAndArray.push(andArray[andArray.length - 1]);
//             }


//             // simplify or-term
//             for (let i = 0; i < newAndArray.length; i++) {
//                 let orTerm = newAndArray[i];
//                 let newOrTerm = simplifyOrTerm(orTerm);
//                 if (newOrTerm.length > 0) {
//                     andArray.push(newOrTerm);
//                 }
//             }

//             let problemSize = eqnArrayProblemSize(andArray);
//             if (problemSize > this.maxProblemSize) {
//                 console.log("Error: The cyclic covering problem is too large to be solved with Petrick's method (increase maxProblemSize). Size=" + problemSize);
//                 return false;
//             }

//             loopCounter++;
//         }
//         this.solution = andArray;
//         return true;
//     };

//     function simplifyOrTerm(orTerm) {
//         // find a monom that is the same or simpler than another one
//         let newOrTerm = []
//         let markedForDeletion = {}
//         for (let a = 0; a < orTerm.length; a++) {
//             let keepA = true;
//             let monomA = orTerm[a];
//             for (let b = a + 1; b < orTerm.length && keepA; b++) {
//                 let monomB = orTerm[b];
//                 let overlapBoverA = 0;
//                 let lengthA = 0;
//                 for (let m in monomA) {
//                     if (monomB[m] in monomA) {
//                         overlapBoverA++;
//                     }
//                     lengthA++;
//                 }

//                 let overlapAoverB = 0;
//                 let lengthB = 0;
//                 for (let m in monomB) {
//                     if (monomA[m] in monomB) {
//                         overlapAoverB++;
//                     }
//                     lengthB++;
//                 }

//                 if (overlapBoverA === lengthB) {
//                     keepA = false;
//                 }

//                 if (lengthA < lengthB && overlapAoverB === lengthA) {
//                     markedForDeletion[b] = b;
//                 }

//             }
//             if (keepA) {
//                 if (a in markedForDeletion) {
//                     // do nothing
//                 } else
//                     newOrTerm.push(orTerm[a]);
//             }
//         }
//         return newOrTerm;
//     }

//     function eqnArrayProblemSize(andArray) {
//         let monomCounter = 0;
//         for (let i = 0; i < andArray.length; i++) {
//             let orArray = andArray[i];
//             monomCounter += orArray.length;
//         }
//         return monomCounter;
//     }
// }

