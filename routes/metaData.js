var express = require('express');
var http = require('http');

module.exports = function(app) {
  var router = express.Router();

  function callService(url, callback) {

    var port = app.locals.settings.port || 3000;

    return http.get({
      path: url,
      port: port
    }, function(response) {
      // Continuously update stream with data
      var body = '';
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function() {
        callback(body);
      });
    });
  }

  /* renders to metadata page. */
  router.get('/', function(req, res, next) {

    var url = '/API/metaData';
    callService(url, function(payload) {
        res.render(app.getView('payload'), app.viewModel(
        {
          title: 'Meta Data',
          payload:  payload,
        }));
    });



  });

  return router;
};

