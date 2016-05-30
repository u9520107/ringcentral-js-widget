var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var rollup = require('gulp-rollup')
var babel = require('gulp-babel')
var rename = require('gulp-rename')
var util = require('gulp-util')
var jscs = require('gulp-jscs')
var watch = require('gulp-watch')
var plumber = require('gulp-plumber')
var print = require('gulp-print')
var nodeResolve = require('rollup-plugin-node-resolve')
var commonjs    = require('rollup-plugin-commonjs')
var json = require('rollup-plugin-json')
var replace = require('rollup-plugin-replace')

var postcss = require('gulp-postcss')

gulp.task('compile', () => {
    watch('./src/scripts/**/**', compile)
    watch('./src/styles/**/**', styles)
    styles()
    return compile()
})
gulp.task('factory', () => {
    watch(['./factory/**/**', './services/**'], factory)
    return factory()
})
gulp.task('embed', () => {
    watch(['./embed/host/**/**', './embed/guest/**/**'], function() {
        embed('host')
        embed('guest')
    })
    embed('host')
    embed('guest')
})

function compile() {
    return gulp.src('./src/scripts/index.js')
        .pipe(print(function(filepath) {
            return 'built: ' + filepath
        }))
        .pipe(plumber({
            errorHandler: function(err) {
                console.log(err.message)
                this.emit('end')
            }
        }))
        .pipe(rollup({
            sourceMap: true,
            plugins: [
                nodeResolve({jsnext: true, main: true, browser: true}),
                commonjs()
            ],

        }))
        .pipe(babel())
        .on('error', util.log)
        .pipe(rename('build.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build'))
}
function styles() {
    return gulp.src('./src/styles/main.css')
    .pipe(print(function(filepath) {
            return 'built: ' + filepath
        }))
    .pipe(plumber({
        errorHandler: function(err) {
            console.log(err.message)
            this.emit('end')
        }
    }))
    .pipe(
        postcss([
            require('precss')({ /* options */ })
        ])
    ).pipe(
        gulp.dest('./build/styles')
    )
}
function factory() {
    return gulp.src('./factory/factory.js')
        .pipe(print(function(filepath) {
            return 'built: ' + filepath
        }))
        .pipe(plumber({
            errorHandler: function(err) {
                console.log(err.message)
                this.emit('end')
            }
        }))
        .pipe(rollup({
            sourceMap: true,
            plugins: [
                nodeResolve({
                  jsnext: true, 
                  main: true, 
                  browser: true, 
                  preferBuiltins: false,
                }),
                commonjs(),
                json(),
                replace({
                    'process.env.NODE_ENV': JSON.stringify( 'production' )
                })
            ],
            format: 'cjs'
        }))
        .pipe(babel())
        
        .on('error', util.log)
        .pipe(rename('factory.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build'))
}

function embed(target) {
    return gulp.src('./embed/' + target +'/index.js')
        .pipe(print(function(filepath) {
            return 'built: ' + filepath
        }))
        .pipe(plumber({
            errorHandler: function(err) {
                console.log(err.message)
                this.emit('end')
            }
        }))
        .pipe(rollup({
            sourceMap: true,
            plugins: [
                nodeResolve({
                  jsnext: true,
                  main: true,
                }),
                commonjs(),
                json(),
                replace({
                    'process.env.NODE_ENV': JSON.stringify( 'production' )
                })
            ],
            format: 'umd'
        }))
        .pipe(babel())
        
        .on('error', util.log)
        .pipe(rename(target + '.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./embed'))
}

gulp.task('lint', function() {
    return gulp.src('src/scripts/**/**')
          .pipe(jscs({fix: true, configPath: '.jscsrc'}))
          .pipe(gulp.dest('src/scripts'))
})
gulp.task('css', function() {
    return gulp.src('./css/src/*.css').pipe(
        postcss([
            require('precss')({ /* options */ })
        ])
    ).pipe(
        gulp.dest('./css')
    )
})
gulp.task('default', ['compile'])
gulp.task('fac', ['factory'])
gulp.task('ebd', ['embed'])
