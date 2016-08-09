var express = require('express');
var path = require('path');
var fs = require('fs');
var readline = require('readline');


module.exports = function(app) {
  var router = express.Router();

  var resultCashe = {};

  function getResult(key) {
    return resultCashe[key];
  }

  function putResult(key, data) {
    resultCashe[key] = data;
    return data;
  }

  function readFile(fileLocation, callback, onError) {
    var options = {
      encoding: 'utf8',
      flag: 'r'
    };

    fs.readFile(fileLocation, options, function(err, data) {
      if (err) {
        onError && onError(err.message);
      }

      callback && callback(data);
    });
  }

  /* GET the default filename */
  router.get('/', function(req, res, next) {

    var filename = app.contents.provenance;

    var result = getResult(filename);
    if (result) {
      res.end(result);
      return;
    }

    var fileLocation = path.join(app.dataLocation, filename);

    readFile(fileLocation, function(json) {
      var result = putResult(filename, json);
      res.end(result);
    }, function(error){
        res.end(error);
    });
  });

  return router;
};
