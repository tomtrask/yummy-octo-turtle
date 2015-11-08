// Include gulp
var gulp = require('gulp')
var usemin = require('gulp-usemin')
var uglify = require('gulp-uglify')
var jshint = require('gulp-jshint')
var concat = require('gulp-concat')
var del = require('del')
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
    src+'html/index.html'
  ],
  assets : [
    src+'resources/**/*.png'
  ],
  output: [
    dist
  ]
}

// do everything we do for inline minify, concat, obscure right here
gulp.task('compactigate', function() {
    // css: [minifyCss({keepSpecialComments: 0}), 'concat'],
    return gulp.src(paths.index)
        .pipe(usemin({
            jsApp : ['concat'],
            jsExt : [uglify(), 'concat'],
        }))
        .pipe(gulp.dest(dist));
});

gulp.task('copy-assets', function() {
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
// I haven't seen a satisfactory chaining (serializing) scheme --- until I do,
// build will not start with clean
gulp.task('build', ['lint', 'copy-assets', 'compactigate'])


