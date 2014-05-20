'use strict';

/**
 *  MongoDB
 */
var Mongo = require('mongodb');

/**
 *  Expose Todos service
 */
module.exports = Todos;

/**
 *  Todos Service
 */
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
    var _id = parseObjectId(id);
    if (_id instanceof Error) return next(_id);

    this._collection.findOne({
        _id: _id
    }, next);
};

/**
 *  Get Todos given the criteria.
 *
 *  Callback will get any errors (or null) and the results.
 *
 *  Criteria is an object which can contain none, some or all of these keys:
 *
 *      done    {Boolean}   done or not
 *      text    {String}    string to search for in both title and body (via regex)
 *      title   {String}    string to search for in the title (via regex)
 *      body    {String}    string to search for in the body (via regex)
 *      case    {Boolean}   case-sensitive regexes (default) or not
 *
 *  @param {Object} criteria
 *  @param {Function} OPTIONAL fields to return
 *  @param {Function} next
 *  @return {Object} Cursor
 *  @api public
 */
Todos.prototype.find = function (criteria, fields, next) {
    if (!next && typeof fields === 'function') {
        next = fields;
        fields = {};
    }

    var _fields = {};
    if ('title' in fields) _fields.title = true;
    if ('body' in fields) _fields.body = true;
    if ('done' in fields) _fields.done = true;

    this._collection.find(parseCriteria(criteria), _fields).toArray(next);
};

/**
 *  Save a Todo.
 *
 *  Callback will get any errors (or null), and the inserted Todo
 *  (or null if it is a duplicate title).
 *
 *  @param {Todo} todo
 *  @param {Function} next (error, todo)
 *  @api public
 */
Todos.prototype.create = function (todo, next) {
    if (!todo) return next(new Error("Todo was undefined"));

    if (!todo.title || typeof todo.body !== 'string') {
        return next(new Error("Bad Todo title: " + JSON.stringify(todo.title)));
    }
    if (!todo.body || typeof todo.body !== 'string') {
        return next(new Error("Bad Todo body: " + JSON.stringify(todo.body)));
    }

    var _todo = {
        title: todo.title.toString(),
        body: todo.body.toString(),
        done: false
    };

    this._collection.insert(_todo, {
        w: 1
    }, function (err, inserted) {
        // If this is a duplicate key error, don't pass it along
        if (err && err.code == 11000) err = null;

        inserted = (!inserted) ? null : inserted[0];

        return next(err, inserted);
    });
}

/**
 *  Remove a Todo.
 *
 *  Callback will get any errors (or null), and the removed Todo.
 *
 *  @param {Todo} todo
 *  @param {Function} next (error, todo)
 *  @api public
 */
Todos.prototype.remove = function (id, next) {
    var _id = parseObjectId(id);
    if (_id instanceof Error) return next(_id);

    var _collection = this._collection;

    this._collection.findAndRemove({
        _id: _id
    }, [
        ['_id', 1]
    ], function (err, todo) {
        if (err) return next(err);

        if (todo) delete todo['_id'];

        return next(err, todo);
    });
};

/**
 *  Update a Todo, given an ID.  Can handle one, some, or many of the fields.
 *
 *  Callback will get any errors (or null), and the updated Todo
 *  (or null if it didn't update).
 *
 *  @param {Todo} todo
 *  @param {Function} next (error, todo, markedDone)
 *  @api public
 */
Todos.prototype.update = function (id, values, next) {
    var _id = parseObjectId(id);
    if (_id instanceof Error) return next(_id);

    if (!values) return next(new Error("No values provided"));

    var fields = {};
    if (values.title) fields.title = values.title.toString();
    if (values.body) fields.body = values.body.toString();
    if ('done' in values)
        fields.done = (typeof values.done === 'string') ? values.done.toLowerCase() === 'true' : !!values.done;

    var self = this;

    this._collection.findAndModify({
        _id: _id
    }, [
        ['_id', 1]
    ], {
        $set: fields
    }, {
        w: 1,
        new: false,
    }, function (err, oldTodo) {
        if (err) return next(err);

        if (!oldTodo) return next(null, null);

        self.get(oldTodo._id, function (err, newTodo) {
            var markedDone = newTodo.done && !oldTodo.done;
            return next(err, newTodo, markedDone);
        });
    });
}

/**
 * Mark a Todo as (un)done, given an ID.
 *
 * Callback will get any errors (or null), and the updated Todo
 * (or null if it didn't update).
 *
 * @param {Todo} todo
 * @param {Boolean} OPTIONAL set 'done' to true (Default) or false
 * @param {Function} next (error, todo)
 * @api public
 */
Todos.prototype.done = function (id, value, next) {
    if (!next && typeof value === 'function') {
        next = value;
        value = true;
    }

    return this.update(id, {
        done: value
    }, next);
}

/**
 *  Parse a string and produce a valid MongoDB ObjectID, or 'Bad ID' error.
 *
 *  @param {String} id
 *  @return {Object} ObjectID
 *  @api private
 */
function parseObjectId(id) {
    try {
        return new Mongo.ObjectID(id);
    } catch (err) {
        return new Error("Bad ID: '" + id + "'");
    };
}

/**
 *  Parse a search criteria object and produce a valid MongoDB Search object.
 *
 *  Valid criteria are:
 *
 *      done    {Boolean}   done or not
 *      text    {String}    string to search for in both title and body (via regex)
 *      title   {String}    string to search for in the title (via regex)
 *      body    {String}    string to search for in the body (via regex)
 *      case    {Boolean}   case-sensitive regexes (default) or not
 *
 *  @param {Object} criteria
 *  @return  {Object} search
 *  @api private
 */
function parseCriteria(criteria) {
    if (!criteria) return {};

    var search = {};

    var caseSensitive = criteria['case-sensitive'];

    if (criteria.title) search.title = regexCriterion(criteria.title, caseSensitive);
    if (criteria.body) search.body = regexCriterion(criteria.body, caseSensitive);

    if (criteria.text) {
        search.$or = [{
            title: regexCriterion(criteria.text, caseSensitive)
        }, {
            body: regexCriterion(criteria.text, caseSensitive)
        }];
    }

    if (~['false', 'true'].indexOf((criteria.done || '').toLowerCase())) search.done = (criteria.done.toLowerCase() === 'true');

    return search;
}

/**
 *  Assemble a MongoDB Regex criterion, with or without the case-'i'nsenstive
 *  flag.
 *
 *  @param {String} value
 *  @param {Boolean} sensitive (default is false)
 *  @api private
 */
function regexCriterion(value, senstive) {
    var criterion = {};

    criterion.$regex = value;
    if (!senstive) criterion.$options = 'i';

    return criterion;
}
