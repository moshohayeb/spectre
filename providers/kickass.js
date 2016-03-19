'use strict'

let querystring = require('querystring')
let util = require('util')

let moment = require('moment')
let cheerio = require('cheerio')
let prettybyte = require('pretty-bytes')
let request = require('request')
let debug = require('debug')('spectre:kickass')

const DIRECT_URL = 'http://kat.ph'
const SEARCH_URL = 'https://%s/usearch/%s%20category%3Amovies/%d/'

const PAGE_MAX = 3

let __resolveHost = function () {
    return request.getAsync(DIRECT_URL).then(rs => rs.request.uri.host)
}

let __toByte = function (human) {
    let map = { 'GB': 1000000000, 'MB': 1000000, 'KB': 1000, 'B': 1 }
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
    let url = util.format(SEARCH_URL, opts.host, title, opts.page)

    return url
}

module.exports = Promise.coroutine(function* (title) {
    debug('searching for: %s', title)
    let pages = _.range(PAGE_MAX)
    let host = yield __resolveHost()

    let result = yield Promise.map(pages, page => {
        let url = __buildURL({ title, host, page })
        debug('getting url: %s', url)
        return request.getAsync(url, {gzip: true}).then(rs => {
            let $ = cheerio.load(rs.body)
            let rows = $('.odd, .even', '.data')
            let partial = _.map(rows, title => {
                let name = $('.cellMainLink', title).text()
                if (!name) return null
                let age = $('td:nth-child(4)', title).text()
                let size = __toByte($('td:nth-child(2)', title).text())
                let seeds = $('td:nth-child(5)', title).text()
                let peers = $('td:nth-child(6)', title).text()
                let freeleech = true
                let magnet = $('a', '.iaconbox', title).last().prev().attr('href')
                let quality = '720p' // TODO: Fix
                return {
                    name,
                    age,
                    size,
                    seeds,
                    peers,
                    freeleech,
                    magnet,
                    quality
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