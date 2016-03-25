'use strict'

// let dvd = function (torrent, ctx) {
// 	let today = moment()
// 	let dvddate = moment(metadata.dvd, "DD MMM YYYY");
// 	if (dvddate.isAfter(today)) {
// 		throw new Error ('not been released as dvd yet')
// 	}
// }

let moment = require('moment')
let helpers = require('./helpers')

let crediableUploaders = ['ETRG', 'YIFY', 'JYK', 'SPARKS', 'RARBG', 'ANOXMOUS', 'NVEE', 'TUGAZX', 'MKVCAGE', 'SHAANIG']
let execludedWords = ['rus', 'russian', 'ru', '3d', 'cam']

let partial = _.partial

let includeName = function (torrent, ctx) {
	let kebab = _.kebabCase(torrent.name)
	let included = _.includes(kebab, ctx.kebab)
    return included
}

let execludeKeywords = function (torrent, ctx) {
    let words = _.words(torrent.name)
	words = _.map(words, w =>  w.toLowerCase() )
	return !_.intersection(words, execludedWords).length
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

let sizecCheck = function (torrent, ctx) {
	if (torrent.size <= ctx.options.maxSize && torrent.size >= ctx.options.minSize) return true
	return false
}

let computeScore = function (torrent) {
	let score = 0
	let ctx = { options: { onlyCrediable: true } }

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

	// 20 points for being from a crediable uploader
	if (crediable(torrent, ctx)) score += 20
	else score += 0

	// 20 Points 20 1080p, 10 for 720p
	if (torrent.quality == '1080p') score += 20
	else if (torrent.quality == '720p') score += 10
	else score += 0

	// Give freeleech extra
	if (torrent.freeleech) score += 10

	torrent.score = score
}

module.exports = function (title, torrents, options) {
	let ctx = {
		kebab: _.kebabCase(title),
		lower: _.lowerCase(title),
		options
	}

	let wrapper = function (fn) {
		return partial(fn, _, ctx)
	}

    let torrent =
		_.chain(torrents)
		.compact()
		.filter(wrapper(includeName))
		.filter(wrapper(execludeKeywords))
		.filter(wrapper(ensureAscii))
		.filter(wrapper(crediable))
		.filter(wrapper(sizecCheck))
		/* Add more filters here*/
		.each(computeScore)
		.orderBy('score', 'desc')
		.first()
		.value()

	if (!torrent) return null
	if (options.minScore && torrent.score < torrent.score) return null
	return torrent
}
