var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var iconv = require('iconv-lite');
var fs = require('fs');

var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./scratch');
var headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Cache-Control': "max-age=0",
    'Upgrade-Insecure-Requests': '1',
    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36',
};
var responseCache = {};
var arrTorrents = [];
function getArrayTorrents(body) {
    arrTorrents = [];
    var $ = cheerio.load(body);
    console.log('start parse data');
    console.log(' count ' + $('.tCenter.hl-tr').length);
    $('.tCenter.hl-tr').each(function (i, elem) {
        var $this = $(this);
        var href = $(this).find("td a.dl-stub").attr('href');
        var id = href.slice(-7);
        if (href) {
            var buffObj = {
                category: $(this).find("td.f-name").text(),
                title: $(this).find("td.t-title").text(),
                size: $(this).find("td.tor-size .dl-stub").text(),
                href: href,
                seeds: $(this).find("td .seedmed").text(),
                id: href.slice(-7)
            }
            arrTorrents.push(buffObj);
            responseCache[id] = buffObj;
        }
    });
    arrTorrents.sort(function (a, b) {
        return (+a.seeds < +b.seeds) ? 1 : ((+b.seeds < +a.seeds) ? -1 : 0);
    });
    return arrTorrents;
}
function saveToken(body) {
    var matchText = body.match(/form_token : \'\S*\,/gi);
    var token = '';
    if (matchText) {
        token = matchText[0].split('\'')[1];
        localStorage.setItem('token', token);
    } else {
        token = 'empty token';
    }
    return token;
}
function download(_res, src) {
    var file = fs.createWriteStream("public/files/file.trnt");
    var jar = request.jar();
    var cookie = request.cookie(localStorage.getItem("Cookies"));
    jar.add(cookie);
    var path = '';
    arrTorrents.forEach(function (item) {
        if (item.id == src) {
            path = item.href;
        }
    });
    console.log(arrTorrents);
    if (path) {
        token = localStorage.getItem('token');
        console.log('download file:' + src + 'with token: ' + token);
        request({
            encoding: null,
            url: path,
            method: "POST",
            jar: jar,
            headers: headers,
            form: {
                'token': token
            }
        }, function (error, response, body) {
            file.write(body);
            _res.send(body);
        });
    } else {
        _res.send('empty path');
    }

}

function login(res) {
    var url = 'http://login.rutracker.org/forum/login.php';
    request.post({
        headers: headers,
        url: url,
        form: {
            'login_username': 'qweasdzxc_',
            'login_password': 'qweasdzxc_',
            'login': 'Вход'
        }
    }, function (error, response, body) {
        if (response && response.headers && response.headers['set-cookie']) {
            var str = response.headers['set-cookie'][0];
            str = str.split(';')[0];
            localStorage.setItem('Cookies', str);
            console.log('get cookies: ' + str);
            res.send(str);
        } else {
            res.send(body);
        }
    });
}


function parser(_res, q) {
    var jar = request.jar();
    var cookie = request.cookie(localStorage.getItem("Cookies"));
    jar.add(cookie);
    console.log('send request:' + "http://rutracker.org/forum/tracker.php?nm=" + q);
    request({
        encoding: null,
        url: "http://rutracker.org/forum/tracker.php?nm=" + q,
        method: "POST",
        jar: jar,
        headers: headers,
        form: {
            'max': '1',
            'nm': q
        }
    }, function (error, response, body) {
        console.log('was in response')
        body = iconv.decode(new Buffer(body), "win1251");
        var data = getArrayTorrents(body);
        var saveTocken = saveToken(body);
        console.log('saveTocken ' + saveTocken);
        _res.send(data);
    });
}
function logout(res) {
    var jar = request.jar();
    var cookie = request.cookie(localStorage.getItem("Cookies"));
    jar.add(cookie);
    var url = 'http://login.rutracker.org/forum/login.php';
    request({
        method: "POST",
        headers: headers,
        jar: jar,
        url: url,
        form: {
            'logout': '1'
        }
    }, function (a, b) {
        res.send(b);
    });
}
function getCookies() {
    return localStorage.getItem('Cookies');
}
module.exports = {
    parser: parser,
    login: login,
    logout: logout,
    download: download,
    responseCache: responseCache,
    headers: headers,
};
