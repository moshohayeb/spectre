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

module.exports = function(title) {
    let url = __buildURL(title)
    debug('Getting meta data for title: %s (url: %s)', title, url)
    return request.getAsync(url)
        .then(response => JSON.parse(response.body))
        .then(data => _.mapKeys(data, (v, k) => _.camelCase(k) ))
}
