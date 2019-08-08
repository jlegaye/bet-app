const util = require('util')
const bet = require('./bet')


module.exports = function(app) {

  // api ---------------------------------------------------------------------
  // get all todos
  app.get('/api/results', function(req, res) {
    bet.resolveSoccer(req.query.country,req.query.league).then((result) => res.json(result));
    /*bet.getHockeyEventsPredictions(req.query.url, req.query.under_check, req.query.iteration_check)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))*/
  });


  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};
