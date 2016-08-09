// Import express
'use strict';

var express = require('express');
//var bodyParser = require('body-parser');
var app = express();

//https://github.com/rethinkdb/rethinkdb-example-nodejs


//https://nodejs.org/api/vm.html
const vm = require('vm')
//const util = require('util');

const sandbox = {
  animal: 'cat',
  count: 2
};

const script = new vm.Script('count += 1; name = "kitty";');

const context = new vm.createContext(sandbox);
for (var i = 0; i < 10; ++i) {
  script.runInContext(context);
}
console.log(sandbox);

//console.log(util.inspect(sandbox));

let code =
`(function(require) {

   const http = require('http');

   http.createServer( (request, response) => {
     response.writeHead(200, {'Content-Type': 'text/plain'});
     response.end('Hello World\\n');
   }).listen(8124);

   console.log('Server running at http://127.0.0.1:8124/');
 })`;

// vm.runInThisContext(code)(require);





// Load config for RethinkDB and express
var config = require(__dirname+"/config.js");

//var r = require('rethinkdb');
var r = require('rethinkdbdash')();

app.use(express.static(__dirname + '/public'));
//app.use(bodyParser());

// Middleware that will create a connection to the database
//app.use(createConnection);

// Define main routes
app.route('/todo/get').get(get);
app.route('/todo/new').put(create);
app.route('/todo/update').post(update);
app.route('/todo/delete').post(del);

// Middleware to close a connection to the database
//app.use(closeConnection);


/*
 * Retrieve all todos
 */
function get(req, res, next) {
    r.table('todos').orderBy({index: "createdAt"}).run(req._rdbConn).then(function(cursor) {
        return cursor.toArray();
    }).then(function(result) {
        res.send(JSON.stringify(result));
    }).error(handleError(res))
    .finally(next);
}

/*
 * Insert a todo
 */
function create(req, res, next) {
    var todo = req.body;
    todo.createdAt = r.now(); // Set the field `createdAt` to the current time
    r.table('todos').insert(todo, {returnChanges: true}).run(req._rdbConn).then(function(result) {
        if (result.inserted !== 1) {
            handleError(res, next)(new Error("Document was not inserted."));
        }
        else {
            res.send(JSON.stringify(result.changes[0].new_val));
        }
    }).error(handleError(res))
    .finally(next);
}

/*
 * Update a todo
 */
function update(req, res, next) {
    var todo = req.body;
    if ((todo != null) && (todo.id != null)) {
        r.table('todos').get(todo.id).update(todo, {returnChanges: true}).run(req._rdbConn).then(function(result) {
            res.send(JSON.stringify(result.changes[0].new_val));
        }).error(handleError(res))
        .finally(next);
    }
    else {
        handleError(res)(new Error("The todo must have a field `id`."));
        next();
    }
}

/*
 * Delete a todo
 */
function del(req, res, next) {
    var todo = req.body;
    if ((todo != null) && (todo.id != null)) {
        r.table('todos').get(todo.id).delete().run(req._rdbConn).then(function(result) {
            res.send(JSON.stringify(result));
        }).error(handleError(res))
        .finally(next);
    }
    else {
        handleError(res)(new Error("The todo must have a field `id`."));
        next();
    }
}

/*
 * Send back a 500 error
 */
function handleError(res) {
    return function(error) {
        res.send(500, {error: error.message});
    }
}

/*
 * Create a RethinkDB connection, and save it in req._rdbConn
 */
function createConnection(req, res, next) {
    r.connect(config.rethinkdb).then(function(conn) {
        req._rdbConn = conn;
        next();
    }).error(handleError(res));
}

/*
 * Close the RethinkDB connection
 */
function closeConnection(req, res, next) {
    req._rdbConn.close();
}

config.rethinkdb.db = 'flow';
var tablename = 'starbucks';

var china = require("./data/flowchina");
var usa = require("./data/flowusa");
var starbucks = require("./data/starbucks");
var datalist = starbucks;

/*
 * Create tables/indexes then start express
 */
r.connect(config.rethinkdb, function(err, conn) {
    if (err) {
        console.log("Could not open a connection to initialize the database");
        console.log(err.message);
        process.exit(1);
    }

    r.table(tablename).run(conn).then(function(err, result) {
        console.log("Table and index are available, starting express...");
        startExpress();
    }).finally(function(result){
            //datalist.forEach(function(item) {
                r.table(tablename).insert(datalist).run(conn, {durability: 'soft'});
            //});
    }).error(function(err) {
        // The database/table/index was not available, create them
        r.dbCreate(config.rethinkdb.db).run(conn).finally(function() {
            return r.tableCreate(tablename).run(conn)
        }).finally(function(result) {
            //maybe load the table here?
            //datalist.forEach(function(item) {
                r.table(tablename).insert(datalist).run(conn, {durability: 'soft'});
            //});
            
        }).then(function(result) {
            console.log("Table and index are available, starting express...");
            startExpress();
            conn.close();
        }).error(function(err) {
            if (err) {
                console.log("Could not wait for the completion of the index `todos`");
                console.log(err);
                process.exit(1);
            }
            console.log("Table and index are available, starting express...");
            startExpress();
            conn.close();
        });
    });
});

function startExpress() {
    app.listen(config.express.port);
    console.log('Listening on port '+config.express.port);
}

