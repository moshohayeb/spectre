'use strict'

module.exports = function () {
    /* Override native Promise implementation (or add) globally */
    global.Promise = require('bluebird')
    global._ = require('lodash')
    global.sprintf = require('sprintf-js').sprintf

    /* Promisify modules */
    Promise.promisifyAll(require('fs-extra'))
    Promise.promisifyAll(require('request'))
    Promise.promisifyAll(require("mkdirp"));

    // For debugging purposes
    global.die = process.exit.bind(0)
}
