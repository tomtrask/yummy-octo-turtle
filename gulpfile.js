// Include gulp
var gulp = require('gulp')
var usemin = require('gulp-usemin')
var uglify = require('gulp-uglify')
var jshint = require('gulp-jshint')
var concat = require('gulp-concat')
var del = require('del')
var minifyCss = require('gulp-minify-css')
var rename = require('gulp-rename')

var src='client/'
var dist='punkt/'
// index.html does refer to res or resources for compactigated elements
// Also, source is in a directory called resources
var res='res/'

var paths = {
  lint : [
    'gulpfile.js',
    src+res+'**/*.js'
  ],
  index : [
    src+'index.html'
  ],
  assets : [
    src+res+'**/*.png'
  ],
  output: [
    dist
  ]
}

// do everything we do for inline minify, concat, obscure right here
gulp.task('compactigate', ['clean'], function() {
    // css: [minifyCss({keepSpecialComments: 0}), 'concat'],
    return gulp.src(paths.index)
        .pipe(usemin({
            jsApp : ['concat'],
            jsExt : [uglify(), 'concat'],
            css   : [minifyCss({keepSpecialComments: 0})],
        }))
        .pipe(gulp.dest(dist));
});

gulp.task('copy-assets', ['clean'], function() {
  return gulp.src(paths.assets)
      .pipe(rename({dirname:'images'}))
      .pipe(gulp.dest(dist+res))
})


gulp.task('clean', function() {
  return del(paths.output)
})

// Lint Task
gulp.task('lint', function() {
    return gulp.src(paths.lint)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
})

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch(paths.lint, ['lint'])
})

// Default Task
gulp.task('default', ['lint', 'watch'])
// we don't care when lint is run but copy-assets and compactigate will both
// force a single clean.  That makes clean work but now copy-assets and compactigate
// are not re-usable.  And maybe that's ok.
gulp.task('build', ['lint', 'copy-assets', 'compactigate'])


