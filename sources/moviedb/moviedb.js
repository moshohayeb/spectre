var util        = require('util')
var querystring = require('querystring')

var _       = require('lodash')
var request = require('request')
var async   = require('async')

var log = require('./log')

var API = {
	URL: 'http://api.themoviedb.org/3',
	KEY: '',

	call(url, extract, next) {
		log.debug(`requesting url: ${url}`)

		request(

			{
				method: 'GET',
				url: url,
				headers: {
					'Accept': 'application/json'
				}
			},

			(err, response, body) => {
				if (err) {
					log.error(`can\'t perform request to ${url}`)
					return next('bad url request')
				}

				var data
				body = JSON.parse(body)
				data = extract ? extract(body) : body
				next(null, data)
		})
	},

	create(path, kv) {
		kv = kv || { }
		var qs = querystring.stringify(kv)
		var key = kv.length === 0 ? `?api_key=${this.KEY}` : `&api_key=${this.KEY}`
		path = _.trimLeft(path, '/')
		return `${this.URL}/${path}?${qs}${key}`
	}
}

var moviedb = {
	// store credentials here ...
}

moviedb.get_watchlist = function (done) {
	async.waterfall([

		// Get API Token
		(next) => {
			var url = API.create('/authentication/token/new')
			API.call(url, response => response.request_token, next)
		},

		// Authenticate
		(token, next) => {
			var url = API.create('/authentication/token/validate_with_login', { request_token: token, username: 'oshohayeb', password: process.env.MYPASS })
			API.call(url, null, (err, response) => {
				if (response.success !== true) return next('invalid login')
				next(null, { token })
			})
		},

		// Generate session id
		(context, next) => {
			var url = API.create('/authentication/session/new', { request_token: context.token })
			API.call(url, null, (err, response) => {
				if (response.success !== true) return next('cant generate session id')
				context.session_id = response.session_id
				next(null, context)
			})
		},

		// Get user info
		(context, next) => {
			var url = API.create('/account', { session_id: context.session_id })
			API.call(url, null, (err, response) => {
				context.user_id = response.id
				context.username = response.username
				next(null, context)
			})
		},

		// Get list of movies in the watchlist
		(context, next) => {
			var url = API.create(`/account/${context.user_id}/watchlist/movies`, { session_id: context.session_id })
			API.call(url, response => _.map(response.results, movie => movie.title), next)
		}],

		(err, movies) => {
			if (err) {
				log.error(err)
				return done(err)
			}
			done(null, movies)
		}
	)
}


module.exports = moviedb
