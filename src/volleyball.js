'use strict'; // eslint-disable-line semi

const http = require('http')
const debug = require('debug')
const chalk = require('chalk')
const filesize = require('filesize')
const makeId = require('./id')

const sp = ' '

module.exports = Volleyball() // eslint-disable-line new-cap

function Volleyball (config = {}) {

  // items shared across multiple req-res cycles, for a given volleyball
  const log = getLogger(config.debug)

  function volleyball (req, res, next) {
    // items shared between the request and response of just one cycle
    const cycle = {
      log: log,
      id: makeId(),
      time: process.hrtime()
    }

    logReq(req, cycle)
    res.on('finish', () => logRes(res, cycle))
    res.on('close', () => logClose(res, cycle))

    next()
  }

  // factory method which does not expose any of the library internals
  volleyball.custom = (...args) => Volleyball(...args) // eslint-disable-line new-cap

  return volleyball
}

function getLogger (debugChoice) {
  if (!debugChoice) return defaultLogger
  if (debugChoice === true) return debug('http')
  if (typeof debugChoice === 'string') return debug(debugChoice)
  if (typeof debugChoice === 'function') return debugChoice
  throw Error('Invalid option for debug')
}

function defaultLogger (str) {
  process.stdout.write(str + '\n')
}

function logReq (req, cycle) {
  const bytes = +req.headers['content-length']
  const type = req.headers['content-type']

  let reqLine = `${cycle.id} ${chalk.dim('——>')} `
  reqLine += `${chalk.bold.underline(req.method)} ${req.url} `
  if (bytes) reqLine += chalk.blue(filesize(bytes)) + sp
  if (type) reqLine += chalk.blue.dim(type)

  cycle.log(reqLine)
}

function logRes (res, cycle) {
  const status = res.statusCode
  const meaning = http.STATUS_CODES[status]
  const bytes = +res.getHeader('content-length')
  const type = res.getHeader('content-type')

  const statusColor = colorForStatus(status)

  let resLine = `${cycle.id} ${chalk.dim('<——')} `
  resLine += chalk[statusColor](`${status} ${meaning}`) + sp
  if (bytes) resLine += chalk.blue(filesize(bytes)) + sp
  if (type) resLine += chalk.blue.dim(type) + sp
  resLine += chalk.dim(`(<—> ${msDiff(cycle.time)} ms)`)

  cycle.log(resLine)
}

function logClose (res, cycle) {
  let closeLine = `${cycle.id} ${chalk.dim('—X—')} `
  closeLine += chalk.red('connection closed before res end/flush')

  cycle.log(closeLine)
}

function colorForStatus (status) {
  if (status >= 500) return 'red'
  if (status >= 400) return 'yellow'
  if (status >= 300) return 'cyan'
  if (status >= 200) return 'green'
  return 'reset'
}

function msDiff (time) {
  var diff = process.hrtime(time)
  const seconds = diff[0]
  const nanoseconds = diff[1]
  const ms = (seconds * 1e9 + nanoseconds) / 1e6
  return ms.toFixed(1)
}
