'use strict';

module.exports = (function () {
    var router = require('express').Router();
    var unirest = require('unirest');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var session = require('express-session');

    router.use(cookieParser());
    router.use(bodyParser());

    router.use(session({
        secret: 'woohoo',
        name: 'twdw'
    }));

    function sessionMessages(req, res, next) {
        var session = req.session;
        var messages = session.messages || (session.messages = []);

        function flash(type, message) {
            messages.push({
                type: type,
                message: message
            });
        }

        req.flash = flash;

        req.flash.info = function (message) {
            flash('info', message);
        }
        req.flash.success = function (message) {
            flash('success', message);
        }
        req.flash.warning = function (message) {
            flash('warning', message);
        }
        req.flash.danger = function (message) {
            flash('danger', message);
        }

        req.bang = function () {
            var _messages = messages;
            session.messages = [];
            return _messages;
        }

        next();
    }

    router.use(sessionMessages);

    router.get('/', function (req, res, next) {
        var query = {};

        if (req.query.hide) query.done = false;
        if (req.query.text) query.text = req.query.text

        unirest.get(apiHostFromRequest(req) + '/api/todos').query(query).end(function (response) {
            if (response.error) return next(response.error);

            var search = {};

            if (req.query.hide) search.hide = 'on';
            if (req.query.text) search.text = req.query.text;

            return res.render('partials/home', {
                pageTitle: 'TwoDew: Your Todos',
                todos: response.body,
                messages: req.bang(),
                search: search
            });
        });
    });

    router.route('/new').get(function (req, res, next) {
        return res.render('partials/todo-edit', {
            pageTitle: 'TwoDew: something new!',
            todo: {
                title: '',
                body: '',
                done: false
            },
            messages: req.bang()
        });
    }).post(function (req, res, next) {
        unirest.post(apiHostFromRequest(req) + '/api/todos').send(req.body).end(function (response) {
            if (response.error) {
                req.flash.danger("Error creating '" + req.body.title + "': " + response.error);

                return res.render('partials/todo-edit', {
                    pageTitle: 'TwoDew: something new!',
                    todo: req.body,
                    messages: req.bang()
                });

            }

            req.flash.success("Created '" + response.body.title + "'!");

            return res.redirect('/edit/' + response.body._id);
        });
    });

    router.route('/edit/:id').get(function (req, res, next) {
        unirest.get(apiHostFromRequest(req) + '/api/todos/' + req.params.id).end(function (response) {
            if (response.error) return next(response.error);

            return res.render('partials/todo-edit', {
                pageTitle: 'TwoDew: ' + (response.body.done ? '[done] ' : '') + response.body.title,
                todo: response.body,
                messages: req.bang()
            });
        });
    }).post(function (req, res, next) {
        req.body.done = !!req.body.done;
        unirest.put(apiHostFromRequest(req) + '/api/todos/' + req.params.id).send(req.body).end(function (response) {
            if (response.error) {
                req.flash.danger("Error editing '" + req.body.title + "': " + response.error);

                return res.render('partials/todo-edit', {
                    pageTitle: 'TwoDew: ' + (req.body.done ? '[done] ' : '') + req.body.title,
                    todo: req.body,
                    messages: req.bang()
                });
            }

            req.flash.success("Saved changes to '" + response.body.title + "'!");

            return res.redirect('/edit/' + response.body._id);
        });
    });

    router.get('/done/:id', function (req, res, next) {
        unirest.post(apiHostFromRequest(req) + '/api/done').send({
            _id: req.params.id
        }).end(function (response) {
            if (response.error) {
                req.flash.danger("Error marking '" + req.params.id + "' as done: " + response.error);

                return res.redirect('/');
            }

            req.flash.success("Marked '" + response.body.title + "' as done!");

            return res.redirect('/');
        });
    });

    router.route('/delete/:id').get(function (req, res, next) {
        unirest.get(apiHostFromRequest(req) + '/api/todos/' + req.params.id).end(function (response) {
            if (response.error) return next(response.error);

            return res.render('partials/confirm-delete', {
                pageTitle: "TwoDew: Bye bye, '" + response.body.title + "'!",
                todo: response.body
            });
        });
    }).post(function (req, res, next) {
        unirest.delete(apiHostFromRequest(req) + '/api/todos').send({
            _id: req.params.id
        }).end(function (response) {
            if (response.error) {
                req.flash.danger("Error deleting " + req.params.id + ": " + response.error);
                return res.redirect('/');
            }

            req.flash.success("Deleted '" + response.body.title + "'!");

            return res.redirect('/');
        });
    });

    function apiHostFromRequest(req) {
        return req.protocol + '://' + req.get('host');
    };

    return router;
})();
