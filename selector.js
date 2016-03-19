'use strict'
let util = require('./util')

let crediable = ['ETRG', 'YIFY', 'JYK', 'SPARKS', 'RARBG', 'ANOXMOUS', 'NVEE', 'TUGAZX', 'MKVCAGE', 'SHAANIG']

let partial = _.partial

let nameIncluded = function (torrent, ctx) {
	let kebab = _.kebabCase(torrent.name)
	let included = _.includes(kebab, ctx.kebab)
    return included
}

let execlude3d = function (torrent, ctx) {
    let lower = torrent.name.toLowerCase()
    let _3d = _.includes(lower, '3d')
    return !_3d
}

let ensureAscii = function (torrent, ctx) {
	return util.isAscii(torrent.name)
}

let onlyCrediable = function (torrent, ctx) {
	let segments = _.words(torrent.name)
	let cds = _.words(_.join(crediable, ' '))
	let xsect = _.intersection(segments, cds)
	return xsect.length
}

module.exports = function (title, torrents) {
	let ctx = {
		kebab: _.kebabCase(title),
		lower: _.lowerCase(title)
	}

    let torrent =
        _.chain(torrents)
        .compact()
        .filter(partial(nameIncluded, _, ctx))
        .filter(partial(execlude3d, _, ctx))
        .filter(partial(ensureAscii, _, ctx))
        .filter(partial(onlyCrediable, _, ctx))
		/* Add more filters here*/
        .orderBy(t => {
            return (+title.seeds + +title.peers)
        }, 'desc')
        .first()
        .value()
		
	return torrent
}
