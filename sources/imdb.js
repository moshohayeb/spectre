'use strict'

let cheerio = require('cheerio')
let request = require('request')

let urljoin = require('url-join')

let BASE = 'http://www.imdb.com'

module.exports = Promise.coroutine(function* (reqlist) {
	let url = urljoin(BASE, reqlist)
	let rs = yield request.getAsync(url)
	let $ = cheerio.load(rs.body)
	let titles = []

	let headers = $('.lister-item-header')
	headers.each((idx, element) => {
		titles.push($('a', element).html())
	})

	return titles
})
