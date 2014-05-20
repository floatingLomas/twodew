The API looks like this:

A Todo:
```javascript
{
    "title": "A title",
    "body": "A body",
    "done": true,
    "_id": "ObjectID-from-MongoDB"
}
```

All endpoints return either a Todo (as-found, as-created, as-updated, or as-deleted) or a `{ message: 'Error message', _id: [ObjectId] }` along with the 4xx result.

`GET     /api/todos`
> Get a list of Todos.  Accepts `done=[true|false]` and regex search on `title`, `body` and `text` (searches both), as well as `case-sensitive=true` (defaults to case-insensitive).  Returns 200 Ok and an array.

`POST    /api/todos`
> Create a new Todo.  Requires `title` and `body`.  Returns 409 Conflict or 200 Ok.

`POST    /api/done`
> Mark a Todo as done by sending `{ _id: [ObjectID] }` here.  Triggers SMS. Returns 404 Not Found or 200 Ok.

`DELETE  /api/todos`
> Delete a Todo by sending `{ _id: [ObjectID] }` here.  Returns 404 Not Found or 200 Ok.

`GET     /api/todos/[ObjectID]`
> Get a specific Todo by ID.  Returns 404 Not Found or 200 Ok.

`PUT     /api/todos/[ObjectID]`
> Replace an existing Todo with a Todo.  Triggers SMS if 'done' goes from `false` to `true`.  Returns 404 Not Found or 200 Ok.

`PATCH   /api/todos/[ObjectID]`
> Update one or more fields on the Todo specified by the ID.  Triggers SMS if 'done' goes from `false` to `true`.  Returns 404 Not Found or 200 Ok.
