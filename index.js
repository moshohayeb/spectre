'use strict'

require('./boot')

let debug = require('debug')('spectre:index')
let spectre = require('./spectre')

function iter() {
    let sleepMinutes = 5
    let sleep = (1000 * 60) * sleepMinutes

    spectre('./spectre.json')
        .then(result => {
            throw new Error("qwr")
            ;
        })
        .catch(err => {
            debug('an unexpected error occured, try fixing the issue below')
            debug(err)
            debug(' ** will run again in 1 hour **')
            sleep = (1000 * 60) * 60
        })
        .finally(result => {
            debug('finished probing, will recheck in %d minutes', sleepMinutes)
            setTimeout(iter, sleep)
        })
}


iter()
