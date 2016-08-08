'use strict'  //to get ES6 features

var fs = require('fs');

//var r = require('rethinkdbdash')();
var r = require('rethinkdb');

var assert = require("assert");
var DA = require("deasync");


function rethinkAPI() {
  var self = this;

  var rethinkdbConfig = {
      host: "localhost",
      port: 28015,
      authKey: "",
      db: "DataLift",
      table: "Data"
  };

  self.createDb = function(dbName, next) {
    rethinkdbConfig.db = dbName || rethinkdbConfig.db;  

    var config = {host : rethinkdbConfig.host, port : rethinkdbConfig.port}
    r.connect(rethinkdbConfig,function(err,conn){
      assert.ok(err === null,err);
      r.dbCreate(rethinkdbConfig.db).run(conn,function(err,result){
        assert.ok(err === null,err);
        conn.close();
        next && next(err,result);
      }).error(function(err) {
        console.log("Error:" + JSON.stringify(err));
        next && next(err,result);
      }).finally(function(err) {
          console.log(err);
          next && next(err,result);
      });

    });
    //console.log(rethinkdbConfig);
  };

  self.createDbSync = DA(self.createDb);

  self.establishTable = function(args, next) {
      rethinkdbConfig.db = args.dbName || rethinkdbConfig.db;  
      rethinkdbConfig.table = args.table || rethinkdbConfig.table;  

      var documents = args.documents || [];

      //console.log('trying table:' + rethinkdbConfig.table)

      r.connect(rethinkdbConfig, function(err, conn) {
        if (err) {
            console.log("Could not open a connection to initialize the database");
            console.log(err.message);
            process.exit(1);
        }
        //console.log('open conn for table:' + rethinkdbConfig.table)

        //do the real work of creation and loading
        r.tableCreate(rethinkdbConfig.table).run(conn)
        .finally(function(result) {
        //maybe load the table here?
          r.table(rethinkdbConfig.table).insert(documents).run(conn, {durability: 'soft'})
          .finally(function(err, result) {
            conn.close();
            //console.log('close conn for table:' + rethinkdbConfig.table)
            next && next(err,result);
          });   
        });  

      });
  }

  self.establishTableSync = DA(self.establishTable);


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

        //r.db('data').table('usa').filter({id: 22});

        r.table('usa').filter(r.row('id').eq(22)).
          run(conn, function(err, cursor) {
              if (err && next)  next(err);
              cursor.toArray(function(err, result) {
                  //if (err) throw err;
                  next && next(err,result);
                  console.log(JSON.stringify(result, null, 2));
              });
              conn.close();
          });
      });

      next && next();

  }

  self.doQuerySync = DA(self.doQuery);

  return self;
}

module.exports = new rethinkAPI();
