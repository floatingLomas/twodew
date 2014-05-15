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
        app.get('/todos/:id', function (req, res, next) {
            todos.findOne({
                _id: new Todos.ObjectId(req.params.id)
            }, function (err, result) {
                if (err) return next(err);

                if (!result) return res.json(404, {
                    message: "Not found"
                });

                res.json(addUri(result));
            });
        });

        // Get a list of Todos
        app.get('/todos', function (req, res, next) {
            todos.find({}).toArray(function (err, result) {
                if (err) return next(err);

                return res.json(addUris(result));
            });
        });

        // Create a new Todo
        app.post('/todos', validatePostedTodo, function (req, res, next) {
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

                todos.insert(todo, {
                    w: 1
                }, function (err, saved) {
                    if (err) return next(err);

                    return res.json(201, addUri(saved[0]));
                });
            });
        });

        app.delete('/todos/:id', function (req, res, next) {
            var objectId = new Todos.ObjectId(req.params.id);

            if (!objectId) return res.json(404, {
                message: "ID Not Found: " + objectId
            });

            todos.remove({
                _id: objectId
            }, function (err, result) {
                if (err) return next(err);

                if (result < 1) return res.json(404, {
                    message: "Not found"
                });

                res.json(204);
            });

        });

        function addUris(todos) {
            return [].concat(todos || []).map(addUri);
        }

        function addUri(todo) {
            if (todo && todo._id) todo._uri = 'http://localhost:5000/api/todos/' + todo._id;
            return todo;
        }

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
