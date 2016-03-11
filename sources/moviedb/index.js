var moviedb = require('./moviedb')
var log = require('./log')

moviedb.get_watchlist(function (err, res) {
	console.log(err)
	console.log(res)
})
