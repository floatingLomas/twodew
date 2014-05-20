'use strict';

/**
 *  Todos API
 */
module.exports = (function () {
    var express = require('express');
    var bodyParser = require('body-parser');

    var unirest = require('unirest');
    var twilioSid = process.env.TWILIO_SID;
    var twilioToken = process.env.TWILIO_TOKEN;
    var twilioSmsUrl = 'https://api.twilio.com/2010-04-01/Accounts/' + twilioSid + '/Messages.json';

    var phone = require('node-phonenumber').PhoneNumberUtil.getInstance();

    var router = express.Router();

    var db = require('./lib/db');
    var Todos = require('./lib/todos');

    var todos;
    db.connect(function (err, collection) {
        if (err) throw err;
        todos = new Todos(collection);
    });

    router.use(bodyParser.json());

    /**
     *  Get a list of Todos (optionally filtered by criteria)
     *
     *  Criteria is an object which can contain none, some or all of these keys:
     *
     *      done    {Boolean}   done or not
     *      text    {String}    string to search for in both title and body (via regex)
     *      title   {String}    string to search for in the title (via regex)
     *      body    {String}    string to search for in the body (via regex)
     *      case    {Boolean}   case-sensitive regexes (default) or not
     *
     */
    router.get('/todos', function (req, res, next) {
        todos.find(req.query || {}, function (err, result) {
            if (err) return next(err);

            return res.json(result);
        });
    });

    /**
     *  Get a Todo by _id
     */
    router.get('/todos/:id', function (req, res, next) {
        return handleSimpleActionById(todos.get, req.params.id, res, next);
    });

    /**
     *  Create a new Todo
     */
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

    /**
     *  Replace a Todo
     */
    router.put('/todos/:id', validateReqBody, function (req, res, next) {
        var posted = req.body || {};

        todos.update(req.params.id, posted, function (err, todo, markedDone) {
            if (err) return next(err);

            if (!todo) return res.json(404, {
                message: "Not found, did not update",
                todo: posted
            });

            if (markedDone) return sendDoneNotification(todo.title, function (wasSent) {
                return res.json(200, todo);
            });

            return res.json(200, todo);
        });
    });

    // Update part of a Todo
    router.patch('/todos/:id', function (req, res, next) {
        var posted = req.body || {};

        todos.update(req.params.id, posted, function (err, todo, markedDone) {
            if (err) return next(err);

            if (!todo) return res.json(404, {
                message: "Not found",
                _id: req.params.id
            });

            if (markedDone) return sendDoneNotification(todo.title, function (wasSent) {
                return res.json(200, todo);
            });

            return res.json(200, todo);
        });
    });

    // Mark a Todo as done by (Object)ID
    router.post('/done', function (req, res, next) {
        todos.done(req.body._id, function (err, result, markedDone) {
            if (err) return next(err);

            var todo = result;

            if (!todo) return res.json(404, {
                message: "Not found",
                _id: req.body._id
            });

            if (markedDone) return sendDoneNotification(todo.title, function (wasSent) {
                return res.json(200, todo);
            });

            return res.json(200, todo);
        });
    });

    // Kill a Todo by (Object)ID
    router.delete('/todos', function (req, res, next) {
        return handleSimpleActionById(todos.remove, req.body._id, res, next);
    });

    /**
     *  Send a 'Done' notification SMS via Twilio
     *
     *  The Callback receives either a true (message sent) or false (message not sent)
     *
     *  @param {String} title Todo title to send in the SMS
     *  @param {Function} next (sent)
     *  @api private
     */
    function sendDoneNotification(title, next) {
        if (!twilioSid || !twilioToken) return next(false);
        var smsTarget = process.env.SMS_TARGET;

        if (!smsTarget) return next(false);

        try {
            var smsTargetProto = phone.parse(smsTarget, 'US');
            smsTarget = smsTargetProto.values_['2'] || null;
        } catch (e) {
            console.log("Failed to parse SMS target '" + smsTarget + "':", e);
            return next(false);
        }

        console.log('Attempting to send SMS to ' + smsTarget);

        unirest.post(twilioSmsUrl).send({
            To: smsTarget,
            From: '+17784021808',
            Body: "'" + title + "' task has been marked as done."
        }).auth(twilioSid, twilioToken, true).end(function (response) {
            if (response.error) {
                console.log('Failed to send SMS to ' + smsTarget + ':', response.error);
                return next(false);
            }

            console.log('Sent SMS to ' + smsTarget);

            return next(true);
        });
    }

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
