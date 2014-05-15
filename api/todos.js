'use strict';

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
    this._collection.findOne({
        _id: id
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

function parseCriteria(crit) {
    var search = {};

    if (!crit) return search;

    if (~['false', 'true'].indexOf(crit.done)) search.done = crit.done === 'true';

    var caseSensitive = !crit['case-sensitive'];

    if (crit.title) search.title = assembleCriterion(crit.title, caseSensitive);
    if (crit.body) search.body = assembleCriterion(crit.body, caseSensitive);

    if (crit.text) {
        search.$or = [{
            title: assembleCriterion(crit.text, caseSensitive)
        }, {
            body: assembleCriterion(crit.text, caseSensitive)
        }];
    }

    function assembleCriterion(value, caseSensitive) {
        return {
            $regex: value,
            $options: (caseSensitive) ? 'i' : ''
        };
    }

    return search;
}
