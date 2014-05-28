(function () {
    'use strict';

    var app = angular.module('TD', ['mgcrea.ngStrap', 'TD.controllers', 'TD.filters', 'TD.services']);

    app.run(function run() {});

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
