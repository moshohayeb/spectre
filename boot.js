'use strict'

module.exports = function () {
	GLOBAL.Promise = require('bluebird')
	GLOBAL._ = require('lodash')
	GLOBAL.sprintf = require('sprintf-js').sprintf
    Promise.promisifyAll(require('fs-extra'))
    Promise.promisifyAll(require('request'))
	Promise.promisifyAll(require("mkdirp"));

	// For debugging purposes
	GLOBAL.die = process.exit.bind(0)
}
