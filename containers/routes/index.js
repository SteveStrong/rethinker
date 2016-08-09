var express = require('express');

module.exports = function(app) {
  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render(app.getView('index'), app.viewModel(
    {
      title: 'Datalift',
    }));

  });
  return router;
};


