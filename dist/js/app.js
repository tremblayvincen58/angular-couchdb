'use strict';

/**
 * Application Module
 *
 * Versions:
 *   0.0  - DD-MMM-YYYY
 *
 */

var app = angular.module( 'app', [
    'ngResource',
    'ngRoute',
    'CouchDBService',
    'MainController'
 ] );

app.run( [
    "$rootScope",

    function( $rootScope ) {

        // Register lodash library globally (since it is of Window)
        $rootScope._ = window._;
    }
 ] );

app.config( [
    '$routeProvider',

    function( $routeProvider ) {

        $routeProvider

        .when( '/', {
            templateUrl: 'partials/db.html',
            controller: 'MainCtrl'
        } );
    }
 ] );