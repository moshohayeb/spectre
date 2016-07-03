'use strict'

require('./boot')

let debug = require('debug')('spectre:index')
let Spectre = require('./spectre')

let spectre = new Spectre()

function run() {
    let sleepMinutes = 1
    let sleep = (1000 * 60) * sleepMinutes

    spectre.configure('./spectre.json')
    spectre.run()
        .then(result => {
            ;
        })
        .catch(err => {
            debug('An unexpected error occured, try fixing the issue below')
            debug(err)
            debug(' ** Will run again in 1 hour **')
            sleep = (1000 * 60) * 60
        })
        .finally(() => {
            debug('Done checking for new movies, rechecking in %d minutes', sleepMinutes)
            setTimeout(run, sleep)
        })
}
run()
