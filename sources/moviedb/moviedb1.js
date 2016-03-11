var _       = require('lodash')
var axios   = require('axios')
var co      = require('co')
var Promise = require('bluebird')

var log = require('./log')

var API = {
	URL: 'http://api.themoviedb.org/3',
	KEY: '',

	__call(u, transform) {
		var params

		params = _.merge(u.params, {api_key: this.KEY})
		log.debug(`requesting url: ${u.url}`)
		if (_.keys(params).length) log.debug(`request params: ${JSON.stringify(u.params)}`)
		return axios({
			url: u.url,
			params: params,
			method: 'GET',
			transformResponse: rs => {
				rs = JSON.parse(rs)
				return transform ? transform(rs) : rs
			},
		})
	},

	__create(path, params) {
		var url

		params = params || { }
		path = _.trimLeft(path, '/')
		url = `${this.URL}/${path}`
		return { url, params }
	},

	__generate_token() {
		var url = API.__create('/authentication/token/new')
		return this.__call(url, rs => rs.request_token).then(v => v.data)
	},

	__generate_session(token) {
		var url = API.__create('/authentication/session/new', { request_token: this.__token })
		return this.__call(url).then(v => v.data.session_id)
	},

	login() {
		var url = API.__create('/authentication/token/validate_with_login',
			{ request_token: this.__token, username: process.env.MYUSER, password: process.env.MYPASS })
		return this.__call(url)
	},

	account_info() {
		var url = this.__create('/account', { session_id: this.__session_id })
		return this.__call(url).then(v => v.data)
	},

	movies_watchlist() {
		var url = this.__create(`/account/${this.user_id}/watchlist/movies`, { session_id: this.__session_id })
		return this.__call(url, rs => _.map(rs.results, movie => movie.title)).then(v => v.data)
	},
}

var moviedb = {}
var result = co(function* () {
	var token, session_id, info, movies

    API.__token = yield API.__generate_token()
	yield API.login()
	API.__session_id = yield API.__generate_session()

	info = yield API.account_info()
	API.__user_id = info.id
	API.__username = info.username

	return yield API.movies_watchlist()
})

result.then(function (value) {
	console.log('fulfulled: ', value)
}).catch(e => {
	console.log('ERROR: ', e)
})

module.exports = moviedb
