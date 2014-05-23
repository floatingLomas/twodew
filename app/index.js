'use strict';

module.exports = (function () {
    /**
     *  Module dependencies
     */
    var express = require('express');
    var methodOverride = require('method-override');
    var stylus = require('stylus');
    var nib = require('nib');

    var app = express();

    /**
     *  Settings
     */

    //  Views & Engine
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');

    //  Stylus
    app.use(stylus.middleware({
        src: __dirname + '/views',
        dest: __dirname + '/public',
        force: true,
        debug: true,
        compile: function (str, path) {
            return stylus(str)
                .set('filename', path)
                .set('compress', false)
                .set('linenos', true)
                .use(nib());
        }
    }));

    //  Static resources
    app.use(express.static(__dirname + '/public'));

    app.use(require('./routes'));

    // Error handler
    app.use(function (err, req, res, next) {
        return res.render('error', {
            pageTitle: 'TwoDew: Oops!',
            error: err
        });
    });

    return app;
})();