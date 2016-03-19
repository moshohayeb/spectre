'use strict'

let querystring = require('querystring')
let util = require('util')

let moment = require('moment')
let cheerio = require('cheerio')
let prettybyte = require('pretty-bytes')
let request = require('request')
let debug = require('debug')('spectre:thepiratebay')

const DIRECT_URL = 'http://thepiratebay.se'
const SEARCH_URL = 'http://%s/search/%s/%d/99/%s/'

const DATE_REGEX = /Uploaded ([^,]+),/
const SIZE_REGEX = /Size ([^,]+),/
const PAGE_MAX = 1
const QUALITY = {
    201: '480p',
    202: '1080p',
    207: '720p',
}

let __resolveHost = function () {
    return request.getAsync(DIRECT_URL)
        .then(rs => rs.request.uri.host)
}

let __toByte = function (human) {
    let map = { 'GiB': 1000000000, 'MiB': 1000000, 'KiB': 1000, 'B': 1 }
    let byte, unit

    human = human.split(/\s+/)
    byte = human[0]
    unit = human[1]

    return +byte * map[unit]
}

let __toDay = function (human) {
    let now = moment()
    let release = moment(human, 'MM-DD YYYY');

    return now.diff(release, 'days')
}

let __buildURL = function (opts) {
    let title = querystring.escape(opts.title)
    let url = util.format(SEARCH_URL, opts.host, title, opts.page, 200)

    return url
}

module.exports = Promise.coroutine(function* (title) {
    debug('searching for: %s', title)
    let pages = _.range(PAGE_MAX)
    let host = yield __resolveHost()

    let result = yield Promise.map(pages, page => {
            let url = __buildURL({ title, host, page })
            debug('getting url: %s', url)
            return request.getAsync(url).then(rs => {
                    let $ = cheerio.load(rs.body)
                    let partial = _.map($('#searchResult tr'), title => {
                        let name = $('div.detName > a', title).text()
                        if (!name) return null
                        let quality = _.last($('td.vertTh > center > a:nth-child(3)').attr('href').split('/'))
                        let seeds = $('td:nth-child(3)', title).text()
                        let peers = $('td:nth-child(4)', title).text()
                        let freeleech = true
                        let age = __toDay(DATE_REGEX.exec($('.detDesc', title).text())[1] || '12-12 2000')
                        let size = __toByte(SIZE_REGEX.exec($('.detDesc', title).text())[1] || '0 GiB')
                        let magnet = $('td:nth-child(2) > a:nth-child(2)', title).attr('href')
                        return {
                            name,
                            age,
                            size,
                            seeds,
                            peers,
                            freeleech,
                            magnet,
                            quality: QUALITY[quality] || '480p'
                        }
                    })

                    return partial
                }) // getAsync then
        }, { concurrency: 2 }) // Promise Map

    result = _.flatten(result)
    if (!result) {
        debug('no match found for: "%s"', title)
    } else {
        debug('found %d results for: "%s"', result.length, title)
    }

    return result
})
