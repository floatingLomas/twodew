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

    // Get a list of Todos
    router.get('/todos', function (req, res, next) {
        todos.find(req.query).toArray(function (err, result) {
            if (err) return next(err);

            return res.json(result);
        });
    });

    // Get a specific Todo by (Object)ID
    router.get('/todos/:id', function (req, res, next) {
        handleSimpleActionById(todos.get, req.params.id, res, next);
    });

    // Create a new Todo
    router.post('/todos', validateReqBody, function (req, res, next) {
        todos.create(req.body, function (err, todo) {
            if (err) return next(err);

            if (!todo) return res.json(409, {
                message: "Todo already exists",
                todo: req.body
            });

            return res.json(201, todo);
        });
    });

    router.put('/todos/:id', validateReqBody, function (req, res, next) {
        todos.update(req.params.id, req.body, function (err, todo) {
            if (err) return next(err);

            if (!todo) return res.json(404, {
                message: "Not found, did not update",
                todo: req.body
            });

            return res.json(200, todo)
        });
    });

    // Update a todo
    router.patch('/todos/:id', function (req, res, next) {
        var posted = req.body || {};

        console.log(req.body);

        todos.update(req.params.id, posted, function (err, todo) {
            if (err) return next(err);

            if (!todo) return res.json(404, {
                message: "Not found",
                _id: req.params.id
            });

            return res.json(200, todo);
        });
    });

    // Mark a Todo as done by (Object)ID
    router.post('/done', function (req, res, next) {
        handleSimpleActionById(todos.done, req.body._id, res, next);
    });
    // Kill a Todo by (Object)ID
    router.delete('/todos', function (req, res, next) {
        handleSimpleActionById(todos.remove, req.body._id, res, next);
    });

    /**
     *  Handles a Todo action that requires an ID and returns either a Todo (if successful)
     *  or `null` (if not found), and responds with either a 200 OK and the Todo,
     *  or a 404 Not Found (with a message, including the ID that was attempted)
     *
     *  @param {Function} action to apply
     *  @param {String} ID to use
     *  @param {Object} Express 'Response' object
     *  @param {Function} Express 'Next' function
     *  @api private
     */
    function handleSimpleActionById(action, id, res, next) {
        action.call(todos, id, function (err, todo) {
            if (err) return next(err);

            if (!todo) return res.json(404, {
                message: "Not found",
                _id: id
            });

            res.json(200, todo);
        });
    }

    /**
     *  Post Body Validation Middleware to check a new Todo.
     *
     *  If the Todo is valid, it will carry on.  If it's not, it will return a 400
     *  with an approprate error message.
     *
     *  @param {Object} Express 'Request' object
     *  @param {Object} Express 'Response' object
     *  @param {Function} Express 'Next' function
     *  @api private
     */
    function validateReqBody(req, res, next) {
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
            return !(~['title', 'body', 'done', '_id'].indexOf(key));
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

        var errorResponse = {
            message: "Application error",
            error: err.message,
            stack: err.stack
        };

        return res.json(500, errorResponse);
    });

    return router;
})();
