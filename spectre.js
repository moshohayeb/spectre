'use strict'

let fs = require('fs-extra')
let async = require('async')
let debug = require('debug')('spectre:spectre')

let Movie = require('./movie')
let Subtitle = require('./subtitle')

// Should be generated based on config
let sp = {
    list: require('./list'),
    client: require('./downloaders/cli'),
    search: require('./providers/thepiratebay'),
    metadata: require('./metadata/omdb')
}

let processTitle = function (conf, title, done) {

    debug('Processing title: "%s"', title)

    let co = Promise.coroutine(function* () {
        let p = yield Promise.join(
            sp.search(title),
            sp.metadata(title)
        )

        // TODO: profiles for results (720/1080)
        let torrent = p[0]
        let metadata = p[1]

        if (!torrent || !metadata) {
            throw new Error('No torrent or meta info')
        }

        if (metadata.type !== 'movie') {
            throw new Error('Title is not a movie')
        }

        // download the movie
        // TODO handling failures/no seeds?
        // As it stands now, a slow torrent will block all others
        let dlResult = yield sp.client(torrent, conf)

        // TODO: better logic for determining the actual video (compressed?)
        let movie = Movie.detect(dlResult.files)

        let info = {
            movie,
            metadata,
            torrent
        }

        // rename and persist and the movie
        yield Movie.persist(info, conf)
        yield Subtitle.download(info, conf)
    })

	let retval = { title }
    co()
        .then(result => {
			retval.done = true
            debug('Title "%s" downloaded successfully', title)
        })
        .catch(err => {
			retval.done = false
            debug('Err downloading title: "%s" (%s)', title, err)
        })
        .finally(() => {
			done(null, retval)
		})
}

module.exports = Promise.coroutine(function* () {
	let conf = yield fs.readFileAsync('./spectre.json').then(JSON.parse)
    let p = yield Promise.join(
        sp.list(conf.lists),
        Movie.scan(conf.dlDir)
    )

    // Gief destructuring p10x
    let toDownload = _.difference(p[0], p[1])
    let locallyAvailable = _.intersection(p[0], p[1])

    _.each(locallyAvailable, mov => {
        debug('Title "%s" is already downloaded', mov)
    })

	if (!toDownload.length) {
		debug('No movies to be downloaded')
		return []
	}

    debug('Downloading the following titles: %s', _.join(toDownload, ', '))
    return new Promise(function (resolve, reject) {
        // resolve will be called when all titles are downloaded
        async.mapLimit(toDownload,
			conf.concurrency,
			_.partial(processTitle, conf),
			_.rearg(resolve, 1, 0))
    })
})
