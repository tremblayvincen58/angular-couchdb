'use strict';

/**
 * MAIN controller - run some tests using the simple-minded CouchDB service
 *
 * 15-APR-2014 - intial version
 * 31-JUL-2014 - a more documented version
 *
 */

var MainController = angular.module( 'MainController', [] );

MainController.controller( 'MainCtrl', [

    '$filter',
    '$q',
    '$scope',
    'CouchDB',

    function( $filter, Q, $scope, CouchDB ) {
        // UI show controller
        $scope.show = {
            testsComplete: false
        };

        // Set static strings describing the target
        // host of the CouchDB instance
        $scope.this_couchDB = {
            database: "test_angular_couchdb",
            designDocument: "design",
            host: "localhost",
            //host: "192.168.1.94",
            port: "5984"
        };

        // Test control properties
        //      @run - boolean to dictate executing a test
        //      @results - boolean to store boolean state of test run, drive UI
        //      @data - results of test (ie, the response from Couch)
        $scope.tests = {
            DELETE: {
                run: true,
                results: null,
                data: null
            },
            GETbyDocId: {
                run: true,
                results: null,
                data: null
            },
            GETbyKey: {
                run: true,
                results: null,
                data: null
            },
            POST: {
                run: true,
                results: null,
                data: null
            },
            PUT: {
                run: true,
                results: null,
                data: null
            },
            UPDATE: {
                run: true,
                results: null,
                data: null
            },
            UUID: {
                run: true,
                results: null,
                data: null,
                // Quanity of UUIDs to acquire
                count: 5
            },
        };

        // Controller local methods
        $scope._addDesignDoc = function() {
            // Add the required design document
            var deferred = Q.defer();
            var designDoc = {
                "_id": "_design/test",
                "language": "javascript",
                "views": {
                    "byNumber": {
                        "map": "function(doc) {\nif ( doc.type == \"Dead President\" ) {\n    emit(doc.presidentNumber, null);\n  }\n}"
                    }
                }
            };
            var _doc = CouchDB.save( {
                data: designDoc
            } );
            _doc.then( function( response ) {
                    console.log( 'DESIGN DOC / Added document:', response.data );
                    deferred.resolve( true );
                },
                function( reason ) {
                    throw new Error( 'DESIGN DOC ADD failed:', reason );
                    deferred.reject( false );
                } );
            return deferred.promise;
        };

        $scope._main = function() {
            // Register strings describing the CouchDB and its host.
            //  @configObject - store crucial strings
            //  @boolean - explicitly request creation of a new database
            var db = CouchDB.init( $scope.this_couchDB, true );
            db.then( function( response ) {
                console.log( 'DATABASE / Add database:', $scope.this_couchDB.database );
                $scope._addDesignDoc();
            } );
        };

        $scope._now = function() {
            // Utility method for date strings
            return $filter( 'date' )( new Date(), 'yyyy/MM/dd HH:mm,sss' );
        };

        $scope._runTests = function( tests ) {
            // Chief test driver, executed from the UI.
            // To minimize the requirement for pre-staged data, many tests
            // depend on the output of other tests. In the async world of Ajax
            // we'll enforce the dependency graph using Angular promises.

            // First, the UUID retrieval test
            var testSuite = $scope.UUID( tests );

            // Now serialize the remaining tests. Any trapped failure aborts the chain.
            testSuite
                .then( function( response ) {
                    return $scope.Post( tests );
                } )
                .then( function( response ) {
                    return $scope.Put( tests );
                } )
                .then( function( response ) {
                    return $scope.GetByDocId( tests );
                } )
                .then( function( response ) {
                    return $scope.GetByKey( tests );
                } )
                .then( function( response ) {
                    return $scope.Update( tests );
                } )
                .then( function( response ) {
                    return $scope.Delete( tests );
                } )
                .then( function( response ) {
                    $scope.show.testsComplete = true;
                } );
        };

        // ACTIONS ( Tests )
        $scope.Delete = function( tests ) {
            // This test deletes a document
            var deferred = Q.defer();
            var _doc,
                _id,
                _rev,
                _dele;

            if ( $scope.tests.DELETE.run ) {

                // First, read a document to fetch its revision id
                // (We will remove the 5th President.)
                _doc = CouchDB.read( {
                    docId: '05_Monroe_James'
                } );

                _doc.then( function( response ) {
                    // cache the keys
                    _id = response.data._id;
                    _rev = response.data._rev;

                    // Perform delete
                    _dele = CouchDB.remove( {
                        docId: _id,
                        revisionId: _rev
                    } );

                    _dele.then( function( response ) {
                        console.log( 'DELETE / Removed document:', response.data );
                        $scope.tests.DELETE.data = response.data.id;
                        $scope.tests.DELETE.results = true;
                        deferred.resolve( true );

                        // When the promise fails, throw
                    }, function( reason ) {
                        throw new Error( 'DELETE test failed:', reason );
                    } );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.GetByDocId = function( tests ) {
            // This test reads a document by its ID, gets it revision number
            // and then re-reads the document using its ID and revision number as a pair
            // (the latter use case is to depict a prep step to a document update)
            //  REQUIRES; test UUID, POST
            var deferred = Q.defer();
            if ( $scope.tests.GETbyDocId.run ) {

                var readDoc = CouchDB.read( {
                    docId: $scope.tests.UUID.data.slice( 0, 1 )
                } );

                readDoc.then( function( response ) {
                    console.log( 'GET / One document read by ID only:', response.data );

                    // Re-acquire the document using revision id
                    //      ( Admittedly stupid use case, but it's included to
                    //      address the use case of "pre-reading" before update. )
                    var _readDoc = CouchDB.read( {
                        docId: response.data._id,
                        revisionId: response.data._rev
                    } );

                    _readDoc.then( function( response ) {
                        console.log( 'GET / One document read by ID & Revision number:', response.data );
                        $scope.tests.GETbyDocId.results = true;
                        $scope.tests.GETbyDocId.data = {
                            id: response.data._id,
                            rev: response.data._rev
                        }
                        deferred.resolve( true );
                    } );
                    deferred.resolve( true );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.GetByKey = function( tests ) {
            // This test performs three actions:
            //  (1) Read a document by a specified keyvalue and View
            //  (2) Read a collection of documents starting with a specified keyvalue and View
            //  (3) Read a collection of documents bounded by starting and ending key values and View
            //  REQUIRES: tests UUID, POST, PUT and Design document in the target CouchDB with the specified View.
            var deferred = Q.defer();
            var _allPromises;
            var _promises = [];
            var _readObj = {};

            if ( $scope.tests.GETbyKey.run ) {
                $scope.tests.GETbyKey.data = "";

                // Setup read by exact key
                _readObj.designDocument = "test";
                _readObj.key = "3";
                _readObj.view = "byNumber";
                // Push the call to an array of promises
                _promises.push( CouchDB.read( _readObj ) );

                // Setup read starting at key
                _readObj.key = null;
                _readObj.startKey = "4";
                // Push the call to an array of promises
                _promises.push( CouchDB.read( _readObj ) );

                // Setup read documents between keys
                _readObj.startKey = "2";
                _readObj.endKey = "4";
                // Push the call to an array of promises
                _promises.push( CouchDB.read( _readObj ) );

                // Flatten all operations into a single promise
                var _allPromises = Q.all( _promises );

                _allPromises.then( function( response ) {

                    // When promises resolve, inform the log and UI
                    _.each( response, function( resp, index ) {
                        console.log( 'GET / Read document:', resp.data.rows );

                        _.each( resp.data.rows, function( row, index ) {
                            $scope.tests.GETbyKey.data = $scope.tests.GETbyKey.data + ' ' + ( row.key + ":" + row.id );
                        } );
                        $scope.tests.GETbyKey.data = $scope.tests.GETbyKey.data + '|';
                    } );

                    $scope.tests.GETbyKey.results = true;
                    deferred.resolve( true );

                    // When the promise fails, throw
                }, function( reason ) {
                    throw new Error( 'GETBYKEY test failed:', reason );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.Post = function( tests ) {
            // This test creates a new document, allowing CouchDB to assign
            // a document id.
            //  REQUIRES: nothing
            var deferred = Q.defer();

            if ( $scope.tests.POST.run ) {
                var newPostDoc = CouchDB.save( {
                    data: {
                        type: "Dead President",
                        name: {
                            first: "George",
                            last: "Washington"
                        },
                        presidentNumber: "1",
                        created: $scope._now()
                    }
                } );

                newPostDoc.then( function( response ) {

                    // When the promise resolves, inform the log and UI
                    console.log( 'POST / Stored new document:', response.data );
                    $scope.tests.POST.data = response.data.id;
                    $scope.tests.POST.results = true;
                    deferred.resolve( true );

                    // When the promise fails, throw
                }, function( reason ) {
                    throw new Error( 'POST test failed:', reason );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.Put = function( tests ) {
            // This test writes four documents with document ids supplied by us.
            // -Documents #1 - 3 are created using UUIDs acquired earlier
            // -Document #4 is created with a document id composed from user data.
            //  REQUIRES: test UUID

            var deferred = Q.defer();
            if ( $scope.tests.PUT.run ) {

                // Put four new documents;
                // provide 3 documents with a docid retrieved from an earlier test,
                // provide 1 document with a docid created from user data.
                //
                // Requires: UUID test, and its results

                var _data = [
                // Just some demo data...
                // Note we intentionally make typo on the first name of President #2 (Adams)
                // so we can fix it later.
                    {
                        "first": "jon",
                        "last": "Adams",
                        "presidentNumber": "2"
                    },
                    {
                        "first": "Thomas",
                        "last": "Jefferson",
                        "presidentNumber": "3"
                    },
                    {
                        "first": "James",
                        "last": "Madison",
                        "presidentNumber": "4"
                    },
                    {
                        "first": "James",
                        "last": "Monroe",
                        "presidentNumber": "5"
                    }
                ];
                var _allPromises;
                var _promises = [];
                var _uuids;
                $scope.tests.PUT.data = "";

                // Reuse UUIDs from earlier test
                var uids = $scope.tests.UUID.data.slice( 0, 3 );
                // Add a manually assigned document id
                uids.push( '05_Monroe_James' );

                //Prepare document data using system-generated document ids
                _.each( uids, function( uuid, index ) {

                    var doc = {};
                    doc.type = "Dead President";
                    doc.name = {};
                    doc.name.first = _data[ index ].first;
                    doc.name.last = _data[ index ].last;
                    doc.presidentNumber = _data[ index ].presidentNumber;
                    doc.created = $scope._now();

                    // Make the write-properties object expected by the API
                    var saveObj = {};
                    saveObj.docId = uuid;
                    saveObj.data = doc;
                    // Push the save call to an array of promises
                    _promises.push( CouchDB.save( saveObj ) );
                } );

                // Make all operations into a single promise
                var _allPromises = Q.all( _promises );

                _allPromises.then( function( response ) {

                    // When promises resolve, inform the log and UI
                    _.each( response, function( resp, index ) {
                        console.log( 'PUT / Stored new document:', resp.data );
                        $scope.tests.PUT.data = $scope.tests.PUT.data + ', ' + resp.data.id;
                    } );

                    $scope.tests.PUT.results = true;
                    deferred.resolve( true );

                    // When the promise fails, throw
                }, function( reason ) {
                    throw new Error( 'PUT test failed:', reason );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.Update = function( tests ) {
            // This test modifies an existing document in two ways:
            // (1) Revise the value of an existing property: firstName
            // (2) Add a property: modified

            var deferred = Q.defer();
            var _data,
                _doc,
                _id,
                _rev,
                _updt;

            if ( $scope.tests.UPDATE.run ) {

                // First, read the document to fetch its revision id
                _doc = CouchDB.read( {
                    docId: $scope.tests.UUID.data.slice( 0, 1 )
                } );

                _doc.then( function( response ) {
                    _data = response.data;
                    // cache the keys
                    _id = response.data._id;
                    _rev = response.data._rev;

                    // mod the data
                    _data.name.first = "John";
                    _data.modified = $scope._now();

                    // Perform update
                    _updt = CouchDB.save( {
                        docId: _id,
                        revisionId: _rev,
                        data: _data
                    } );

                    _updt.then( function( response ) {
                        console.log( 'UPDATE / Modified document:', response.data );
                        $scope.tests.UPDATE.data = response.data.id;
                        $scope.tests.UPDATE.results = true;
                        deferred.resolve( true );

                        // When the promise fails, throw
                    }, function( reason ) {
                        throw new Error( 'UPDATE test failed:', reason );
                    } );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        $scope.UUID = function( tests ) {
            // This test acquires (n) number of unique ids from the CouchDB
            // host. Note it does not require a database.

            var deferred = Q.defer();

            if ( $scope.tests.UUID.run ) {

                // UUID - Generate (n) unique ids for docs
                var uids = CouchDB.uuid( tests.UUID.count );

                uids.then( function( response ) {
                    console.log( 'UUIDs:', response.data );
                    $scope.tests.UUID.data = response.data.uuids;
                    $scope.tests.UUID.results = true;
                    deferred.resolve( true );
                } );
            } else {
                deferred.resolve( false );
            };
            return deferred.promise;
        };

        // _____________________________________________________________________
        // Boot the page
        $scope._main();
} ] );