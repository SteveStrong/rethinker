var express = require('express');
var http = require('http');

module.exports = function(app) {
  var router = express.Router();




  /* renders to info pahe. */
  router.get('/', function(req, res, next) {


    res.render(app.getView('payload'), app.viewModel(
      {
        title: 'Developers',
        payload: JSON.stringify(app.datalift,undefined,3),
      }));


  });

  return router;
};
