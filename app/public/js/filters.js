(function (angular) {
    angular.module('TD.filters', []).filter('relativeDay', function () {
        return function (date) {
            if (!date || !(date instanceof Date)) return date;
            return moment(date).calendar();
        };
    }).filter('simpleDay', function () {
        return function simpleDay(date) {
            date = new Date(date);
            if (!date || date === 'NaN') return date;
            return moment(date).format('ddd MMM D');
        };
    }).filter('scheduledTime', function () {
        return function scheduledTime(date) {
            date = new Date(date);
            if (!date || date === 'NaN') return date;
            var m = moment(date);

            var result = m.format('HH:mm');

            if (m.isBefore()) {
                var result = 'It was scheduled for ' + m.calendar() + ', ' + result;
            }

            return result;
        };
    }).filter('inThePast', function () {
        return function inThePast(date) {
            date = new Date(date);
            if (!date || date === 'NaN') return date;
            return moment(date).isBefore();
        };
    }).filter('selectDay', function () {
        return function selectDay(date) {
            date = new Date(date).setMinutes(0, 0);
            return moment(date).format('MM/DD HH:mm');
        };
    }).filter('filteredBySearch', function () {
        return function filteredBySearch(days, search) {
            search = (search || '').trim();

            if (!search) return days;

            var result = [];

            $.each(days, function (k, day) {
                day.todos = $.grep(day.todos, function (todo) {
                    return~ todo.title.toLowerCase().indexOf(search) || ~todo.body.toLowerCase().indexOf(search);
                });

                if (day.todos.length) result.push(day);
            });

            return result;
        }
    });
})(angular);
