module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        config: {
            foreman: {
                dev: {
                    procfile: 'Procfile.dev'
                }
            }
        },
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.registerTask('serve', ['foreman']);
    grunt.registerTask('default', 'serve');
};
