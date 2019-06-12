const meow = require('meow')
const decompress = require('decompress')
const ora = require('ora')
const { processLineByLine } = require('./util')
const deepDiff = require('deep-diff')
const fs = require('fs')
const path = require('path')
const md5File = require('md5-file')
const child_process = require('child_process')
const tempy = require('tempy')
const mv = require('mv')
const resolveFrom = require('resolve-from')
const copyDir = require('copy-dir')
const chalk = require('chalk')

const cli = meow(`
  About
    Tool for exporting and comparing Sanity datasets.
    This tool will create files and folders in current directory.

  Usage
    $ sanity-export-diff <dataset path A> <dataset path B> <path>
  Options
	  --studio-url-a URL to Content Studio for dataset A
	  --studio-url-B URL to Content Studio for dataset A
    --help Show this help
  Examples
    # Compare dataset 'production' with dataset 'staging' in project abcdef1
    # creating a webapp for visualizing the differences in web-files/
    #
    $ sanity-export-diff ../prod.tar.gz ../staging.tar.gz web-files
`,
  {
    boolean: [],
    alias: {
    }
  }
)

const { input, showHelp, flags } = cli

if (input.length !== 3) {
  showHelp()
  process.exit(1)
}

cli.input.slice(0, 1).forEach((input) => {
  if (!fs.existsSync(input)) {
    console.log('No such file or directory: ' + input)
    process.exit(1)
  }
})

async function doDecompress(path, destination = process.cwd()) {
  const spinner = ora(`Decompressing ${path}`).start()
  return decompress(path, destination)
    .then((res) => {
      spinner.succeed()
      const ndjson = res.find(data => data.path.endsWith('data.ndjson'))
      if (!ndjson) {
        throw new Error('No data.ndjson in archive')
      }
      return ndjson.path
    })
    .catch((err) => spinner.fail(err.msg))
}

const ignore = ['_rev', '_updatedAt', '_key', '_createdAt']

const clone = (val) => {
  if (Array.isArray(val)) {
    return val.map(clone)
  } else if (typeof val === 'object') {
    const c = {}
    Object.keys(val).forEach((key) => {
      if (!ignore.includes(key)) {
        c[key] = clone(val[key])
      }
    })

    return c
  }

  return val
}

Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .reduce((res, key) => (res[key] = obj[key], res), {})


async function compare(a, b, flags = {}) {
  const spinner = ora('Comparing datasets').start()

  const aO = await processLineByLine(a)
  const bO = await processLineByLine(b)

  const objects = {}
  const createIfMissing = type => {
    if (!objects[type]) {
      objects[type] = {
        added: [],
        removed: [],
        changed: [],
      }
    }
  }

  const noDifference = []
  aO.forEach((obj) => { 
    const rhs = bO.find(b => b._id === obj._id)
    if (rhs === undefined) {
      // Removed
      createIfMissing(obj._type)
      objects[obj._type].removed.push(obj)
      noDifference.push(obj._id)
    }
  })

  bO.forEach((obj) => { 
    const lhs = aO.find(a => a._id === obj._id)
    if (lhs === undefined) {
      // Added
      createIfMissing(obj._type)
      objects[obj._type].added.push(obj)
      noDifference.push(obj._id)
    }
  })

  const assetHashes = {}
  const pathA = path.parse(a)
  const pathB = path.parse(b)

  aO.filter(o => !noDifference.includes(o._id))
    .forEach((obj) => {
      const bObj = bO.find(o => o._id === obj._id)
      if (!bObj) {
        spinner.fail()
        throw new Error('whops, trying to compare to an object not found')
      }

      const aCmp = clone(obj)
      const bCmp = clone(bObj)

      const d = deepDiff(aCmp, bCmp)
      if (d) {
        const diff = d
          .filter(x => !ignore.includes(x.path))
          .filter((x) => {
            if (x.path[x.path.length - 1] === '_sanityAsset') {
              if (x.kind === 'E') {
                // Asset changed. Check if its the same file
                const fA = `${pathA.dir}/${x.lhs.replace('image@file://./', '')}`
                if (!assetHashes[fA]) {
                  assetHashes[fA] = md5File.sync(fA)
                }
                const fB = `${pathB.dir}/${x.rhs.replace('image@file://./', '')}`
                if (!assetHashes[fB]) {
                  assetHashes[fB] = md5File.sync(fB)
                }
                return assetHashes[fA] !== assetHashes[fB]
              }
            }

            return true
          })

        if (diff.length) {
          // Changed
          createIfMissing(obj._type)
          objects[obj._type].changed.push({
            lhs: obj,
            rhs: bObj
          })
        }
      }
  })

  const file = tempy.file()
  fs.writeFileSync(file, JSON.stringify({
    flags,
    objects
  }))

  spinner.succeed()
  return file
}

function dataFilePath(dir) {
  if (dir.endsWith('/')) {
    return dir + 'data.ndjson'
  }
  return dir + '/data.ndjson'
}

function isDir(path) {
  return fs.lstatSync(path).isDirectory()
}

function createApp(path) {
  return new Promise((resolve, reject) => {
    child_process.exec(`npx create-react-app ${path}`, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        console.log(stdout, stderr)
      } else {
        resolve(path)
      }
    })
  })
}

function exec(cmd) {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Moves a file
function move(from, to) {
  return new Promise((resolve, reject) => {
    mv(from, to, (err) => {
      if (err) {
        reject(err)
        console.error(err)
      } else {
        resolve()
      }
    })
  })
}

function copy(from, to) {
  return new Promise((resolve, reject) => {
    copyDir(from, to, {
      mode: true,    // keep file mode
    }, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function run(paths, flags = {}) {
  const outPath = paths[2]
  if (fs.existsSync(outPath)) {
    console.log(`The path ${outPath} exists!`)
    process.exit(1)
  }

  const tmpDir = tempy.directory()
  const dataA = isDir(paths[0]) ? dataFilePath(paths[0]) : await doDecompress(paths[0])
  const dataB = isDir(paths[1]) ? dataFilePath(paths[1]) : await doDecompress(paths[1])

  let spinner = new ora()
  await compare(dataA, dataB, flags)
    .then(dataFile => {
      spinner.text = 'Building website'
      spinner.start()

      return copy(`${__dirname}/../template`, tmpDir)
        .then(() => move(dataFile, `${tmpDir}/src/data.json`))
    })
    .then(() => {
      return exec(`cd ${tmpDir} && npm i`)
    })
    .then(() => {
      return exec(`cd ${tmpDir} && npm run build`)
    })
    .then(() => {
      return move(`${tmpDir}/build`, outPath)
    })
    .then(() => spinner.succeed())
    .then(() => {
      console.log(`
      All done!
      View the generated website at any time with the command

      ${chalk.green.bold(`npx serve -s ${outPath}`)}
      
      Or any other tool that can serve static html files
      `)
    })
    .catch((err) => {
      spinner.fail(err.msg)
      console.log(err)
    })
}

run(cli.input, flags)
