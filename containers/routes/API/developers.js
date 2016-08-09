var express = require('express');
var path = require('path');

module.exports = function(app) {
  var router = express.Router();


  /* get the manifest */
  router.get('/', function(req, res, next) {
    res.end(app.datalift);
  });


  return router;
};
