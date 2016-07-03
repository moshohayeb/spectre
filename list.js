'use strict'

let cheerio = require('cheerio')
let request = require('request')

let urljoin = require('url-join')

let fetcher = function (list) {
    return request.getAsync(list)
        .then(rs => {
            let $ = cheerio.load(rs.body)
            let titles = []
            let headers

            // main watchlist format;
            headers = $('.list_item')
            headers.each((idx, element) => {
                titles.push(($('a', '.info', element).html()))
            })

            // additional lists format
            headers = $('.lister-item-header')
            headers.each((idx, element) => {
                titles.push($('a', element).html())
            })

            return titles
        })
}

let fetch = function (lists) {
    return Promise.map(lists, fetcher, 4)
        .then(results => {
            return _(results).flatten().uniq().value()
        })
}

module.exports = {
    fetch
}
