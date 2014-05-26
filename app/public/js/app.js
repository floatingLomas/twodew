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
            lastWeek: '[Last] dddd',
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
            $scope.days = [];

            var todos = Todos.query(function () {
                console.log('Received Todos:', todos);
                $scope.days = todosByDay(todos);
                console.log('Created By Day:', $scope.days);
            });

            $scope.todos = todos;

            $scope.inThePast = inThePast;
        }
    ]);

    function todosByDay(todos) {
        var dayMap = {};

        $.each(todos, function (i, todo) {
            var day = new Date(todo.due).setHours(0, 0, 0, 0);
            dayMap[day] = dayMap[day] || [];
            dayMap[day].push(todo);
        });

        var days = [];

        $.each(dayMap, function (k, todos) {
            var date = new Date(+k);
            days.push({
                date: date,
                todos: todos
            });
        });

        return days;
    }

    function simpleDay(date) {
        date = new Date(date);
        if (!date || date === 'NaN') return date;
        return moment(date).format('ddd MMM D');
    }

    function schduledTime(date) {
        date = new Date(date);
        if (!date || date === 'NaN') return date;
        var m = moment(date);

        var result = m.format('HH:mm');

        if (m.isBefore()) {
            var result = 'It was scheduled for ' + m.calendar() + ', ' + result;
        }

        return result;
    }

    function inThePast(date) {
        date = new Date(date);
        if (!date || date === 'NaN') return date;
        return moment(date).isBefore();
    }
})(angular);
