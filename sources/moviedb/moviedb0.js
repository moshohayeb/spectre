var _     = require('lodash')
var axios = require('axios')

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

	__token() {
		var url = API.__create('/authentication/token/new')
		return this.__call(url, rs => rs.request_token).then(v => v.data)
	},

	__sessionid(token) {
		var url = API.__create('/authentication/session/new', { request_token: token })
		return this.__call(url, rs => rs.session_id).then(function(v) {
			this.token = token
			this.session_id = v.data
		}.bind(this))
	},

	login(token) {
		var url = API.__create('/authentication/token/validate_with_login',
			{ request_token: token, username: process.env.MYUSER, password: process.env.MYPASS })
		return this.__call(url).then(v => v.data.request_token).then(this.wrap('__sessionid'))
	},

	info() {
		var url = this.__create('/account', { session_id: this.session_id })
		return this.__call(url).then(function (v) {
			this.user_id = v.data.id,
			this.username = v.data.username
		}.bind(this))
	},

	movielist() {
		var url = this.__create(`/account/${this.user_id}/watchlist/movies`, { session_id: this.session_id })
		return this.__call(url, rs => _.map(rs.results, movie => movie.title))
	},

	wrap(fn) {
		return this[fn].bind(this)
	},

}

var moviedb = {}

API.__token()
	.then(API.wrap('login'))
	.then(API.wrap('info'))
	.then(API.wrap('movielist'))
	.then( v => {
		console.log(v.data)
		console.log(API)
	})
	.catch(e => {
		console.log('ERROR: ', e)
	})

module.exports = moviedb
