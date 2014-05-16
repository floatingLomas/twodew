'use strict';

/**
 *
 */
module.exports = (function () {
    var express = require('express');
    var bodyParser = require('body-parser');

    var router = express.Router();

    router.use(bodyParser.json());

    var db = require('./lib/db');
    var Todos = require('./lib/todos');

    var todos;

    db.connect(function (err, collection) {
        if (err) throw err;

        todos = new Todos(collection);
    });

    // Get a specific Todo by (Object)ID
    router.get('/todos/:id', function (req, res, next) {
        todos.get(req.params.id, function (err, todo) {
            if (err) return next(err);

            if (!todo) return res.json(404);

            return res.json(todo);
        });
    });

    // Get a list of db
    router.get('/todos', function (req, res, next) {
        todos.find(req.query).toArray(function (err, result) {
            if (err) return next(err);

            return res.json(result);
        });
    });

    // Create a new Todo
    router.post('/todos', validatePostedTodo, function (req, res, next) {
        var posted = req.body || {};

        var todo = {
            title: posted.title,
            body: posted.body,
            done: false
        };

        todos.save(todo, function (err, saved) {
            if (err) return next(err);

            if (!saved) return res.json(409, {
                message: "Todo already exists",
                todo: todo
            });

            return res.json(201, saved);
        });
    });

    // Kill a Todo
    router.delete('/todos/:id', function (req, res, next) {
        todos.remove(req.params.id, function (err, todo, count) {
            if (err) return next(err);

            if (!todo || !count) return res.json(404, {
                message: "Not found"
            });

            delete todo._id;

            res.json(200, todo);
        });

    });

    function validatePostedTodo(req, res, next) {
        var posted = req.body;
        var errorMessage;

        if (!posted || typeof posted !== 'object') errorMessage = "Bad object";

        if (Array.isArray(posted)) errorMessage = "One Todo at a time";

        if (typeof posted.title !== 'string') errorMessage = "Bad title: '" + JSON.stringify(posted.title) + "'";
        if (typeof posted.body !== 'string') errorMessage = "Bad body: '" + JSON.stringify(posted.body) + "'";

        if (errorMessage) return res.json(400, {
            message: errorMessage
        });

        var extraKeys = Object.keys(req.body).filter(function (key) {
            return !(~['title', 'body'].indexOf(key));
        });

        if (extraKeys.length) return res.json(400, {
            message: "Illegal fields: [ " + extraKeys.join(', ') + " ]"
        });

        return next();
    }

    // 404 Catch-all
    router.all('/*', function (req, res, next) {
        return res.json(404, {
            message: "No resource available at " + req.originalUrl
        });
    });

    // Error Handler
    router.use(function apiErrorHandler(err, req, res, next) {
        if (!err) return next();

        return res.json(500, {
            message: "Application error",
            error: err.message,
            stack: err.stack
        });
    });

    return router;
})();
