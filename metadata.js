'use strict'

let Promise = require('bluebird')
let request = require('request')

let qs = require('querystring')
let debug = require('debug')('spectre:metadata')

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
    debug('Getting meta data for title: %s', title)
    debug('Getting url: %s', url)
    let response = yield request.getAsync(url)
    let data = JSON.parse(response.body)
    return _.mapKeys(data, (v, k) => { return _.camelCase(k) })
})
