const gulp          = require('gulp')
const browserify    = require('browserify')
const livereload    = require('gulp-livereload')
const notify        = require('gulp-notify')
const sourcemaps    = require('gulp-sourcemaps')
const source        = require('vinyl-source-stream')
const buffer        = require('vinyl-buffer')
const babel         = require('babelify')
const es            = require('event-stream')
const autoprefixer  = require('gulp-autoprefixer')
const cache         = require('gulp-cached')
const concat        = require('gulp-concat')
const minifycss     = require('gulp-minify-css')
const plumber       = require('gulp-plumber')
const progeny       = require('gulp-progeny')
const rename        = require('gulp-rename')
const sass          = require('gulp-sass')
const stylus        = require('gulp-stylus')
const nib           = require('nib')
const notifyOnError = notify.onError('<%= error.message %>')

const config = {
  srcCss: 'src/style/**/*.css',
  srcStylus: 'src/style/**/*.styl',
  srcSass: 'src/style/**/*.s*ss',
  destCss: 'style',
  cssConcatTarget: 'main.css',
  srcScripts: 'src/**/*.js',
  srcAppScript: './src/index.js',
  destScripts: 'script',
  destBundle: 'bundle.js'
}

gulp.task('style', () => {

  const css = gulp.src(config.srcCss)

  const stylusStream = gulp.src(config.srcStylus)
    .pipe(plumber({ errorHandler: notifyOnError }))
    .pipe(stylus({ use: [nib()] }))

  const sassStream = gulp.src(config.srcSass)
    .pipe(plumber({ errorHandler: notifyOnError }))
    .pipe(sass({ indentedSyntax: true }))

  return es.merge(css, sassStream, stylusStream)
    .pipe(cache('style'))
    .pipe(progeny())
    .pipe(concat(config.cssConcatTarget))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest(config.destCss))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest(config.destCss))
    .pipe(livereload({ auto: false }))
})

gulp.task('script', () => {
  return browserify(config.srcAppScript, { debug: true })
    .transform(babel, {
      presets: ['es2015', 'react']
    })
    .bundle()
    .pipe(source(config.destBundle))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.destScripts))
    .pipe(livereload({ auto: false }))
})

gulp.task('watch', () => {
  gulp.watch([config.srcStylus, config.srcSass], ['style'])
  gulp.watch(config.srcScripts, ['script'])
})

gulp.task('default', ['script', 'style'])
