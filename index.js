'use strict'

require('./boot')()

let async = require('async')
let debug = require('debug')('spectre:index')

let conf = require('./conf')
let Movie = require('./movie')
let Subtitle = require('./subtitle')

// Should be generated based on config
let sp = {
    list: require('./sources/imdb'),
    client: require('./downloaders/cli'),
    search: require('./providers/thepiratebay'),
    metadata: require('./metadata/omdb')
}

let processTitle = function (title, done) {

    let co = Promise.coroutine(function* () {
        debug('processing title: "%s"', title)
        let p = yield Promise.join(
            sp.search(title),
            sp.metadata(title)
        )

        // TODO: profiles for results (720/1080)
        let torrent = p[0]
        let metadata = p[1]

        if (!torrent || !metadata) {
            throw new Error('err for title %s: ' + title)
        }

        // download the movie
        // TODO handling failures/no seeds?
        // As it stands now, a slow torrent will block all others
        let dlResult = yield sp.client(torrent)

        // TODO: better logic for determining the actual video (compressed?)
        let movie = Movie.detect(dlResult.files)

        // augment and pick the file we think is the actual video
        let info = {
            movie,
            metadata,
            torrent
        }

        // rename and persist and the movie
        yield Movie.persist(info)
        yield Subtitle.download(info)
    })

    co()
        .then(result => {
            debug('title "%s" downloaded successfully', title)
        })
        .catch(err => {
            debug('err downloading title: "%s" (%s)', title, err)
        })
        .finally(done)
}

let spectre = Promise.coroutine(function* () {
    let p = yield Promise.join(
        sp.list(conf.sources.imdb[0]),
        Movie.scan(conf.dlDir)
    )

    // Gief destructuring p10x
    let undownloaded = _.difference(p[0], p[1])
    let downloaded = _.intersection(p[0], p[1])
    _.each(downloaded, mov => {
        debug('title "%s" is already downloaded', mov)
    })

    return new Promise(function (resolve, reject) {
        // resolve will be called when all titles are downloaded
        async.eachLimit(undownloaded, conf.concurrency, processTitle, resolve)
    })
})

spectre()
    .then(rs => {
        console.log('done')
    })
    .catch(err => {
        console.log("Err: ", err)
    })
    .finally(function () {
        console.log('finished')
    })
