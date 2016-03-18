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

        console.log('Downloaded %d movie (%d failed)', done.length, failed.length)

        if (done.length) {
            console.log('Downloaded: %s', _.join(_.map(done, 'title'), ', '))
        }
        
        if (failed.length) {
            console.log('Failed: %s', _.join(_.map(failed, 'title'), ', '))
        }
    })
    .catch(err => {
        console.log('An unexpected error occured. Try fixing the issue below')
        console.log(err)
        console.log(' ** Will run again in 1 Hour **')
        sleep = 60 * 1000
    })
    .finally(result => {
        console.log('Finished probing, will recheck in %d minutes', sleepMinutes)
        setTimeout(boot, sleep)
    })
}
boot()
