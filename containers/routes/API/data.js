var express = require('express');
var path = require('path');

module.exports = function(app) {
  var router = express.Router();

  function sendFile(filename, res) {
    var options = {
      root: app.dataLocation,
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    };

    var file = path.join(app.dataLocation, filename);

    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.sendFile(filename, options, function(err) {
      if (err) {
        console.log(err);
        res.status(err.status).end();
      }
      else {
        console.log('Sent: ' + filename);
      }
    });
  }

  /* GET home page. */
  router.get('/', function(req, res, next) {
    var filename = app.datalift.payloadFile;
    sendFile(filename, res);
  });


  return router;
};
