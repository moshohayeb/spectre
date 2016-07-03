'use strict'

let fs = require('fs-extra')
let async = require('async')

let debug = require('debug')('spectre:spectre')

let movie = require('./movie')
let subtitle = require('./subtitle')

let List = require('./list')
let Movie = require('./movie')
let Metadata = require('./metadata')
let Selector = require('./selector')

let Providers = [
    require('./providers/kickass'),
    require('./providers/thepiratebay')
]

// Should be generated based on config
let sp = {
    client: require('./downloaders/cli'),
}

let processTitle = function (job, done) {
    let title = job.title
    let conf = job.conf

    debug('Processing title: "%s"', title)

    let co = Promise.coroutine(function* () {

        let pMeta = Metadata(title)
        let pTorrent = Promise.map(Providers, provider => provider(title))

        let p = yield Promise.all([pMeta, pTorrent])

        let metadata = p[0]
        let torrents = _.flatten(p[1])

        if (!metadata) {
            throw new Error('Meta data could not be retrieved')
        }

        debug('Found %d results for title: "%s"', torrents.length, title)
        let torrent = Selector(title, torrents, conf.dlOptions)
        if (!torrent) {
            throw new Error ('No release matching criteria found for title: "%s"', title)
        }

        // download the movie
        // TODO handling failures/no seeds?
        // As it stands now, a slow torrent will block all others
        let dlResult = yield sp.client(torrent, conf)

        // TODO: better logic for determining the actual video (compressed?)
        let mov = Movie.detect(dlResult.files)

        let info = {
            movie: mov,
            metadata,
            torrent
        }

        // rename and persist and the movie
        yield Movie.persist(info, conf)
        yield subtitle.download(info, conf)
    })

    let retval = { title }
    co()
        .then(result => {
            retval.done = true
            debug('title "%s" downloaded successfully', title)
        })
        .catch(err => {
            console.log(err)
            retval.done = false
            debug('skip downloading title: "%s" (%s)', title, err.message)
        })
        .finally(() => {
            done(null, retval)
        })
}


let Spectre = function () {
    let spectre = { }
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

    spectre.enqueue = function (title) {
        dlQueue.push({ conf, title })
    }

    spectre.configure = function (cnf) {
        conf = cnf

        conf.dlOptions = conf.dlOptions || { }
        conf.dlOptions.minSize = conf.dlOptions.minSize || 0.7
        conf.dlOptions.maxSize = conf.dlOptions.maxSize || 4.7
        conf.dlOptions.minSize *= 1000000000
        conf.dlOptions.maxSize *= 1000000000

        conf.dlOptions.minPreferSize = conf.dlOptions.minPreferSize || 0.7
        conf.dlOptions.maxPreferSize = conf.dlOptions.maxPreferSize || 4.7
        conf.dlOptions.minPreferSize *= 1000000000
        conf.dlOptions.maxPreferSize *= 1000000000

        conf.dlOptions.minScore = conf.dlOptions.minScore || 0
        conf.dlOptions.onlyCrediable = conf.dlOptions.onlyCrediable === undefined ?
                false : Boolean(conf.dlOptions.onlyCrediable)
        if (dlQueue.concurrency !== conf.concurrency) {
            dlQueue.concurrency = conf.concurrency
            dlQueue.pause()
            dlQueue.resume()
        }
    }

    spectre.inQueue = function () {
        let waiting = _.map(dlQueue.tasks, 'data.title')
        let working = _.map(dlQueue.workersList(), 'data.title')
        return _.union(waiting, working)
    }

    return spectre
}


module.exports = Promise.coroutine(function* (configFile) {
    let spectre = Spectre()

    let conf = yield fs.readFileAsync(configFile).then(JSON.parse)
    spectre.configure(conf)

    let p = yield Promise.join(
        List.fetch(conf.lists),
        Movie.scan(conf.dlDir)
    )

    let missing = _.difference(...p)
    let locallyAvailable = _.intersection(...p)

    _.each(locallyAvailable, mov => {
        debug('Title "%s" is already downloaded', mov)
    })

    if (!missing.length) {
    	debug('No movies to be downloaded')
    	return
    }

    let inQueue = spectre.inQueue()
    let toAdd = _.shuffle(_.difference(missing, inQueue))

    debug('Adding the following titles to the queue: %s', _.join(toAdd, ', '))
    _.each(toAdd, spectre.enqueue)
})
