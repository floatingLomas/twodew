'use strict';

module.exports = (function () {
    var routes = require('express').Router();
    var unirest = require('unirest');

    routes.get('/', function (req, res, next) {
        unirest.get('http://localhost:5000/api/todos').end(function (response) {
            if (response.error) return next(response.error);

            return res.render('partials/index', {
                pageTitle: 'TwoDew: Your Todos',
                todos: response.body
            });
        });
    });

    return routes;
})();
