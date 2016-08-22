'use strict'; // eslint-disable-line semi

const http = require('http')
const debug = require('debug')
const chalk = require('chalk')
const filesize = require('filesize')
const makeId = require('./id')

const sp = ' '

module.exports = new Volleyball()

function Volleyball (config = {}) {
  const logger = getLogger(config.debug)

  function volleyball (req, res, next) {
    const shared = {
      logger: logger,
      id: makeId(),
      time: process.hrtime()
    }

    logReq(req, shared)

    res.on('finish', () => logRes(res, shared))
    res.on('close', () => logClose(res, shared))

    next()
  }
  volleyball.custom = volleyballFactory

  return volleyball
}

function volleyballFactory (...args) {
  return new Volleyball(...args)
}

function getLogger (debugChoice) {
  if (!debugChoice) return defaultLogger
  if (debugChoice === true) return debug('http')
  if (typeof debugChoice === 'string') return debug(debugChoice)
  if (typeof debugChoice === 'function') return debugChoice
}

function defaultLogger (str) {
  process.stdout.write(str + '\n')
}

function logReq (req, shared) {
  const bytes = +req.headers['content-length']
  const type = req.headers['content-type']

  let reqLine = `${shared.id} ${chalk.dim('——>')} `
  reqLine += `${chalk.bold.underline(req.method)} ${req.url} `
  if (bytes) reqLine += chalk.blue(filesize(bytes)) + sp
  if (type) reqLine += chalk.blue.dim(type)

  shared.logger(reqLine)
}

function logRes (res, shared) {
  const status = res.statusCode
  const meaning = http.STATUS_CODES[status]
  const bytes = +res.getHeader('content-length')
  const type = res.getHeader('content-type')

  let statusColor
  if (status >= 500) statusColor = 'red'
  else if (status >= 400) statusColor = 'yellow'
  else if (status >= 300) statusColor = 'cyan'
  else if (status >= 200) statusColor = 'green'
  else statusColor = 'reset'

  let resLine = `${shared.id} ${chalk.dim('<——')} `
  resLine += chalk[statusColor](`${status} ${meaning}`) + sp
  if (bytes) resLine += chalk.blue(filesize(bytes)) + sp
  if (type) resLine += chalk.blue.dim(type) + sp
  resLine += chalk.dim(`(<—> ${msDiff(shared.time)} ms)`)

  shared.logger(resLine)
}

function logClose (res, shared) {
  let closeLine = `${shared.id} ${chalk.dim('—X—')} `
  closeLine += chalk.red('connection closed before res end/flush')

  shared.logger(closeLine)
}

function msDiff (time) {
  var diff = process.hrtime(time)
  const seconds = diff[0]
  const nanoseconds = diff[1]
  const ms = (seconds * 1e9 + nanoseconds) / 1e6
  return ms.toFixed(1)
}
