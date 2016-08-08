// Import express
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var async = require('async');
var dbAPI = require("./model/rethinkAPI");
var path = require('path');
var shell = require('shelljs');

//import dbAPI from "./model/rethinkAPI";


var app = express();

var dbEngine = 'rethinkdb -n dataliftserver --bind all'
if (app.get('env') === 'production') {
  dbEngine = 'rethinkdb --daemon -n dataliftserver --bind all';
  shell.exec(dbEngine);
}

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

var drugevents = require("./data/drugevents");
var australia = require("./data/flowaustralia");
var china = require("./data/flowchina");
var german = require("./data/flowgerman");
var usa = require("./data/flowusa");
var starbucks = require("./data/starbucks");


// setTimeout(function() {

//     dbAPI.createDbSync('data');
//     //dbAPI.establishTableSync({table: 'starbucks', documents: starbucks});
//     dbAPI.establishTableSync({table: 'usa', documents: usa});
//     //dbAPI.establishTableSync({table: 'australia', documents: australia});
//     //dbAPI.establishTableSync({table: 'german', documents: german});
//     dbAPI.establishTableSync({table: 'china', documents: china});

//     //dbAPI.establishTableSync({table: 'drugevents', documents: drugevents});
//     dbAPI.establishTableSync({table: 'info', documents: require("./data/info")});

//     //dbAPI.establishTableReadStream({table: 'drugevents', file:  path.join(__dirname, 'data/drugevents.json')});

//     //dbAPI.establishTableSync({table: 'info'});
//     //dbAPI.streamToTableSync({table: 'info', file: path.join(__dirname, 'data/info.json')});
    
//     //dbAPI.establishTableSync({table: 'provenance', documents: require("./data/provenance")});
      
//     //dbAPI.establishTableSync({table: 'sltcrime', documents: require("./data/sltcrime.csv")});

// }, 2000);


function index(req, res, next) {
    let result = {
        status: 'is cool',
        context: 'everything',
    }
    res.send(JSON.stringify(result));

    next && next();
}

function queryGET(req, res, next) {   
    var args = {
        table: 'usa',
        filter: {'headCount': 3}
    }
    dbAPI.doQuerySync(args, function(err,found){
        if(err) {
            return next(err);
        }
        res.json(found);
    });
}

function queryPOST(req, res, next) {   
    var args = req.body;
    dbAPI.doQuerySync(args, function(err,found){
        if(err) {
            return next(err);
        }
        res.json(found);
    });
}

// Define main routes
app.route('/').get(index);


app.route('/query')
    .get(queryGET)
    .post(queryPOST);

/*
 * Send back a 500 error
 */
function handleError(res) {
    return function(error) {
        res.send(500, {error: error.message});
    }
}

function startExpress() {
    var port = 3000;
    app.listen(port);
}

startExpress();

