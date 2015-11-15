var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');

gulp.task('copy', function() {
    gulp.src('client/*.html').pipe(gulp.dest('server/build'));
    gulp.src('client/images/**/*.*').pipe(gulp.dest('server/build/images'));
});

gulp.task('app-js', function() {
    return gulp.src('client/js/**/*.js')
      .pipe(concat('app.js'))
      //.pipe(uglify())
      .pipe(gulp.dest('server/build/js'));
});

gulp.task('watch', function() {
    gulp.watch(['client/*.html','client/js/**/*.js'], ['default']);
});
gulp.task('build', ['copy', 'app-js']);

gulp.task('default', ['copy', 'app-js']);
