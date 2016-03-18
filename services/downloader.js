var Promise = require('promise');
var WebTorrent = require('webtorrent');
var fs = require("fs");
var request = require('request');
var glob = require("glob");
var parser = require('./parser');
var LocalStorage = require('node-localstorage').LocalStorage;
var torrentClient = new WebTorrent();
var localStorage = new LocalStorage('./scratch');
var torrent = {};
var process = 0;

var listTorrents = [];

function startDownloadTorrent(torrentId) {
    startDownloadTorrentFile(torrentId).then(function () {
        startDownloadTorrentSrc(torrentId);
    });
}
function startDownloadTorrentSrc(torrentId) {
    var torrentObj = parser.responseCache[torrentId];
    var pathToTorrent = "public/files/" + torrentId + ".trnt";
    var opts = {
        path: "public/files/downloads/"
    };
    return new Promise(function (resolve, reject) {
        torrentClient.add(pathToTorrent, opts, function (torrent) {
            console.log('downloading start');
            torrent.on('download', function (chunkSize) {
                process = torrent.progress;
            });
            torrent.on('done', function () {
                console.log('downloading complete');
                listTorrents[torrentId].status = 'complete';
                resolve();
            });
            listTorrents[torrentId] = {
                status: 'downloading',
                torrentProcess: torrent,
                torrentObj: torrentObj
            };
        });
    });
}
function startDownloadTorrentFile(torrentId) {
    return new Promise(function (resolve, reject) {
        var torrentObj = parser.responseCache[torrentId];
        var fileStreem = fs.createWriteStream("public/files/" + torrentId + ".trnt");
        var filePath = torrentObj.href;
        var jar = request.jar();
        var cookie = request.cookie(localStorage.getItem("Cookies"));
        var token = localStorage.getItem('token');
        jar.add(cookie);
        console.log('download file:' + filePath + 'with token: ' + token);
        request({
            encoding: null,
            url: filePath,
            method: "POST",
            jar: jar,
            headers: parser.headers,
            form: {
                'token': token
            }
        }, function (error, response, body) {
            fileStreem.write(body);
            resolve('ok');
        });
    });
}
function getStatusTorrent(torrentId) {
    var torrent = listTorrents[torrentId];
    return {
        status: torrent.status,
    }
}


function start(src, _res) {
    var file = "public/files/file.trnt";
    var opts = {
        path: "public/files/downloads/"
    };
    console.log('start download torrent ' + src);
    torrentClient.add(file, opts, function (_torrent) {
        torrent = _torrent;
        console.log('downloading start');
        torrent.on('download', function (chunkSize) {
            process = torrent.progress;
            console.log(torrent.progress * 100);
//            console.log('chunk size: ' + chunkSize);
//            console.log('total downloaded: ' + torrent.downloaded);
//            console.log('download speed: ' + torrent.downloadSpeed);
//            console.log('progress: ' + torrent.progress);
//            console.log('======');
        });
        torrent.on('done', function () {
            console.log('downloading complete');
            torrentClient.destroy && torrentClient.destroy();
            console.log('client destroy');
        });
        _res.send('good');
    });
}
function getProcess() {
    return process * 100 + "";
}
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
function clearAll(_res) {
    var path = "public/files/downloads/";
    deleteFolderRecursive(path);
    console.log('clearing files complete');
    _res.send('clearing files complete');
}
function walkSync(currentDirPath, callback) {
    var path = require('path');
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}
function walkSync2(callback) {
    glob("public/files/downloads/**/*.+(avi|mkv)", {}, function (er, files) {
        console.log(files);
        files = files.map(function (item) {
            return item.slice(6);
        });
        callback(files);
    });
}
module.exports = {
    start: start,
    getProcess: getProcess,
    getFilesList: walkSync2,
    clearAll: clearAll
}
;
