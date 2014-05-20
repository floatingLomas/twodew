module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        foreman: {
            dev: {
                procfile: 'Procfile.dev',
                env: ['twilio.env']
            }
        }
    });

    grunt.registerTask('serve', ['foreman']);
    grunt.registerTask('default', 'serve');
};
