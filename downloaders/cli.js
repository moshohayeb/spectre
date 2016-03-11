'use strict'

let torrentStream = require('torrent-stream')
let prettybyte = require('pretty-bytes')
let Promise = require('bluebird')
let _ = require('lodash')
let debug = require('debug')('spectre:cli')
let path = require('path')

let conf = require('../conf')

let magnet = 'magnet:?xt=urn:btih:4f228cc234ef41aa8548abade50b37f2da9dae00&dn=GTA+V+Trailer&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969'

module.exports = function (torrent, opts) {

	debug('attempting to download: %s', torrent.name)

	let resolver = function (resolve, reject) {
		// let engine = torrentStream(magnet, { path: conf.tmpDir })
		let engine = torrentStream(torrent.magnet, { path: conf.tmpDir })
		let reporter
		let rv = { }

		engine.on('ready', () => {
			let swarm = engine.swarm

			// download all files in the torrent
			_.each(engine.files, f => f.select())

			// set a progress reporter
			reporter = setInterval(function() {
				let percentage = ((swarm.downloaded / engine.torrent.length) * 100).toPrecision(2)
				debug('%s, speed: %s/s, progress: %s/%s (%d%%)',
					torrent.name,
					prettybyte(swarm.downloadSpeed()),
					prettybyte(swarm.downloaded), prettybyte(engine.torrent.length),
					percentage
				)
			}, 5000)
		})

		engine.on('idle', () => {
			clearInterval(reporter)
			rv.files = _.map(engine.files, f => {
				return {
					path: path.join(conf.tmpDir, f.path),
					size: f.length
				}
			})
			resolve(rv)
		})
	}

	return new Promise(resolver)
}
