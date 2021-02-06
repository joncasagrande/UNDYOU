// The require statement tells Node to look into the node_modules folder for a package
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
'use strict';
const {src, dest, watch, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const bourbon = require('node-bourbon').includePaths;
const cssmin = require('gulp-cssmin');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sourcemaps = require('gulp-sourcemaps');
const removeCode = require('gulp-remove-code');
const htmlreplace = require('gulp-html-replace');
const sassLint = require('gulp-sass-lint');
const jshint = require('gulp-jshint');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');

// ------------ DEVELOPMENT TASKS -------------

// COMPILE SCSS INTO CSS
function compileSCSS() {
    console.log('---------------COMPILING SCSS---------------');
    return src(['src/assets/scss/main.scss'])
        .pipe(sass({
            outputStyle: 'expanded',
            sourceComments: 'map',
            sourceMap: 'scss',
            includePaths: bourbon
        }).on('error', sass.logError))
        .pipe(autoprefixer('last 2 versions'))
        .pipe(sourcemaps.write('./'))
        .pipe(dest('build/assets/css'))
        .pipe(browserSync.stream());
}

// COPY CUSTOM JS
function compileJS() {
    console.log('---------------COMPILE CUSTOM.JS---------------');
    return src(['src/assets/js/app.js'])
        .pipe(babel())
        .pipe(dest('build/assets/js/'))
        .pipe(browserSync.stream());
}

// SASS LINT
function scssLint() {
    console.log('---------------SASS LINTING---------------');
    return src('src/assets/scss/**/*.scss')
        .pipe(sassLint({
            configFile: '.bootstrap-lint.yml'
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
}

// JS LINTER
function jsLint() {
    return src('src/assets/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
}

// WATCH FILES
function watchFiles() {
    watch(['src/assets/scss/**/*.scss', 'src/assets/scss/*.scss'] , compileSCSS);
    watch('src/assets/js/*.js', compileJS);
}


// BROWSER SYNC
function browserSyncInit(done) {
    console.log('---------------BROWSER SYNC---------------');
    browserSync.init({
        server: './build'
    });
    return done();
}

// ------------ PRODUCTION TASKS -------------

// MINIFY SCRIPTS
function minifyScripts() {
    console.log('---------------MINIFY SCRIPTS---------------');
    return src('build/assets/js/app.js')
        // .pipe(removeLog())
        .pipe(removeCode({
            production: true
        }))
        .pipe(uglify().on('error', console.error))
        .pipe(rename('app.min.js'))
        .pipe(dest('build/assets/js'));
}

// MINIFY CSS
function minifyCss() {
    console.log('---------------MINIFY CSS---------------');
    return src([
        'src/assets/vendor/css/**/*',
        'build/assets/css/main.css'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(cssmin())
        .pipe(rename('main.min.css'))
        .pipe(dest('build/assets/css'));
}

// CHANGE TO MINIFIED VERSIONS OF JS AND CSS
// If you run the build comment second time then JS and CSS replace will not work. 
// You need to put 
//   <!-- build:<name> -->
//     Everything here will be replaced
//   <!-- endbuild -->
// More info: https://www.npmjs.com/package/gulp-html-replace
function renameSources() {
    console.log('---------------RENAMING SOURCES---------------');
    return src('build/*.html')
        .pipe(htmlreplace({
            'js': [
                'assets/js/vendors/jquery-3.5.1.min.js',
                'assets/js/vendors/popper.min.js',
                'assets/js/vendors/bootstrap.min.js',
                'assets/js/vendors/jquery.magnific-popup.min.js',
                'assets/js/vendors/jquery.easing.min.js',
                'assets/js/vendors/mixitup.min.js',
                'assets/js/vendors/headroom.min.js',
                'assets/js/vendors/smooth-scroll.min.js',
                'assets/js/vendors/wow.min.js',
                'assets/js/vendors/owl.carousel.min.js',
                'assets/js/vendors/jquery.waypoints.min.js',
                'assets/js/vendors/countUp.min.js',
                'assets/js/vendors/jquery.jquery.countdown.min.js',
                'assets/js/vendors/validator.min.js',
                'assets/js/app.min.js',
            ],
            'css': 'assets/css/main.min.css'
        }))
        .pipe(dest('build/'));
}

// RUN ALL LINTERS
exports.linters = series(scssLint, jsLint);

// DEV
exports.dev = series(parallel(compileJS, compileSCSS), browserSyncInit, watchFiles);

// PRODUCTION VERSION
exports.build = series(parallel(compileSCSS, compileJS), parallel(minifyScripts, minifyCss), renameSources, browserSyncInit);