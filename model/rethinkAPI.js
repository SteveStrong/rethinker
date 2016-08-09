'use strict'  //to get ES6 features

var fs = require('fs');
var async = require('async');
var r = require('rethinkdb');
var assert = require("assert");
var DA = require("deasync");


function rethinkAPI() {
  var self = this;

  var config = {
      host: "localhost",
      port: 28015,
      authKey: "",
      db: "datalift",
  };

  self.initDBEngine = function(app, next)
  {
    var dbEngine = 'rethinkdb -n dataliftserver --bind all'
    if (app.get('env') === 'production') {
      dbEngine = 'rethinkdb --daemon -n dataliftserver --bind all';
      shell.exec(dbEngine);
      setTimeout(next,2000);
    } else {
      console.log(dbEngine);
      setTimeout(next,20);
    }  
  }

  self.initDB = function (app,datalift,next) {
    var dataBaseName = config.db;
    var dataTableName = 'data';
    var infoTableName = 'info';
    var provenanceTableName = 'provenance';
    async.waterfall(
      [
        function connect(callback) {
            r.connect(config, callback);
        },
        function createDatabase(connection, callback) {
            //Create the database if needed.
            r.dbList().contains(dataBaseName).do(function(containsDb) {
            return r.branch(
                containsDb,
                {created: 0},
                r.dbCreate(dataBaseName)
            );
            }).run(connection, function(err) {
              callback(err, connection);
            });
        },
        function createTable(connection, callback) {
            //Create the table if needed.
            r.tableList().contains(dataTableName).do(function(containsTable) {
            return r.branch(
                containsTable,
                {created: 0},
                r.tableCreate(dataTableName)
            );
            }).run(connection, function(err) {
              callback(err, connection);
            });
        },
        function createInfoTable(connection, callback) {
            //Create the table if needed.
            r.tableList().contains(infoTableName).do(function(containsTable) {
              return r.branch(
                  containsTable,
                  {created: 0},
                  r.tableCreate(infoTableName)
              );
            }).run(connection, function(err) {
              callback(err, connection);
            });
        },
        function createInfoTable(connection, callback) {
            //Create the table if needed.
            r.tableList().contains(provenanceTableName).do(function(containsTable) {
              return r.branch(
                  containsTable,
                  {created: 0},
                  r.tableCreate(provenanceTableName)
              );
            }).run(connection, function(err) {
              callback(err, connection);
            });
        },
      ], 
      function(err, connection) {
        if(err) {
            console.error(err);
            process.exit(1);
            return;
        }

        next(err, connection);
      });
  }


//https://github.com/neumino/rethinkdbdash#writable-streams

  self.streamToTable = function(args, next) {
      rethinkdbConfig.db = args.dbName || rethinkdbConfig.db;  
      rethinkdbConfig.table = args.table || rethinkdbConfig.table;  

      var documents = args.documents || [];

      console.log('trying table:' + rethinkdbConfig.table);

      var fileName =  args.file
      console.log('fileName:' + fileName);

      var file = fs.createWriteStream(fileName);

      //do the real work of creation and loading

        //maybe load the table here?
      r.table(rethinkdbConfig.table)
        .toStream()
        .on('error', console.log)
        .pipe(file)
        .on('error', console.log)
        .on('end', function() {
          r.getPool().drain();
        });

  }

  self.streamToTableSync = DA(self.streamToTable);

  self.doQuery = function (args,next) {

      r.connect(rethinkdbConfig,function(err,conn){
        assert.ok(err === null,err);

        r.table(args.table).filter(args.filter || {}).run(conn, function(err, cursor) {
            if(err) {
              return next(err);
            }

            //Retrieve all the todos in an array.
            cursor.toArray(function(err, result) {
              return next(err, result);
            });
          });
        
      });


  }

  self.doQuerySync = DA(self.doQuery);

  return self;
}

module.exports = new rethinkAPI();
