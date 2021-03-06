#!/usr/bin/env node

const path = require('path')
try {
  const SegfaultHandler = require('segfault-handler')
  SegfaultHandler.registerHandler("crash.log")
} catch (err) {}

// load .env
require('dotenv').config()

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    c: 'conf',
  },
  default: {
    conf: './conf/silly.json',
    repl: true
  },
  boolean: [
    'repl'
  ]
})

const debug = require('debug')('tradle:bot:scaffold')
const {
  co,
  normalizeConf,
  forceLog
} = require('./lib/utils')

const confPath = path.resolve(process.cwd(), argv.conf)
const conf = normalizeConf(require(confPath))
conf.autostart = false

const app = require('./lib/app')(conf)
const init = co(function* init () {
//   log(`
// Awaiting webhook POSTs at:     ${conf.webhookURL}
// Expecting provider API at:     ${conf.providerURL}
// Databases will be stored in:   ${conf.dir}
// `)

  try {
    yield app.health()
    log('feeling FANtastic')
  } catch (err) {
    log(`Error: PROVIDER COULD NOT BE REACHED at ${conf.providerURL}\n`, err.message)
  }

  const { bot, router } = app
  if (conf.strategies) {
    conf.strategies.forEach(relPath => {
      const absPath = path.resolve(process.cwd(), relPath)
      log('Using strategy from ' + absPath)
      bot.strategies.use(require(absPath), { router })
    })
  }

  if (argv.repl) {
    const pepperIcon = '\uD83C\uDF36  '
    const prompt = typeof conf.repl === 'string' ? conf.repl : pepperIcon
    require('./lib/repl')({ prompt, app })
  }

  bot.start()
})

init().catch(err => {
  log('Exiting due to error', err)
  process.exit(1)
})

function log (...args) {
  forceLog(debug, ...args)
}
