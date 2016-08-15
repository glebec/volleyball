'use strict'; // eslint-disable-line semi
const supertest = require('supertest')
const expect = require('chai').expect
const express = require('express')
const chalk = require('chalk')
const debug = require('debug')
debug.log = console.log.bind(console)
const volleyball = require('../lib/volleyball')

describe('volleyball', function () {

  it('is middleware', function () {
    expect(volleyball).to.be.a('function')
    expect(volleyball).to.have.length(3)
  })

})

describe('An Express app', function () {

  const originalWrite = process.stdout.write
  let app, client, record
  beforeEach(function () {
    record = ''
    process.stdout.write = function (str) {
      record += chalk.stripColor(str)
      originalWrite.call(process.stdout, str)
    }
    app = express()
    client = supertest(app)
  })

  afterEach(function () {
    process.stdout.write = originalWrite
  })

  function test (done) {
    client.get('/')
    .expect(404)
    .end(function (err) {
      if (err) return done(err)
      expect(record).to.match(/GET \/[\s\S]+404 Not Found/gm)
      done()
    })
  }

  describe('using volleyball', function () {

    beforeEach(function () {
      app.use(volleyball)
    })

    it('logs requests and responses', test)

  })

  describe('using volleyball with debug true', function () {

    beforeEach(function () {
      app.use(volleyball.custom({debug: true}))
    })

    it('logs requests and responses', test)

  })

  describe('using volleyball with debug custom', function () {

    beforeEach(function () {
      app.use(volleyball.custom({debug: 'custom'}))
    })

    it('logs requests and responses', test)

  })

})
