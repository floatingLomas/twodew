(function () {
    'use strict';

    var app = angular.module('TD', ['mgcrea.ngStrap', 'TD.filters', 'TD.services']);

    app.run(function run() {});

    app.controller('NavigationController', ['$scope',
        function ($scope) {
            $scope.activeMenu = function (test) {
                return test === 'all';
            };
        }
    ]);

    app.service('searchService', function ($rootScope) {
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

    app.controller('SearchController', ['$scope', 'searchService',
        function ($scope, searchService) {
            $scope.search = '';

            $scope.$watch('search', function (after, before) {
                searchService.setSearch(after);
            });
        }
    ]);

    app.controller('NewTodoController', ['$scope', 'Todos',
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

    app.controller('TodosController', ['$scope', 'searchService', 'Todos',
        function ($scope, searchService, Todos) {
            $scope.dateLabel = 'Change date & hour';

            $scope.days = [];

            $scope.search = searchService.search;

            $scope.$on('search', function (after, before) {
                $scope.search = searchService.search;
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

        startAt = startAt || new Date();

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

    $(function () {
        polyCalc.run();
    });
    $(window).resize(function () {
        polyCalc.run();
    });

    $('#add-popover').popover({
        html: true,
        placement: 'right',
        container: '#add-popover-content',
        content: function () {
            $.get('partials/todo-new', function (d) {
                $('#add-popover-container').html(d);
            });
            return '<div id="add-popover-container"/>';
        }
    });

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
})(angular);
