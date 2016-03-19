'use strict'

let path = require('path')
let fs = require('fs-extra')
let fileType = require('file-type');
let readChunk = require('read-chunk');
let mkdirp = require('mkdirp')
let debug = require('debug')('spectre:movie')

let DIR_REGEX = /^.+ \(\d{2,4}\)$/
let MOVIE_REGEX = /^.+ \(\d{2,4}\)\.\w+$/

let persist = Promise.coroutine(function* (info, conf) {

    let dirname = sprintf('%s (%d)', info.metadata.title, info.metadata.year)
    let filename = sprintf('%s (%d).%s', info.metadata.title, info.metadata.year, info.movie.fileType.ext)

    dirname = path.join(conf.dlDir, dirname)
    let moviePath = path.join(dirname, filename)
    let infoPath = path.join(dirname, '.spectre')

    info.movie.oldPath = info.movie.path
    info.movie.path = moviePath
    info.movie.name = filename
    info.movie.dir = dirname

    yield mkdirp.mkdirpAsync(dirname)

    return Promise.join(
        fs.copyAsync(info.movie.oldPath, moviePath),
        fs.writeFileAsync(infoPath, JSON.stringify(info, null, 4))
    )
})

let scan = function (moviesDir) {
    return fs.readdirAsync(moviesDir)
        .map(dirEnt => { return path.join(moviesDir, dirEnt) })
        .filter(dirEnt => { return fs.lstatAsync(dirEnt).then(rs => { return rs.isDirectory() }) })
        .filter(dirEnt => {
            return fs.readdirAsync(dirEnt).then(files => {
                return _.find(files, f => MOVIE_REGEX.test(f))
            })
        })
        .map(fullPath => {
            let f = path.basename(fullPath)
            let idx = /\(\d{2,4}\)$/.exec(f)['index'] - 1
            return f.substr(0, idx)
        })
}

/* Try to find (possibly uncompress) the actual video file */
let detect = function (files) {

    let video = _.reduce(files, (acm, f) => {
        f.fileType = fileType(readChunk.sync(f.path, 0, 262))
        if (!f.fileType) return acm
        if (_.startsWith(f.fileType.mime, 'video') && f.size > acm.size) return f
        return acm
    }, { size: 0 })

    video.oldName = path.basename(video.path)
	return video
}

module.exports = {
    persist,
    scan,
    detect,
}
