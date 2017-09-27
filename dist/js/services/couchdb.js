'use strict';

/**
 *  COUCHDB.js
 *  - an Angular service to work with JSON data and a document store
 *
 *  Versions
 *  0.1 - 08-APRIL-2014
 *  0.2 - 19-JUL-2014, refactoring and documenting
 *  0.3 - 01-AUG-2014, make method Init() create fresh db is explicitly requested
 *
 *  Using this Service
 *
 *  The service is intentionally simple and underpowered, compared to the full
 *  range of operations one can do with CouchDB.  A couple of assumptions have been made:
 *
 *  1. You know enough about CouchDB to understand it's basic functions and how
 *      its URLs are formed to bring about results.  In fact, this library is
 *      actually not much more than a string-manager that knows about some "syntax"
 *      as related to CouchDB URLs.
 *
 *  2. You are using CouchDB Design Documents to store CouchDB Views, which themselves
 *      codify the means you need to organize and retrieve your CouchDB documents. While
 *      this library indeed supports reading documents "directly" - meaning by the doc's
 *      unique document id, I find reading docs by views to be easier and more productive. *
 *
 */

var CouchDBService = angular.module( 'CouchDBService', [] );

CouchDBService.factory( 'CouchDB', [ '$http',

    function( $http ) {

        var VERSION = "1.0.0";

        // Useful strings
        var strings = {
            COLON: ':',
            COUNT: '?count=',
            DESCENDING: 'descending=true',
            DESIGN: '/_design/',
            ENDKEY: 'endkey=',
            HTTP: 'http://',
            INCLUDE_DOCS: 'include_docs=true',
            KEY: 'key=',
            LIMIT: 'limit=',
            QUOTE: '"',
            REVISION: '?rev=',
            SKIP: 'skip=',
            SLASH: '/',
            STARTKEY: 'startkey=',
            UUIDS: '_uuids',
            VIEW: '/_view/',
        };

        // Default properties for the application.
        // Properties describe a particular Couch instance. Used in no overriden
        // at API method call time.
        var defaultConfig = {
            baseUrl: null,
            database: "test_main",
            designDocument: "baseline",
            host: "localhost",
            port: "5984"
        };

        // Host-oriented properties used by API methods.
        // Set be caller of individual API methods, or default values.
        var config = {
            baseUrl: null,
            database: null,
            designDocument: null, //
            host: null,
            port: null,
            serverUrl: null //
        };

        // Private GET-oriented properties used by API methods.
        // It is expected that each of the relevant properties is set by the
        // caller of the API method.
        var read = {
            // Strings
            docId: null,
            endKey: null,
            key: null,
            limit: 0,
            revisionId: null,
            skip: 0,
            startKey: null,
            view: null,
            // Booleans
            descending: null,
            includeDocs: null
        };

        // Private PUT/POST-oriented properties used by API methods.
        // It is expected that each of the relevant properties is set by the
        // caller of the API method.
        var write = {
            data: null,
            docId: null,
            method: null,
            revisionId: null
        };

        //
        // Private methods
        // _____________________________________________________________________

        var _addURLParameter = function( stem, fragment ) {
            // Append @fragment to @stem, after deciding whether to prepend the \?\
            // character or \&\ character.
            //
            //  ? is used when @fragment is the first URL parameter
            //  & is used when @fragment is the second thru n-th URL parameter
            //
            var i = stem.indexOf( "?" );
            if ( i > -1 ) {
                return stem.concat( "&", fragment );
            };
            return stem.concat( "?", fragment );
        };

        var _callDB = function( method, url, data ) {
            // Generalized HTTP call.
            return $http( {
                    method: method,
                    url: url,
                    data: data
                } )
                .success( function( data, status, headers, config ) {
                    // called async on success
                    return data;
                } )
                .error( function( data, status, headers, config ) {
                    // called async on failure
                    var msg;
                    msg = 'CouchDB.js, Method ' + config.method;
                    msg = msg + ', Status ' + status;
                    msg = msg + ', Url ' + config.url;
                    throw new Error( msg );
                } );
        };

        var _encode = function( str ) {
            return encodeURIComponent( str ).replace( /[!'()]/g, escape ).replace( /\*/g, "%2A" );
        };

        var _makeBaseUrl = function( config ) {
            return _makeServerUrl( config ) + config.database;
        };

        var _makeServerUrl = function( config ) {
            return strings.HTTP.concat( config.host, strings.COLON, config.port, strings.SLASH );
        };

        var _makeViewUrl = function( config, read ) {
            /** Compose view URL based on current config and GET-oriented properties
             *
             *  Catalog:
             *  - Basic :       http://10.21.32.43:5984/test_main/_design/baseline/_view/user
             *  - ByKey :       http://10.21.32.43:5984/test_main/_design/baseline/_view/user?key="Cooper"
             *  - StartWith :   http://10.21.32.43:5984/test_main/_design/baseline/_view/user?startkey="Copeland"
             *  - Between : :   http://10.21.32.43:5984/test_main/_design/baseline/_view/user?startkey="Cooper"&endkey="Copeland"
             *  - Limit :       http://10.21.32.43:5984/test_main/_design/baseline/_view/user?limit=3
             *  - Skip :        http://10.21.32.43:5984/test_main/_design/baseline/_view/user?skip=12
             *  - Order(desc) : http://10.21.32.43:5984/test_main/_design/baseline/_view/user?&descending=true
             *                  http://10.21.32.43:5984/test_main/_design/baseline/_view/user?endkey="Copeland"&descending=true
             *  - Include Docs: http://10.21.32.43:5984/test_main/_design/baseline/_view/user?include_docs=true
             */

            //  BASIC view
            //  If a design document is specified in the Read properties, it is used. Otherwise the default design
            //  document is presumed.
            //  *Note: somehow, a design document must be supplied. If it's not supplied by the API caller and a default
            //  document hasn't been declared, an error is thrown.
            //
            //  TODO - check for existence of the view ??       <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            //
            //
            if ( read.designDocument ) {
                var _url = _makeBaseUrl( config ) + strings.DESIGN + read.designDocument + strings.VIEW + read.view;

            } else {

                if ( config.designDocument ) {
                    var _url = _makeBaseUrl( config ) + strings.DESIGN + config.designDocument + strings.VIEW + read.view;

                } else {
                    throw new Error( ' Failed to form basic GET URL. A design document was expected.' )
                };
            };

            //  DESCENDING clause (optional)
            //  When a descending clause is specified (@descending is a boolean), append the 'descending=true' URL parameter.
            if ( read.descending ) {
                _url = _addURLParameter( _url, strings.DESCENDING );
            };

            // LIMIT clause (optional)
            // When a limit value is specified, append the 'limit=' URL parameter with the value specified
            if ( read.limit ) {
                var n = parseInt( read.limit );
                _url = _addURLParameter( _url, strings.LIMIT + n );
            };

            // SKIP clause (optional)
            // When a skip value is specified, append the 'skip=' URL parameter with the value specified
            if ( read.skip ) {
                var n = parseInt( read.skip );
                _url = _addURLParameter( _url, strings.SKIP + n );
            };

            // KEY clause (optional)
            // When a key value is specified, append the 'key=' URL parameter with the value specified, Additionally,
            // by arbitrary decision on my part, the presence of a KEY clause takes precedence over a START KEY, END KEY
            // or a START KEY + END KEY combination.
            if ( read.key ) {
                _url = _addURLParameter( _url, strings.KEY + _encode( strings.QUOTE + read.key + strings.QUOTE ) );

                if ( read.includeDocs ) {
                    _url = _addURLParameter( _url, strings.INCLUDE_DOCS );
                };
                return _url;
            };

            // STARTKEY clause (optional)
            // When a startkey value is specified, append the 'startkey=' URL parameter with the value specified,
            if ( read.startKey ) {
                _url = _addURLParameter( _url, strings.STARTKEY + _encode( strings.QUOTE + read.startKey + strings.QUOTE ) );
            };

            // ENDKEY clause (optional)
            // When an endkey value is specified, append the 'endkey=' URL parameter with the value specified,
            if ( read.endKey ) {
                _url = _addURLParameter( _url, strings.ENDKEY + _encode( strings.QUOTE + read.endKey + strings.QUOTE ) );
            };

            //  INCLUDE_DOCS clause (optional)
            //  When an include_docs clause is specified (@include_docs is a boolean), append the 'include_docs=true' URL parameter.
            if ( read.includeDocs ) {
                _url = _addURLParameter( _url, strings.INCLUDE_DOCS );
            };
            return _url;
        };

        var _makeWriteUrl = function( config, write ) {
            // Compose a URL for a PUT/POST operation
            // Example: http://10.21.32.43:5984/test_main/d751b4ee61c3a63283f7b94f1b000c97
            if ( config.baseUrl ) {

                var url = config.baseUrl;
                if ( write.docId ) {
                    url = url.concat( strings.SLASH, write.docId );
                };
                return url;

            } else {
                throw new Error( 'Invalid baseUrl in Config object; Did you call the INIT method first? ' );
            };
        };

        var _setViewParameters = function( parameters ) {
            // Set private GET-oriented properties from properties supplied by the
            // API method caller.

            config.designDocument = parameters.designDocument || config.designDocument;
            // GET oriented properties
            read.descending = parameters.descending || null;
            read.endKey = parameters.endKey || null;
            read.includeDocs = parameters.includeDocs || null;
            read.key = parameters.key || null;
            read.limit = parameters.limit || 0;
            read.skip = parameters.skip || 0;
            read.startKey = parameters.startKey || null;
            read.view = parameters.view || null;
        };

        var _setWriteParameters = function( parameters ) {
            // Set private PUT/POST-oriented properties from properties supplied
            // by the caller of the API method.
            write.docId = parameters.docId || null;
            write.revId = parameters.revId || null;
            write.data = parameters.data || null;

            // Deduce the HTTP verb to use
            if ( write.docId === null && write.revId === null ) {
                // No doc id means POST
                write.method = "POST";
                return true;
            };

            if ( write.docId ) {
                // A doc id implies a PUT
                write.method = "PUT";

                if ( write.revisionId ) {
                    // A revision id implies an update; as a convenience we place
                    // the revid into the data object because that is where it is expected
                    // by CouchDB
                    write.data._rev = write.revisionId;
                };
                return true;
            };
            // Something is missing in the write parameters object
            console.log( 'Write properties:', parameters );
            throw new Error( "Invalid write properties object; couldn't determine PUT or POST verb." )
        };

        //
        // Public methods
        // _____________________________________________________________________

        return {

            init: function( couchDBconfig, createNewDb ) {
                // Inspect a configuration object passed by API caller, use
                // properties values therein to set the private configuratio
                // object. Properties not passed by the caller are set to
                // default values.

                // console.log( 'angular-couchdb.js, a simple clientside service,', VERSION );

                // Create a new db if explicitly directed to do so
                var createDB = createNewDb || false;

                // Set private configuration object properties
                if ( couchDBconfig && typeof couchDBconfig === "object" ) {

                    config.host = couchDBconfig.host || defaultConfig.host;
                    config.port = couchDBconfig.port || defaultConfig.port;
                    config.database = couchDBconfig.database || defaultConfig.database;
                    config.designDocument = couchDBconfig.designDocument || defaultConfig.designDocument;

                } else {
                    // Just use default configuration values
                    config.host = defaultConfig.host;
                    config.port = defaultConfig.port;
                    config.database = defaultConfig.database;
                    config.designDocument = defaultConfig.designDocument;

                };

                // Compose the following important URL stem string:
                // http://localhost:5984/
                config.serverUrl = _makeServerUrl( config );
                // http://localhost:5984/database
                config.baseUrl = _makeBaseUrl( config );

                if ( createDB == true ) {
                    return _callDB( 'PUT', config.baseUrl );
                } else {
                    return;
                };
            },

            read: function( couchRead ) {
                /**
                 * Compose a GET request for use with CouchDB.
                 *
                 * Three forms of GET are supported as follows:
                 *
                 * 1. Read implemented via a specified CouchDB view in a specified CouchDB design document
                 *     Example: GET http://192.168.1.17:5984/factory/_design/baseline/_view/user
                 *
                 * 2. Direct read by a specified document id.
                 *     Example: GET http://192.168.1.17:5984/factory/fa561c38af1f7a16e3a26140a2002712
                 *
                 * 3. Direct read of the database instance
                 *     Example: GET http://192.168.1.17:5984/factory
                 */

                var url;

                // Check if caller sent a GET configuration object
                if ( couchRead && typeof couchRead === "object" ) {

                    // Develop the view URL when a viewname is present
                    if ( couchRead.view ) {
                        _setViewParameters( couchRead );
                        url = _makeViewUrl( config, read );

                    } else {
                        // Develop a read by document id when no view name is present

                        if ( couchRead.docId ) {
                            url = _makeBaseUrl( config );
                            url = url.concat( strings.SLASH, couchRead.docId );

                            // If a revision id is provided, augment the Url for the revision
                            if ( couchRead.revisionId ) {
                                url = url.concat( strings.REVISION, couchRead.revisionId )
                            };

                        } else {
                            // A document id is required when no view name is passed
                            console.log( 'GET properties:', couchRead );
                            throw new Error( ' READ method: a document id is required when no view name is passed.' )
                        };
                    };

                } else {
                    // Make a GET to the database name when GET property object
                    // is not passed by caller
                    url = _makeBaseUrl( config );
                };

                // Make request and return a promise
                return _callDB( 'GET', url );
            },

            save: function( couchWrite ) {
                /**
                 * Compose a PUT or POST request for use with CouchDB.
                 * The type of operation (create, update) and the Http verb (PUT, POST)
                 * are inferred from the supplied parameters. In all cases, the caller
                 * is required to supply a Data object.
                 *
                 * Three actions - two Create actions and one Update action - are supported as follows:
                 *
                 *  Create actions
                 *      1. POST (create a new document, directing CouchDB to assign a document id)
                 *
                 *      Format:
                 *          @url  : <string> http://10.21.32.43:5984/test_main
                 *          @data : <object> variable properties/values
                 *
                 *      2. PUT (create a new document, supplying the document id to CouchDB)
                 *
                 *      Format:
                 *          @url  : <string> http://10.21.32.43:5984/test_main/823997b8f15d2113c6f08d015700890e
                 *          @data : <object> variable properties/values
                 *
                 *
                 *  Update action
                 *      1. PUT (create a new version of an existing document, specified by a document id)
                 *
                 *      Format:
                 *          @url  : http://10.21.32.43:5984/test_main/823997b8f15d2113c6f08d015700890e
                 *          @data : <object>
                 *                    rev: 1-e5a6d06fd1067410e990536ec1d82c1
                 *                    variable properties/values
                 *
                 *       Notes:
                 *          1. @url must contain document id
                 *          2. @rev is required for updates.
                 *
                 */

                var data, method, url;

                if ( couchWrite && typeof couchWrite === "object" ) {
                    _setWriteParameters( couchWrite );
                    url = _makeWriteUrl( config, write );
                    method = write.method;
                    data = write.data;

                } else {
                    // The WRITE-oriented properties object is in error
                    console.log( 'WRITE properties:', couchWrite );
                    var msg = "SAVE method: method called with invalid properties object";
                    throw new Error( msg );
                };

                // console.log('COUCHDB.Service.save', method, url data );

                // Make request and return a promise
                return _callDB( method, url, data );
            },

            remove: function( couchDelete ) {
                // Delete a document from a CouchDB store using query param syntax, like so
                // http://10.21.32.43:5984/test_main/document-1234567890?rev=1-9c65296036141e575d32ba9c034dd3ee

                if ( couchDelete.docId && couchDelete.revisionId ) {
                    var url = _makeBaseUrl( config );
                    url = url.concat( strings.SLASH, couchDelete.docId, strings.REVISION, couchDelete.revisionId );

                    // Make request and return a promise
                    return _callDB( 'DELETE', url );

                } else {
                    // Either a doc id or rev id is missing, and we can't continue with the delete.
                    console.log( 'DELETE properties:', couchDelete );
                    throw new Error( 'DELETE method: both a Document Id and Revision Id are required to delete. One is missing.' )
                };
            },

            uuid: function( n ) {
                // Compose a request to return an arbotrary number of UUIDs
                // @n  - an integer number if IDs to return

                var url = config.serverUrl.concat( strings.UUIDS );

                if ( n > 0 ) {
                    url = url.concat( strings.COUNT, n );
                };

                // Make request and return a promise
                return _callDB( 'GET', url );
            },
        };
    }

 ] );