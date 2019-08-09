const util = require('util')
const bet = require('./bet')
const Mongoose = require("mongoose");
const BodyParser = require("body-parser");
//URL de notre base
const urlmongo = "mongodb+srv://admin:zZ01X0J95wewjfWL@cluster0-cfjcc.mongodb.net/bet-app?retryWrites=true&w=majority";

module.exports = function(app) {

  app.use(BodyParser.json());
  app.use(BodyParser.urlencoded({
    extended: true
  }));

  // Nous connectons l'API à notre base de données
  Mongoose.connect(urlmongo, { useNewUrlParser: true });

  // var db = mongoose.connection;
  // db.on('error', console.error.bind(console, 'Erreur lors de la connexion'));
  // db.once('open', function() {
  //   console.log("Connexion à la base OK");
  // })

  const EventModel = Mongoose.model("event", {
    home: String,
    away: String
  });

  app.post("/event", async (request, response) => {
      try {
          var event = new EventModel(request.body);
          var result = await event.save();
          response.send(result);
      } catch (error) {
          response.status(500).send(error);
      }
  });
  app.get("/events", async (request, response) => {
    try {
      var result = await EventModel.find().exec();
      response.send(result);
    } catch (error) {
      response.status(500).send(error);
    }
  });


  // api ---------------------------------------------------------------------
  // get all todos
  app.get('/api/results', function(req, res) {
    bet.resolveSoccer(req.query.country, req.query.league)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))
    /*bet.getHockeyEventsPredictions(req.query.url, req.query.under_check, req.query.iteration_check)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))*/
  });


  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};
