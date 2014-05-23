'use strict';

module.exports = (function () {
    var router = require('express').Router();

    router.get('/', function (req, res, next) {
        return res.render('partials/home', {});
    });

    router.get('/partials/**', function (req, res, next) {
        return res.render('partials/' + req.params[0], {});
    });

    return router;
})();
