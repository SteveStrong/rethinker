
var r = require("rethinkdb");

//  nodemon [your node app]

var express = require('express')
var app = express()

var shell = require('shelljs');

var dbEngine = 'rethinkdb -n dataliftdb --bind all'
if (app.get('env') === 'production') {
  dbEngine = 'rethinkdb --daemon -n dataliftdb --bind all';
  shell.exec(dbEngine);
}

//https://github.com/rethinkdb/rethinkdb-example-nodejs/tree/master/todo-angular-express-promise
console.log('Engine:', dbEngine);

var dbName = 'Super';
var tablename = 'usax';

var dbConnect = {};

console.log('now create DB');

var run = require('gen-run');
run(function* () {
  var conn = yield r.connect({ host: 'localhost', port: 28015 });
  yield r.dbCreate(dbName).run(conn);
  console.log(yield r.db(dbName).tableCreate('tv_shows').run(conn));
  console.log(yield r.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(conn));
});

var run = require('gen-run');
run(function* (resume) {
  var conn = yield r.connect({ host: 'localhost', port: 28015 }, resume);
  console.log(yield r.db('test').tableCreate('tv_shows').run(conn, resume));
  console.log(yield r.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(conn, resume));
});

//https://www.airpair.com/javascript/posts/using-rethinkdb-with-expressjs

// r.connect({
//     db: dbName
// })
// .then(function(conn) {
//     dbConnect = conn;
//     return r.dbCreate(dbName).run(conn);
// })
// .then(function(err,req){
//     return r.tableCreate(tablename).run(dbConnect)
// })
// .then(function(err,req){
//     var datalist = [
//     { id: 1, name: 'steve'},
//      { id: 2, name: 'stu'},
//      { id: 3, name: 'don'}
//     ];

//     datalist.forEach(function(item) {
//         r.table(tablename).insert(item).run(dbConnect)
//     });
// })










app.get('/', function (req, res) {
  res.send(dbEngine)
})
 
app.listen(3000)

