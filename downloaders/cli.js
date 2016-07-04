'use strict'

 // "http://www.imdb.com/list/ls036922884/",
 // "http://www.imdb.com/list/ls036788022/",
 // "http://www.imdb.com/user/ur40260900/watchlist?ref_=wt_nv_wl_all_0"


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

            // Download all files in the torrent
            _.each(engine.files, f => f.select())

            // Set a progress reporter
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
            engine.destroy(() => resolve(retval))
        })
    }

    return new Promise(resolver)
}
