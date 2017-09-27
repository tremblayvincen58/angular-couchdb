# Angular-CouchDB

*(In which we codify some helper routines for simple 0-tier web apps backed by CouchDB.)*

##### Version 0.1 MIT License
------

### Description

This repo stores an implementation of a simplistic CouchDB library for use with AngularJS web applications.
It consists of the following components:

1. **couchdb.js** - a JS library implemented as an AngularJS service that speaks CouchDb's particular dialect of REST.
2. **app.js** - a stone-simple web app that tests the service, in lieu of proper unit-tests.

The service's features are limited and assumptions are baked in; I'll try to call them out below.

#### Dependencies

The library/service is implemented for Angular, so that is it's sole dependency. To run the app, you'll need
Angular and Lodash.  You'll also need access to an instance of Apache CouchDB, the real one, the pure one -- not one of
the CouchDB variants.

#### Goals of the Library

1. Keep it very simple.
2. Keep it as DRY as possible.
3. Keep it general and reusable.
4. Handle commonly expected errors.
5. Handle different ways to read/write Couch documents.
6. Make its use self-evident.

To the the latter point, that's why a test-harness app is included in the repo.  The test harness seemed like a
more straight-forward way to document use of the library than unit tests. Additionally, because Couch operations are
all async, the test app demonstrates use of Angular's "Q lite" promise library. Still, the test harness is a bit of
a hack, I must admit.

#### Limitations & Assumptions

1. The library assumes the CouchDB instance is **not** secured (that is, it's in *Admin party* mode). Quite a
limitation to be sure.
2. The library assumes the calling application makes use of multiple CouchDB design documents and multiple views
therein, using arbitrary view constructs (such as reduce, _count, and so on).
3. The library ignores SHOW, LIST, CHANGEFEED and other CouchDB features.
4. The library assumes you are using a single CouchDB host (ie, a single IP address/port combination)

Although it is not obvious, the test-harness depicts a naive use of the library.  In practice, I typically keep raw
database calls outside of an app's controllers, placing them instead, in a service object that encapsulates business
logic.  That is, as an example, the call path for a GET, is:

+ Controller -> Business Service Object -> CouchDB library -> Couch host.

This way, the Business Service Object can encode decisions about whether single docs are read, use of keys, etc.
And he can also decide if a No Document Found is really an error, and so forth.

### Use

Simply copy the project files and serve **index.html** from any web server.

#### Configuration

You'll need to specify some strings to identify the CouchDB host before running the test app. Do that either in the
controller, **main.js**, or in the library/service, **couchdb.js**. Note that the controller's values supercede the
values in the service.

Note also that portions the "Couch configuration" (actually just a set of strings that identify it) can be set as a
part of making a call. These properties include the database name, the design document, the view, keys, includeDocs,
and so forth.

#### Running the Test Application

The application has a single page (hey! it's a single-page application!) that shows the tests to run.  The page
looks like this, before you run the tests:

![alt text](http://www.cssian.com/angular-couchdb/angular-couch-ui-before.png "Angular CouchDB Test App - Before tests")

After a test run, the page looks like this:

![alt text](http://www.cssian.com/angular-couchdb/angular-couch-ui-after.png "Angular CouchDB Test App - After tests")

The UI sort of implies that certain tests can be run individually and others not; that is not the case. All tests
run every time.

#### The Tests & the Test Database

The test suite involves writing some simple documents with test data (U.S. Presidents) and then reading/deleting certain
of the documents.

To make the project self-booting, the test app will automatically create the necessary test database in the CouchDB
instance, naming it **test-angular-couchdb** (but with underscores, not hyphens).  Additionally, it will write a
design document, named **design** to that database so reading by views can be tested.

This database and its documents are retained after a test run, so rerunning the test suite will likely fail.  It is
trivial to delete a database using CouchDB's admin tool, _Futon_ (or its hipster spawn, _Fauxton_), so just delete the
test database prior to running the tests again.

#### Viewing Test Results

Summary level test results are displayed on the test app's page. More detailed information is logged to the browser console
and looks like this:

![alt text](http://www.cssian.com/angular-couchdb/angular-couch-console.png "Angular CouchDB Test App - Logging to browser console")

### More

The library may grow as a result of more use on my projects, for instance, it ought to recognize user roles, but no promises.
