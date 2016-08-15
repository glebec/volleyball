'use strict'; // eslint-disable-line semi

const chalk = require('chalk')

const nextColor = (function () {
  const colors = ['red', 'green', 'yellow', 'cyan', 'magenta']
  let i = 0
  return function () {
    return colors[i++ % colors.length]
  }
}())

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const LEN = 4

module.exports = function makeId () {
  const color = nextColor()
  let id = '', i = LEN
  while (i--) id += CHARS.substr(Math.random() * CHARS.length, 1)
  return chalk.dim[color](id)
}
