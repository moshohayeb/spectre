'use strict'

let querystring = require('querystring')
let util = require('util')

let moment = require('moment')
let cheerio = require('cheerio')
let request = require('request')
let debug = require('debug')('spectre:kickass')

let resolveHost = require('../helpers').resolveHost
let findQuality = require('../helpers').findQuality

const DIRECT_URL = 'http://kat.ph'
const SEARCH_URL = 'https://%s/usearch/%s%20category%3Amovies/%d/'
const PAGE_MAX = 2

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

module.exports = function (title) {
    debug('Searching kickass for title: %s', title)

    let processPage = function (host, page) {
        let url = __buildURL({ title, host, page })
        debug('Getting url: %s', url)
        return request.getAsync(url, { gzip: true } )
            .then(rs => {
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
                    let quality = findQuality(name)
                    return {
                        provider: 'kickass',
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
    }

    return resolveHost(DIRECT_URL)
        .then(resolvedHost => {
            return Promise.map(
                _.range(PAGE_MAX),
                _.partial(processPage, resolvedHost),
                { concurrency: 2 }
            )
        })
        .then(results => _.flatten(results) )
}
