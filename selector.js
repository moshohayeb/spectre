'use strict'

let debug = require('debug')('spectre:selector')

let similarity = require("similarity")
let moment = require('moment')
let prettybyte = require('pretty-bytes');

let helpers = require('./helpers')


let crediableUploaders = ['ETRG', 'YIFY', 'JYK', 'SPARKS', 'RARBG', 'ANOXMOUS', 'NVEE', 'TUGAZX', 'MKVCAGE', 'SHAANIG']
let execludedKw = ['rus', 'russian', 'ru', '3d', 'cam', 'hindi']

let includeName = function (torrent, ctx) {
    let kebab = _.kebabCase(torrent.parsedName)
    let included = _.includes(kebab, ctx.kebab)
    return included
}

let similarName = function (torrent, ctx) {
    let sim = similarity(torrent.parsedName, ctx.title)
    let thresh = 0.8

    return sim >= thresh
}

let execludeKeywords = function (torrent, ctx) {
    let words = _.words(torrent.name)
    words = _.map(words, w =>  w.toLowerCase() )
    return !_.intersection(words, execludedKw).length
}

let ensureAscii = function (torrent, ctx) {
    return helpers.isAscii(torrent.name)
}

let crediable = function (torrent, ctx) {
    if (!ctx.options.onlyCrediable) return true

    let segments = _.words(torrent.name)
    let cds = _.words(_.join(crediableUploaders, ' '))
    let xsect = _.intersection(segments, cds)
    return xsect.length
}

let sizeCheck = function (torrent, ctx) {
    if (torrent.size <= ctx.options.maxSize && torrent.size >= ctx.options.minSize) return true
    return false
}

let removeZeroSeeds = function (torrent, ctx) {
    return torrent.seeds != 0
}

let computeScore = function (torrent, ctx) {
    let score = 0

    // 20 point for seeds
    if (torrent.seeds > 1000) score += 20
    else if (_.inRange(torrent.seeds, 100, 1000)) score += 15
    else if (_.inRange(torrent.seeds, 10, 100)) score += 10
    else if (_.inRange(torrent.seeds, 5, 10)) score += 5
    else score += 0

    // 20 point for peers
    if (torrent.peers > 1000) score += 20
    else if (_.inRange(torrent.peers, 100, 1000)) score += 15
    else if (_.inRange(torrent.peers, 10, 100)) score += 10
    else if (_.inRange(torrent.peers, 5, 10)) score += 5
    else score += 0

    // 60 points for being from a crediable uploader
    if (crediable(torrent, ctx)) score += 60
    else score += 0

    // 30 Points 20 1080p, 15 for 720p
    if (torrent.quality == '1080p') score += 30
    else if (torrent.quality == '720p') score += 15
    else score += 0

    // Give freeleech extra
    if (torrent.freeleech) score += 10

    // Give optimal size extra points
    if (_.inRange(torrent.size, ctx.options.minPreferSize, ctx.options.maxPreferSize))
        score += 30

    torrent.score = score
}

let augmentName = function (torrent) {
    let { name } = torrent
    /* By convention, the format of a title is:  Title (Year) Quality */
    let index = /\(?\d{4}\)?/.exec(name)
    if (!index) {
        index = /1080p|720p|480p/.exec(name)
    }

    let sname
    if (index) {
        sname = name.substring(0, index['index'])
    } else {
        sname = name
    }

    torrent.parsedName = _.trim(sname)
}

module.exports = function (title, torrents, options) {
    let ctx = {
        title,
        kebab: _.kebabCase(title),
        lower: _.lowerCase(title),
        options
    }

    let wrap = function (fn) {
        return _.partial(fn, _, ctx)
    }

    let torrent =
        _.chain(torrents)
        .compact()
        .each(augmentName)
        .filter(wrap(includeName))
        .filter(wrap(similarName))
        .filter(wrap(execludeKeywords))
        .filter(wrap(ensureAscii))
        .filter(wrap(crediable))
        .filter(wrap(sizeCheck))
        .tap(console.log)
        .filter(wrap(removeZeroSeeds))
        /* Add more filters here*/
        .each(wrap(computeScore))
        .orderBy('score', 'desc')
        .first()
        .value()

    if (!torrent) return null
    if (options.minScore && torrent.score < torrent.score) return null

    debug('Chosen torrent for title: "%s" -%s- %s:%s:%s:%s score=%s',
        title, torrent.name, torrent.provider, torrent.seeds, torrent.peers, prettybyte(torrent.size), torrent.score)

    die('xx')
    return torrent
}
