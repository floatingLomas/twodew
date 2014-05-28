(function (angular) {
    'use strict';

    var ctrls = angular.module('TD.controllers', ['TD.services']);

    ctrls.controller('NavigationController', ['$scope', 'simpleLocationService',
        function ($scope, simpleLocationService) {
            $scope.location = '';

            $scope.activeMenu = function (test) {
                return $scope.location === test;
            };

            $scope.setSimpleLocation = function (location) {
                $scope.location = location;
                simpleLocationService.setLocation(location);
            };

            $scope.setSimpleLocation('today');
        }
    ]);

    ctrls.controller('SearchController', ['$scope', 'searchService',
        function ($scope, searchService) {
            $scope.search = '';

            $scope.$watch('search', function (after, before) {
                searchService.setSearch(after);
            });
        }
    ]);

    ctrls.controller('NewTodoController', ['$scope', 'Todos',
        function ($scope, Todos) {
            $scope.dateLabel = 'Set date & hour';
            $scope.isModal = true;

            $scope.todo = {
                editing: true
            };

            $scope.upcomingTimes = upcomingTimes;

            $scope.reset = function (todo) {
                $scope.todo = {
                    editing: true
                };
            };

            $scope.update = function (todo) {
                var todo = new Todos($scope.todo);

                todo.$save(todo, function () {

                });
            };
        }
    ]);

    ctrls.controller('TodosController', ['$scope', 'searchService', 'simpleLocationService', 'Todos',
        function ($scope, searchService, simpleLocationService, Todos) {
            $scope.dateLabel = 'Change date & hour';

            $scope.days = [];

            $scope.search = searchService.search;

            $scope.$on('search', function () {
                $scope.search = searchService.search;
                updateDays();
            });

            $scope.location = 'today';

            $scope.$on('simpleLocation', function () {
                $scope.location = simpleLocationService.location;
                updateDays();
            });

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
                var starting = moment(new Date());

                if ($scope.location === 'today') starting = starting.startOf('day');
                if ($scope.location === 'week') starting = starting.startOf('week');
                if ($scope.location === 'all') starting = moment(new Date(0));

                $scope.days = todosByDay($scope.todos, starting.toDate());
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

        startAt = startAt || new Date();

        var pairings = [];

        var date = new Date(startAt).setMinutes(0, 0);
        for (var i = 0; i < (days * 24); i++) {

            pairings.push((new Date(date)).toISOString());

            date = new Date(new Date(date).getTime() + 60 * 60 * 1000)
        }

        return pairings;
    }

    function todosByDay(todos, starting) {
        var dayMap = {};

        $.each(todos, function (i, todo) {
            var day = new Date(todo.due).setHours(0, 0, 0, 0);

            if (moment(day).isBefore(starting)) return;

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
})(angular);
