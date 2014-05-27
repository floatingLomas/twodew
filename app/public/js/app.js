$(function () {
    polyCalc.run();
});
$(window).resize(function () {
    polyCalc.run();
});


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
        return scheduledTime;
    }).filter('inThePast', function () {
        return inThePast;
    }).filter('selectDay', function () {
        return selectDay;
    });

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

    app.controller('WeeklyTodosController', ['$scope', 'Todos',
        function ($scope, Todos) {
            $scope.days = [];


            $scope.inThePast = inThePast;
            $scope.upcomingTimes = upcomingTimes;

            $scope.todos = Todos.query(function () {
                $scope.todos = $.map($scope.todos, function (todo) {
                    todo.due = (new Date(todo.due)).toISOString()

                    return todo;
                });

                $scope.originalTodos = angular.copy($scope.todos);
            })

            $scope.$watch('todos', updateDays);

            function updateDays() {
                $scope.days = todosByDay($scope.todos);
            }

            $scope.markAllDone = function (done) {
                $.each($scope.todos, function (i, todo) {
                    todo.done = done;

                    Todos.markDone({
                        _id: ''
                    }, {
                        _id: todo._id,
                        done: todo.done
                    });
                });
            }

            $scope.flipDone = flipDone;

            function flipDone(todo) {
                todo.done = !todo.done;

                Todos.markDone({
                    _id: ''
                }, {
                    _id: todo._id,
                    done: todo.done
                });
            }

            $scope.edit = function (todo) {
                todo.editing = true;
            }

            $scope.reset = function (todo) {
                console.log('Resetting...');

                $scope.todos = angular.copy($scope.originalTodos);
                delete todo.editing;
            }

            $scope.update = function (todo) {
                todo.due = new Date(todo.due).getTime();

                todo.$update(function () {
                    delete todo.editing;
                    updateDays();
                });
            }
        }
    ]);

    function upcomingTimes(startAt, days) {
        var days = +days || 4;

        var pairings = [];

        var date = new Date(startAt).setMinutes(0, 0);
        for (var i = 0; i < (days * 24); i++) {

            pairings.push((new Date(date)).toISOString());

            date = new Date(new Date(date).getTime() + 60 * 60 * 1000)
        }

        return pairings;
    }

    function todosByDay(todos) {
        var dayMap = {};

        $.each(todos, function (i, todo) {
            var day = new Date(todo.due).setHours(0, 0, 0, 0);
            dayMap[day] = dayMap[day] || [];
            dayMap[day].push(todo);
        });

        var days = [];

        $.each(dayMap, function (k, todos) {
            days.push({
                date: new Date(+k),
                todos: todos
            });
        });

        return days;
    }

    // Filter functions
    function simpleDay(date) {
        date = new Date(date);
        if (!date || date === 'NaN') return date;
        return moment(date).format('ddd MMM D');
    }

    function scheduledTime(date) {
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

    function selectDay(date) {
        date = new Date(date).setMinutes(0, 0);
        return moment(date).format('MM/DD HH:mm');
    }
})(angular);
