'use strict'

let torrentStream = require('torrent-stream')
let prettybyte = require('pretty-bytes')
let debug = require('debug')('spectre:cli')
let path = require('path')

module.exports = function (torrent, conf) {

    debug('Attempting to download: %s', torrent.name)

    let resolver = function (resolve, reject) {
        let engine = torrentStream(torrent.magnet, { path: conf.tmpDir })
        let reporter
        let retval = {}

        engine.on('ready', () => {
            let swarm = engine.swarm

            // download all files in the torrent
            _.each(engine.files, f => f.select())

            // set a progress reporter
            reporter = setInterval(function () {
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
            retval.files = _.map(engine.files, f => {
                return {
                    path: path.join(conf.tmpDir, f.path),
                    size: f.length
                }
            })
            resolve(retval)
        })
    }

    return new Promise(resolver)
}
