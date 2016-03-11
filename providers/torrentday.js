(function () {
    'use strict'

    let querystring = require('querystring')
    let fs = require('fs');

    let Promise = require('bluebird')
    let cookie = require('cookie')
    let request = require('request')
    let cheerio = require('cheerio')
    let moment = require('moment')
    let debug = require('debug')('spectre:torrentday')
    let prettybyte = require('pretty-bytes')
    let _ = require('lodash')

    let us = require('../utilities')

    Promise.promisifyAll(fs)

    let GET = Promise.promisify(request.get)
    let POST = Promise.promisify(request.post)

    const CLASSIC_URL = 'https://classic.torrentday.com'
    const MODERN_URL = 'https://www.torrentday.com'
    const SEARCH_URL = `${MODERN_URL}/browse.php?`
    const API_URL = `${CLASSIC_URL}/V3/API/API.php`
    const LOGIN_URL = `${CLASSIC_URL}/torrents/`

    const N_CRAWL_PAGES = 10
    const FREELEECH_REGEX = /Freeleech/
    const QUALITY_REGEX = /browse\.php\?cat=(\d+)/
    const SEARCH_FORM = { '/browse.php?': null, 'cata': 'yes', 'jxt': '8', 'jxw': 'b', }
    const QUALITY = {
        1: '480p',
        3: '480p',
        5: '1080p',
        11: '720p',
        21: '720',
        25: '480p',
        44: '480p'
    }

    function Torrentday(opts) {
        if (!(this instanceof Torrentday)) return new Torrentday(opts)

        this.username = opts.username
        this.password = opts.password
    }

    let __toByte = function (human) {
        let map = { 'GB': 1000000000, 'MB': 1000000, 'KB': 1000, 'B': 1 }
        let byte, unit

        human = human.split(' ')
        byte = human[0]
        unit = human[1]

        return +byte * map[unit]
    }

    let __toDay = function (human) {
        let now = moment()
        let release = moment()
        let result

        let months = (result = /(\d+) month/.exec(human)) ? result[1] : 0
        let weeks = (result = /(\d+) week/.exec(human)) ? result[1] : 0
        let days = (result = /(\d+) days/.exec(human)) ? result[1] : 0
        let years = (result = /(\d+) year/.exec(human)) ? result[1] : 0

        release
            .subtract(years, 'year')
            .subtract(months, 'month')
            .subtract(weeks, 'week')
            .subtract(days, 'days')

        return now.diff(release, 'days')
    }

    let __buildURL = function (opts) {
        let qs = { cata: 'yes', search: opts.title, page: opts.page }

        if (opts.freeleech)
            qs.free = 'on'

        let cats = opts.cats || []
        cats.forEach(c => qs['c' + c] = '1')

        return `${SEARCH_URL}${querystring.stringify(qs)}`
    }

    Torrentday.prototype.search = function (opts) {
        let _this = this

        opts = opts || {}
        if (!opts.title) throw new Error('no search title provided')

        debug('searching for: %s', opts.title)

        return Promise.coroutine(function* () {
            let url
            let result = []

            if (!_this.cookie) yield _this.login()

            for (let page = 0; page < N_CRAWL_PAGES; page++) {
                opts.page = page
                url = __buildURL(opts)
                debug('getting url: %s', url)
                let rs = yield GET({ url, jar: _this.cookie })
                let $ = cheerio.load(rs.body)
                let partial = _.map($('#torrentTable tr.browse'), title => {
                    // let id        = $('.torrentName', title).attr('id')
                    let name = $('.torrentName', title).text()
                    let quality = QUALITY_REGEX.exec($('.browse a', title).attr('href'))[1] || 0
                    let link = MODERN_URL + '/' + $('.dlLinksInfo a', title).attr('href')
                    let age = __toDay($('.torrentNameInfo .ulInfo', title).text())
                    let size = __toByte($('.sizeInfo a', title).text())
                    let freeleech = FREELEECH_REGEX.test($('.torrentTableNameDiv .flTags', title).text())
                    let seeds = +($('.seedersInfo', title).text().replace(',', ''))
                    let peers = +($('.leechersInfo', title).text().replace(',', ''))
                    let magnet = us.reqfull({ url: link, jar: _this.cookie }).then(us.torrentToMagnet)
                    return {
                        name,
                        age,
                        size,
                        seeds,
                        peers,
                        freeleech,
                        quality: QUALITY[quality] || '480p', // default
                        __magnet__: magnet,
                    }
                })

                if (!partial || partial.length === 0) break
                yield Promise.all(partial.map(p => p.__magnet__))
                partial.forEach(p => {
                    p.magnet = p.__magnet__.value()
                    delete p.__magnet__
                })
                result = result.concat(partial)
            }

            result = _.compact(result) || []
            if (result.length === 0) {
                debug(`can't find results for: ${opts.title}`)
            } else {
                debug(`found ${result.length} results for: ${opts.title}`)
            }

            // result = _.sortByOrder(result, 'seeds', 'desc')
            return result
        })()
    }

    Torrentday.prototype.login = function () {
        let form = { 'username': this.username, 'password': this.password, 'submit.x': 0, 'submit.y': 0 }

        return POST(LOGIN_URL, { form })
            .then(rs => rs.headers['set-cookie'].map(cookie.parse))
            .then(cookies => {
                let jar = request.jar()
                let uid = _.get(_.find(cookies, cookie => cookie.uid !== undefined), 'uid')
                let pass = _.get(_.find(cookies, cookie => cookie.pass !== undefined), 'pass')

                if (!uid || !pass) throw new Error('can\'t login')

                jar.setCookie(request.cookie(`uid=${uid}`), MODERN_URL)
                jar.setCookie(request.cookie(`pass=${pass}`), MODERN_URL)

                _.extend(this, { uid, pid: pass, cookie: jar })
            })
    }

    module.exports = Torrentday
}());
