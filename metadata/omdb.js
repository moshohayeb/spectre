'use strict'

let Promise = require('bluebird')
let request = require('request')

let qs = require('querystring')
let debug = require('debug')('spectre:omdb')

let GET = Promise.promisify(request.get)

const URL = 'http://www.omdbapi.com/'

let __buildURL = function (title) {
    let kv = {
        t: title,
        type: 'movie',
        r: 'json',
        tomatoes: true
    }
    let query = qs.stringify(kv)
    return `${URL}/?${query}`
}

module.exports = Promise.coroutine(function* (title) {
    let url = __buildURL(title)
    debug('getting meta for for "%s": %s', title, url)
    let response = yield GET(url)
    let data = JSON.parse(response.body)
    return _.mapKeys(data, (v, k) => {
        return _.camelCase(k)
    })
})
