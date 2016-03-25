'use strict'

let OpenSubtitles = require('opensubtitles-api');

let path = require('path')
let debug = require('debug')('spectre:subtitle')
let wget = require('./helpers').wget

let download = Promise.coroutine(function* (info, conf) {
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

    let url = _.get(result, 'en[0].url') || _.get(result, 'en.url')
    return wget(url, subPath)
})

module.exports = {
    download
}
