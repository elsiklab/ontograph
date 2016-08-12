var gulp = require('gulp');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var smoosh = require('gulp-smoosher');
var babel = require('gulp-babel');


gulp.task('inlinecss', () => {
    return gulp.src(['index.html','single.html','enrichment.html'])
        .pipe(smoosh())
        .pipe(gulp.dest('dist/'));
    gulp.src(['relationships.json']).pipe(gulp.dest('dist'));
});

gulp.task('build', ['inlinecss'], () => {
    gulp.src(['index.js'])
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(browserify())
        .pipe(uglify())
        .pipe(gulp.dest('dist'));


    return 1;
});

gulp.task('debug', ['inlinecss'], () => {

    gulp.src(['index.js'])
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(browserify())
        .pipe(gulp.dest('dist'));

    return 1;
});

gulp.task('default', ['build', 'inlinecss']);
gulp.task('devmode', ['debug', 'inlinecss']);

gulp.task('watch', () => {
    gulp.watch('js/*.js', ['default']);
    gulp.watch('index.js', ['default']);
    gulp.watch('index.html', ['default']);
    gulp.watch('enrichment.html', ['default']);
    gulp.watch('single.html', ['default']);
});
gulp.task('watchdev', () => {
    gulp.watch('js/*.js', ['debug']);
    gulp.watch('index.js', ['debug']);
    gulp.watch('index.html', ['debug']);
    gulp.watch('enrichment.html', ['debug']);
    gulp.watch('single.html', ['debug']);
});

