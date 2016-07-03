'use strict'

let cheerio = require('cheerio')
let request = require('request')

let url = require('url');
let urljoin = require('url-join')

let fetcher = function (list) {
    // Google's US IP address to prevent title translation
    return request.getAsync(list, { headers: {'X-Forwarded-For': '64.233.160.33'}})
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

let fetch = function (links) {
    return Promise.map(links, fetcher, 4)
        .then(results => _(results).flatten().uniq().value() )
}

module.exports = {
    fetch
}
