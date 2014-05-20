'use strict';

/**
 * Set up the connection to the MongoDB 'Todos' collection
 */
module.exports = function Todos() {
    var mongo = require('mongodb');
    var mongoUri = process.env.MONGOHQ_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/TwoDew';

    var _db = null;
    var _collection = null;

    function connect(next) {
        mongo.Db.connect(mongoUri, function (err, db) {
            if (err) return next(err);
            _db = db;

            console.log('Connected to MongoDB at ' + mongoUri);

            db.collection('Todos', function (err, collection) {
                if (err) return next(err);
                _collection = collection;

                console.log('Found Todos collection');

                collection.ensureIndex({
                    title: 1
                }, {
                    unique: true
                }, function (err, indexName) {
                    collection.ensureIndex({
                        title: 'text',
                        subject: 'text'
                    }, {
                        name: 'todo_text_index',
                        weight: {
                            title: 10,
                            subject: 5
                        },
                        background: true
                    }, function (err, indexName) {
                        if (err) return next(err);

                        console.log('Indices in place');

                        return next(null, collection);
                    });
                });
            });
        });
    };

    return {
        connect: connect,
        collection: _collection,
        _db: _db
    }
}();
