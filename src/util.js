const { createReadStream } = require('fs')
const { createInterface } = require('readline')

async function processLineByLine(file) {
  return new Promise((resolve, reject) => {
    const objs = []
    const rl = createInterface({
      input: createReadStream(file),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      const obj = JSON.parse(line)
      objs.push(obj)
    })

    rl.on('close', () => resolve(objs))
  })
}

module.exports = {
  processLineByLine
}
