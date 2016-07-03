'use strict'

let chalk = require('chalk')
let winston = require('winston');


/* Override native Promise implementation (or add) globally */
global.Promise = require('bluebird')
global._ = require('lodash')
global.sprintf = require('sprintf-js').sprintf

/* Promisify modules */
Promise.promisifyAll(require('fs-extra'))
Promise.promisifyAll(require('request'))
Promise.promisifyAll(require("mkdirp"));

/* For debugging purposes */
global.die = function (msg) {
    console.log(chalk.red("EXIT(0) -> " + msg))
    process.exit(0)
}
