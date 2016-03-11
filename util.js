'use strict'

let request = require('request')
let concat = require('concat-stream')
let parseTorrent = require('parse-torrent')
let fs = require('fs-extra')

exports.wget = function (url, localfile) {
    return new Promise(function (resolve, reject) {
        let ws = fs.createWriteStream(localfile)
        let req = request.get(url)
            .pipe(ws)
            .on('finish', resolve)
			.on('error', reject)
    })
}

exports.torrentToMagnet = function (torrentBuf) {
    let torrent = parseTorrent(torrentBuf)
    return parseTorrent.toMagnetURI(torrent)
}
