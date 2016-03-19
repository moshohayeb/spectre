'use strict'

let fs = require('fs-extra')
let async = require('async')
let debug = require('debug')('spectre:spectre')

let moment = require('moment')

let movie = require('./movie')
let subtitle = require('./subtitle')
let selector = require('./selector')

// Should be generated based on config
let sp = {
    list: require('./list'),
    client: require('./downloaders/cli'),
    search: require('./providers/kickass'),
    metadata: require('./metadata')
}

let processTitle = function (job, done) {

	let title = job.title
	let conf = job.conf
	let retval = { title }

    debug('processing title: "%s"', title)

    let co = Promise.coroutine(function* () {
        let p = yield Promise.join(
            sp.search(title),
            sp.metadata(title)
        )

        // TODO: profiles for results (720/1080)
        let torrents = p[0]
        let metadata = p[1]

        if (!metadata) {
            throw new Error('meta data could not be retrieved')
        }

        if (metadata.type !== 'movie') {
            throw new Error('title is not a movie')
        }

		let torrent = selector(title, torrents)
        if (!torrent) {
			/* TODO: Possibly fallback on best guess */
			throw new Error ('no appropriate release found')
        }

		let today = moment()
		let dvddate = moment(metadata.dvd, "DD MMM YYYY");
		if (dvddate.isAfter(today)) {
			throw new Error ('not been released as dvd yet')
		}

        // download the movie
        // TODO handling failures/no seeds?
        // As it stands now, a slow torrent will block all others
        let dlResult = yield sp.client(torrent, conf)

        // TODO: better logic for determining the actual video (compressed?)
        let mov = movie.detect(dlResult.files)

        let info = {
            movie: mov,
            metadata,
            torrent
        }

        // rename and persist and the movie
        yield movie.persist(info, conf)
        yield subtitle.download(info, conf)
    })

    co()
        .then(result => {
			retval.done = true
            debug('title "%s" downloaded successfully', title)
        })
        .catch(err => {
			retval.done = false
            debug('skip downloading title: "%s" (%s)', title, err.message)
        })
        .finally(() => {
			done(null, retval)
		})
}


let spectre = (function () {
	let spt = { }
	let dlQueue
	let report
	let conf

	conf = { concurrency: 1 }
	dlQueue = async.queue(processTitle, conf.concurrency)

	report = setInterval(() => {
		let running = dlQueue.running()
		let waiting = dlQueue.length()
		debug('running: %d, waiting: %d', running, waiting)
	}, 60 * 1000)

	spt.enqueue = function (title) {
		dlQueue.push({ conf, title })
	}

	spt.configure = function (cnf) {
	    conf = cnf
		if (dlQueue.concurrency !== conf.concurrency) {
			dlQueue.concurrency = conf.concurrency
			dlQueue.pause()
			dlQueue.resume()
		}
	}

	spt.inQueue = function () {
		let waiting = _.map(dlQueue.tasks, 'data.title')
		let working = _.map(dlQueue.workersList(), 'data.title')
		return _.union(waiting, working)
	}

	return spt
}())


module.exports = Promise.coroutine(function* () {

	let conf = yield fs.readFileAsync('./spectre.json').then(JSON.parse)
	spectre.configure(conf)

    let p = yield Promise.join(
        sp.list(conf.lists),
        movie.scan(conf.dlDir)
    )

    // Gief destructuring p10x
    let missing = _.difference(p[0], p[1])
    let locallyAvailable = _.intersection(p[0], p[1])

    _.each(locallyAvailable, mov => {
        debug('title "%s" is already downloaded', mov)
    })

	if (!missing.length) {
		debug('no movies to be downloaded')
		return
	}

	let inQueue = spectre.inQueue()
	let toAdd = _.difference(missing, inQueue)

    debug('adding the following titles to the queue: %s', _.join(toAdd, ', '))
	_.each(toAdd, spectre.enqueue)
})
