'use strict'

require('./boot')()
let spectre = require('./spectre')

function boot() {
    let sleepMinutes = 5
    // let sleep = (1000 * 60) * sleepMinutes
    // let sleep = (1000 * 60) * sleepMinutes
    let sleep = 1000 * 30
    spectre()
    .then(result => {
        ;
    })
    .catch(err => {
        console.log('an unexpected error occured, try fixing the issue below')
        console.log(err)
        console.log(' ** will run again in 1 hour **')
        sleep = (1000 * 60) * 60
    })
    .finally(result => {
        console.log('finished probing, will recheck in %d minutes', sleepMinutes)
        setTimeout(boot, sleep)
    })
}
boot()
