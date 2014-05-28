(function (angular) {
    var services = angular.module('TD.services', ['ngResource']);

    services.factory('Todos', function ($resource) {
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

    services.service('searchService', function ($rootScope) {
        var searchService = {};

        searchService.search = '';

        searchService.setSearch = function (search) {
            this.search = search;
            this._broadcast();
        };

        searchService._broadcast = function () {
            $rootScope.$broadcast('search');
        };

        return searchService;
    });

    services.service('simpleLocationService', function ($rootScope) {
        var simpleLocationService = {};

        simpleLocationService.location = '';

        simpleLocationService.setLocation = function (location) {
            this.location = location;
            this._broadcast();
        };

        simpleLocationService._broadcast = function () {
            $rootScope.$broadcast('simpleLocation');
        };

        return simpleLocationService;
    });
})(angular);
