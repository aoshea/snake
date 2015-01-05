var gulp        = require('gulp'),
    browserify  = require('gulp-browserify'),
    livereload  = require('gulp-livereload'),
    notify      = require('gulp-notify'),
    plumber     = require('gulp-plumber')
    ;


/** 
 * Define default tasks 
 * @usage `gulp`
 */
gulp.task('default', ['build', 'watch']);

/** 
 * Build script for js
 * @usage `gulp build`
 */
gulp.task('build', function() {
  return gulp.src('src/main.js')
      .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
      .pipe(browserify())
      .pipe(gulp.dest('dist/'))
      .pipe(livereload());
});

/** 
 * Global watch script
 * @usage `gulp watch`
 */
gulp.task('watch', function() {
    gulp.watch('src/*.js', ['build'])
    .on('change', livereload.changed);
});


