'use strict'

let OpenSubtitles = require('opensubtitles-api');

let path = require('path')
let debug = require('debug')('spectre:subtitle')
let util = require('./util')

let download = Promise.coroutine(function* (info) {
    let os = new OpenSubtitles({ useragent: 'OSTestUserAgent' })
    debug('downloading subtitle for title: %s', info.metadata.title)
    let name = info.movie.name
    let basename = name.substring(0, _.lastIndexOf(name, '.')) + '.srt'
    let subPath = path.join(info.movie.dir, basename)
    let result = yield os.search({
        extensions: ['srt'],
        sublanguageid: 'eng',
        path: info.movie.path,
        imdbid: info.metadata.imdbId,
        filename: info.movie.oldName,
        limit: 10
    })

    // TODO: Better way of picking subtitles
    let url = _.get(result, 'en[0].url') || _.get(result, 'en.url')
    return util.wget(url, subPath)
})

module.exports = {
    download
}
