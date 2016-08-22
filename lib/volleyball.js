'use strict'; // eslint-disable-line semi

var http = require('http');
var debug = require('debug');
var chalk = require('chalk');
var filesize = require('filesize');
var makeId = require('./id');

var sp = ' ';

module.exports = new Volleyball();

function Volleyball() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var logger = getLogger(config.debug);

  function volleyball(req, res, next) {
    var shared = {
      logger: logger,
      id: makeId(),
      time: process.hrtime()
    };

    logReq(req, shared);

    res.on('finish', function () {
      return logRes(res, shared);
    });
    res.on('close', function () {
      return logClose(res, shared);
    });

    next();
  }
  volleyball.custom = volleyballFactory;

  return volleyball;
}

function volleyballFactory() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(Volleyball, [null].concat(args)))();
}

function getLogger(debugChoice) {
  if (!debugChoice) return defaultLogger;
  if (debugChoice === true) return debug('http');
  if (typeof debugChoice === 'string') return debug(debugChoice);
  if (typeof debugChoice === 'function') return debugChoice;
}

function defaultLogger(str) {
  process.stdout.write(str + '\n');
}

function logReq(req, shared) {
  var bytes = +req.headers['content-length'];
  var type = req.headers['content-type'];

  var reqLine = shared.id + ' ' + chalk.dim('——>') + ' ';
  reqLine += chalk.bold.underline(req.method) + ' ' + req.url + ' ';
  if (bytes) reqLine += chalk.blue(filesize(bytes)) + sp;
  if (type) reqLine += chalk.blue.dim(type);

  shared.logger(reqLine);
}

function logRes(res, shared) {
  var status = res.statusCode;
  var meaning = http.STATUS_CODES[status];
  var bytes = +res.getHeader('content-length');
  var type = res.getHeader('content-type');

  var statusColor = void 0;
  if (status >= 500) statusColor = 'red';else if (status >= 400) statusColor = 'yellow';else if (status >= 300) statusColor = 'cyan';else if (status >= 200) statusColor = 'green';else statusColor = 'reset';

  var resLine = shared.id + ' ' + chalk.dim('<——') + ' ';
  resLine += chalk[statusColor](status + ' ' + meaning) + sp;
  if (bytes) resLine += chalk.blue(filesize(bytes)) + sp;
  if (type) resLine += chalk.blue.dim(type) + sp;
  resLine += chalk.dim('(<—> ' + msDiff(shared.time) + ' ms)');

  shared.logger(resLine);
}

function logClose(res, shared) {
  var closeLine = shared.id + ' ' + chalk.dim('—X—') + ' ';
  closeLine += chalk.red('connection closed before res end/flush');

  shared.logger(closeLine);
}

function msDiff(time) {
  var diff = process.hrtime(time);
  var seconds = diff[0];
  var nanoseconds = diff[1];
  var ms = (seconds * 1e9 + nanoseconds) / 1e6;
  return ms.toFixed(1);
}