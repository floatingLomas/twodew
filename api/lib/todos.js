'use strict';

/**
 *  MongoDB
 */
var Mongo = require('mongodb');

/**
 * Expose Todos service
 */

module.exports = Todos;

function Todos(collection) {
    if (!collection) throw new Error('MongoDB Collection is required.');

    this._collection = collection;

    return this;
};

/**
 *  Get a single Todo by its ID (or a null if not found)
 *  passed into the callback.
 *
 *  @param {Number} id
 *  @param {Function} next
 *  @api public
 */
Todos.prototype.get = function (id, next) {
    var _id;
    try {
        _id = new Mongo.ObjectID(id);
    } catch (err) {
        return next(err);
    };

    this._collection.findOne({
        _id: _id
    }, next);
};

/**
 * Get Todos given the criteria.  If you provide a callback, it will run; if you do not,
 * it will return Mongo's chainable Cursor.
 *
 * Criteria is an object which can contain none, some or all of these keys:
 *
 *      done    {Boolean}   done or not
 *      text    {String}    string to search for in both title and body (via regex)
 *      title   {String}    string to search for in the title (via regex)
 *      body    {String}    string to search for in the body (via regex)
 *      case    {Boolean}   case-sensitive regexes (default) or not
 *
 * @param {Object} criteria
 * @param {Function} next
 * @return {Object} Cursor
 * @api public
 */
Todos.prototype.find = function (criteria, next) {
    var cursor = this._collection.find(parseCriteria(criteria));

    if (next) cursor = cursor.toArray(next);

    return cursor;
};

/**
 * Save a Todo.  You'll get an error if the title or body are not valid.
 *
 * Callback will get any errors (or null), and the inserted Todo
 * (or null if it is a duplicate title).
 *
 * @param {Todo} todo
 * @param {Function} next
 * @api public
 */
Todos.prototype.save = function (todo, next) {
    if (!todo) return next(new Error("Todo was undefined"));

    if (!todo.title || typeof todo.body !== 'string') {
        return next(new Error("Bad Todo title: " + JSON.stringify(todo.title)));
    }
    if (!todo.body || typeof todo.body !== 'string') {
        return next(new Error("Bad Todo body: " + JSON.stringify(todo.body)));
    }

    var _todo = {
        title: todo.title,
        body: todo.body,
        done: false
    };

    this._collection.insert(_todo, {
        w: 1
    }, function (err, result) {
        // If this is a duplicate key error, don't pass it along
        if (err && err.code == 11000) err = null;

        result = (!result) ? null : result[0];

        return next(err, result);
    });
}

Todos.prototype.remove = function (id, next) {
    var _id;
    try {
        _id = new Mongo.ObjectID(id);
    } catch (err) {
        return next(err, 0);
    };

    var _collection = this._collection;

    _collection.findOne({
        _id: _id
    }, function (err, todo) {
        if (err && !todo) return next(err, null, 0);

        _collection.remove({
            _id: todo._id
        }, {
            w: 1
        }, function (err, count) {
            return next(err, todo, count);
        });
    });
};

/**
 * Parse a search criteria object and produce a valid MongoDB Search object.
 *
 * Valid criteria are:
 *
 *      done    {Boolean}   done or not
 *      text    {String}    string to search for in both title and body (via regex)
 *      title   {String}    string to search for in the title (via regex)
 *      body    {String}    string to search for in the body (via regex)
 *      case    {Boolean}   case-sensitive regexes (default) or not
 *
 * @param {Object} criteria
 * @return  {Object} search
 * @api private
 */
function parseCriteria(criteria) {
    if (!criteria) return {};

    var search = {};

    if (~['false', 'true'].indexOf(criteria.done)) search.done = criteria.done === 'true';

    var caseSensitive = !criteria['case-sensitive'];

    if (criteria.title) search.title = regexCriterion(criteria.title, caseSensitive);
    if (criteria.body) search.body = regexCriterion(criteria.body, caseSensitive);

    if (criteria.text) {
        search.$or = [{
            title: regexCriterion(criteria.text, caseSensitive)
        }, {
            body: regexCriterion(criteria.text, caseSensitive)
        }];
    }

    return search;
}

/**
 * Assemble a MongoDB Regex criterion, with or without the case-'i'nsenstive
 * flag.
 *
 * @param {String} value
 * @param {Boolean} insensitive
 * @api private
 */
function regexCriterion(value, insenstive) {
    var criterion = {
        $regex: value,
    };

    if (insenstive) criterion.$options = 'i';

    return criterion;
}
