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

  /* renders to info pahe. */
  router.get('/', function(req, res, next) {

    var url = '/API/info';

    callService(url, function(payload) {

      function parsePayload(data)
      {
        try {
          return JSON.parse(data);
        } 
        catch(err) {
          return err;
        }
      }

      res.render(app.getView('freeformJSON'), app.viewModel(
        {
          title: 'Info',
          payload: parsePayload(payload),
        }));
    });

  });

  return router;
};
