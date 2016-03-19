'use strict'

require('./boot')()
let spectre = require('./spectre')

function boot() {
    let sleepMinutes = 5
    let sleep = (1000 * 60) * sleepMinutes
    spectre()
    .then(result => {
        let done = _.filter(result, 'done')
        let failed = _.filter(result, ['done', false])

        console.log('downloaded %d movie (%d failed)', done.length, failed.length)

        if (done.length) {
            console.log('downloaded: %s', _.join(_.map(done, 'title'), ', '))
        }

        if (failed.length) {
            console.log('failed: %s', _.join(_.map(failed, 'title'), ', '))
        }
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
