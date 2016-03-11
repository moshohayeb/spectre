(function() {
	'use strict'

	let Promise      = require('bluebird')
	let debug        = require('debug')('spectre:transmission')
	let os           = require('os')

	let transmission   = require('transmission')
	Promise.promisifyAll(transmission.prototype)

	function Transmission(opts) {
	    if (!(this instanceof Transmission)) return new Transmission(opts)
		this.client = new transmission(opts)
	}

	Transmission.prototype.download = function (torrent, opts) {
		let dir = opts.dir || os.tmpdir()
		debug(`start downloading ${torrent.name}`)
		return this.client.addUrlAsync(torrent.magnet, { 'download-dir': dir })
	}

	module.exports = Transmission
}());
