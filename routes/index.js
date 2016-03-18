var express = require('express');
var router = express.Router();
var parser = require('../services/parser');
var downloader = require('../services/downloader');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express', htmlClass: 'front'});
});
/* GET set page.  */
router.get('/search', function (req, res, next) {
    res.render('search', {title: 'Express'});
});
router.get('/list', function (req, res, next) {
    downloader.getFilesList(function (response) {
        res.render('list', {listVideo: response});
    });
});
router.get('/search/:q', function (req, res, next) {
    var q = req.params.q;
    if (q === 'login') {
        parser.login(res);
    } else if (q === 'logout') {
        parser.logout(res);
    } else {
        parser.parser(res, q);
    }
});
router.get('/download/:torrentId', function (req, res, next) {
    var torrentId = req.params.torrentId;
    parser.download(res, torrentId); 
});
router.get('/start/:torrentId', function (req, res, next) {
    var torrentId = req.params.torrentId;  
    downloader.start(torrentId, res);
});
router.get('/clear-all/', function (req, res, next) {
    downloader.clearAll(res);
});
router.get('/get-process/', function (req, res, next) {
    res.send(downloader.getProcess());
});

module.exports = router;
