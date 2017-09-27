//  GulpFile.js
//
//      Project: angular-couchdb
//      Date: 2014-JUL-31
//      Gulp helpers:
//          npm install gulp-autoprefixer gulp-cache gulp-concat gulp-imagemin gulp-jshint gulp-minify-css --save-dev
//          npm install gulp-notify gulp-rename gulp-rimraf gulp-uglify --save-dev
//
var gulp = require( 'gulp' );

var autoprefixer = require( 'gulp-autoprefixer' );
var cache = require( 'gulp-cache' );
var clean = require( 'gulp-rimraf' );
var concat = require( 'gulp-concat' );
var imagemin = require( 'gulp-imagemin' );
var jshint = require( 'gulp-jshint' );
var minifycss = require( 'gulp-minify-css' );
var notify = require( 'gulp-notify' );
var rename = require( 'gulp-rename' );
var uglify = require( 'gulp-uglify' );


var bases = {
    app: 'app/',
    dist: 'dist/',
};

var paths = {
    images: [ 'img/**/*.png', 'img/**/*.jpg' ],
    javascript: [ 'js/**/*.js' ],
    libraries: [ 'lib/**/*.js' ],
    markup: [ 'index.html' ],
    partials: [ 'partials/**/*.html' ],
    styles: [ 'css/**/*.css' ],
    vectors: [ 'img/**/*.svg' ]
};

//Empty the dist directory
gulp.task( 'clean', function() {
    return gulp.src( bases.dist, {
            read: false
        } )
        .pipe( clean() );
} );

// Copy inert files to Dist directly
gulp.task( 'copy', [ 'clean' ], function() {
    gulp.src( paths.markup, {
        cwd: 'app/**'
    } )
        .pipe( gulp.dest( bases.dist ) );
    gulp.src( paths.partials, {
        cwd: 'app/**'
    } )
        .pipe( gulp.dest( bases.dist ) );
    gulp.src( paths.vectors, {
        cwd: 'app/**'
    } )
        .pipe( gulp.dest( bases.dist ) );
    gulp.src( paths.libraries, {
        cwd: 'app/**'
    } )
        .pipe( gulp.dest( bases.dist ) );
} );

gulp.task( 'styles', [ 'clean' ], function() {
    return gulp.src( paths.styles, {
            cwd: 'app/**'
        } )
        .pipe( autoprefixer( 'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4' ) )
        .pipe( gulp.dest( bases.dist ) )
        .pipe( rename( {
            suffix: '.min'
        } ) )
        .pipe( minifycss() )
        .pipe( gulp.dest( bases.dist ) )
        .pipe( notify( {
            message: 'Styles task complete'
        } ) );
} );

gulp.task( 'scripts', function() {
    return gulp.src( paths.javascript, {
            cwd: 'app/**'
        } )
        //.pipe( jshint( '.jshintrc' ) )
        //.pipe( jshint.reporter( 'default' ) )
        //.pipe( concat( 'main.js' ) )
        .pipe( gulp.dest( bases.dist ) )
        .pipe( rename( {
            suffix: '.min'
        } ) )
        .pipe( uglify() )
        .pipe( gulp.dest( bases.dist ) )
        .pipe( notify( {
            message: 'Scripts task complete'
        } ) );
} );

// Default task
gulp.task( 'default', [ 'clean' ], function() {
    gulp.start( 'copy', 'styles', 'scripts' );
} );