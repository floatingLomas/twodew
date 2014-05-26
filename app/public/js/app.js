var fakeDays = [{
    date: new Date(2014, 4, 25, 0, 0, 0),
    todos: [{
        title: "I was supposed to do this yesterday.",
        body: "A body",
        due: new Date(2014, 4, 24, 18, 0, 0),
        done: false,
        _id: 'abc123xyz'
    }, {
        title: "This is due today",
        body: "Another body",
        due: new Date(2014, 4, 25, 23, 0, 0),
        done: false,
        _id: 'abc123xyz'
    }, {
        title: "This was also due today but it's done.",
        body: "Another body",
        due: new Date(2014, 4, 25, 23, 0, 0),
        done: true,
        _id: 'abc123xyz'
    }]
}];

(function () {
    'use strict';

    moment.lang('en', {
        calendar: {
            lastDay: '[Yesterday]',
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            lastWeek: '[last] dddd',
            nextWeek: 'dddd',
            sameElse: 'L'
        }
    });

    var app = angular.module('TD', ['TD.filters', 'TD.services']);

    app.run(function run() {});

    angular.module('TD.filters', []).filter('relativeDay', function () {
        return function (date) {
            if (!date || !(date instanceof Date)) return date;
            return moment(date).calendar();
        };
    }).filter('simpleDay', function () {
        return simpleDay;
    }).filter('scheduledTime', function () {
        return schduledTime;
    }).filter('inThePast', function () {
        return inThePast;
    });

    angular.module('TD.services', ['ngResource']).factory('Todos', function ($resource) {
        return $resource('/api/:action/:id', {
            _id: '@id'
        }, {
            query: {
                method: 'GET',
                params: {
                    action: 'todos'
                },
                isArray: true
            }
        });
    });

    app.controller('WeeklyTodosController', ['$scope', 'Todos',
        function ($scope, Todos) {
            $scope.days = fakeDays;

            var todos = Todos.query(function () {
                console.log(todos);
            });

            $scope.todos = todos;

            $scope.inThePast = inThePast;
        }
    ]);

    function simpleDay(date) {
        if (!date || !(date instanceof Date)) return date;
        return moment(date).format('ddd MMM D');
    }

    function schduledTime(date) {
        if (!date || !(date instanceof Date)) return date;
        var m = moment(date);

        var result = m.format('HH:mm');

        if (m.isBefore()) {
            var result = 'It was scheduled for ' + m.calendar() + ', ' + result;
        }

        return result;
    }

    function inThePast(date) {
        if (!date || !(date instanceof Date)) return date;
        return moment(date).isBefore();
    }
})(angular);
