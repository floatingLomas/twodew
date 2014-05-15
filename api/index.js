'use strict';

/**
 *
 */
module.exports = (function () {
    var express = require('express');
    var bodyParser = require('body-parser');

    var app = express.Router();

    var Todos = require('./todos');

    app.use(bodyParser.json());

    Todos.connect(function (err, todos) {
        if (err) throw err;

        // Get a specific Todo by (Object)ID
        app.get('/todos/:id', function (req, res) {
            todos.findOne({
                _id: new Todos.ObjectId(req.params.id)
            }, function (err, result) {
                if (err) return next(err);

                if (!result) return res.json(404, {
                    message: "Not found"
                });

                res.json(result);
            });
        });

        // Get a list of Todos
        app.get('/todos', function (req, res) {
            todos.find({}).toArray(function (err, result) {
                if (err) return next(err);

                return res.json(result);
            });
        });

        // Create a new Todo
        app.post('/todos', validatePostedTodo, function (req, res) {
            var posted = req.body;

            var todo = {
                title: posted.title,
                body: posted.body
            };

            todos.findOne(todo, function (err, result) {
                if (err) return next(err);
                if (result) return res.json(409, {
                    message: "Record already exists"
                });

                todo.done = false;
                todo._type = 'todo';
                todo._id = new Todos.ObjectId();
                todo._uri = req.protocol + '://' + req.host + '/api/todos/' + todo._id;

                todos.insert(todo, {
                    w: 1
                }, function (err, saved) {
                    if (err) return next(err);

                    if (!saved) return res.json()

                    return res.json(201, saved);
                });
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
    });

    return app;
})();
