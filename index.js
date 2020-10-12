
const splitRegex = /(AND|OR|\(|\))/g

function toDnf(input) {
    console.log(input)
    let tokens = input.replace(/\s/g, '').split(splitRegex).filter(x => x !== '')
    console.log(tokens)
}



module.exports = toDnf
