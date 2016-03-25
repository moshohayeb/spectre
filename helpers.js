'use strict'

let request = require('request')
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

exports.isAscii = function(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

exports.resolveHost = function (url) {
    return request.getAsync(url).then(rs => rs.request.uri.host)
}

exports.findQuality = function (title) {
    let re =  /480|720|1080/
    let result = re.exec(title)
    if (result === null) {
        return '480p'
    }

    return result[0] + 'p'
}
