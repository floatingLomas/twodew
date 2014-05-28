(function (angular) {
    angular.module('TD.services', ['ngResource']).factory('Todos', function ($resource) {
        return $resource('/api/:action/:_id', {
            _id: '@_id'
        }, {
            query: {
                method: 'GET',
                params: {
                    action: 'todos'
                },
                isArray: true
            },
            save: {
                method: 'POST',
                params: {
                    action: 'todos'
                }
            },
            update: {
                method: 'PUT',
                params: {
                    action: 'todos',
                    _id: '@_id'
                }
            },
            markDone: {
                method: 'POST',
                params: {
                    action: 'done'
                }
            }
        });
    });
})(angular);
