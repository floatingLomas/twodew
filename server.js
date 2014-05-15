'use strict';

/**
 *	Module dependencies
 */

var app = require('./app');
var api = require('./api');

app.use('/api', api);

var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
});
