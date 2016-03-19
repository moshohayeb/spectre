'use strict'

let cheerio = require('cheerio')
let request = require('request')

let urljoin = require('url-join')

let getlist = Promise.coroutine(function* (list) {
	let rs = yield request.getAsync(list)
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

module.exports = Promise.coroutine(function* (lists) {
	let p = _.map(lists, getlist)
	let results = yield Promise.all(p)
	return _(results).flatten().uniq().value()
})
