const util = require('util')
const bet = require('./bet')
const events = require('./events')
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
//URL de notre base
const urlmongo = "mongodb+srv://admin:zZ01X0J95wewjfWL@cluster0-cfjcc.mongodb.net/bet-app?retryWrites=true&w=majority";

module.exports = function(app) {

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  // Nous connectons l'API à notre base de données
  mongoose.connect(urlmongo, {
    useNewUrlParser: true
  });
  // get reference to database
  var db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function() {
    console.log("Connection Successful!");
  })

  // define Schema
  var EventSchema = mongoose.Schema({
    _id: String,
    country: String,
    league: String,
    season: String,
    homeTeam: String,
    awayTeam: String,
    htScore: String,
    homeHtScore: Number,
    awayHtScore: Number,
    halfTimeDraw: Boolean,
    halfTimeWoGoal: Boolean,
    ftScore: String,
    homeFtScore: Number,
    awayFtScore: Number,
    fullTimeDraw: Boolean,
    fullTimeWoGoal: Boolean,
    dateString: String,
    date: Number
  }, {
    _id: false
  });

  // compile schema to model
  var Event = mongoose.model('Event', EventSchema, 'events');

  app.get('/api/refreshDatabase', function(req, res) {

    events.getAllLastSeasonEvents()
      // events.getAllEvents()
      // events.getAllEventsByCountryAndLeague('USA', 'MAJOR LEAGUE SOCCER')
      .then((result) => {
        // save multiple documents to the collection referenced by Book Model
        for (var event of result) {
          Event.findByIdAndUpdate(event['_id'], event, {
            upsert: true
          }, function(err, docs) {
            if (err) {
              return console.error(err);
            } else {
              console.log("Document inserted to Collection");
            }
          });
        }

      })
      .catch((err) => console.log(err))
    res.json({
      'ok': 'ok'
    })
  })

  app.get('/api/refreshAllDatabase', function(req, res) {

    // events.getAllLastSeasonEvents()
      events.getAllEvents()
      // events.getAllEventsByCountryAndLeague('USA', 'MAJOR LEAGUE SOCCER')
      .then((result) => {
        // save multiple documents to the collection referenced by Book Model
        for (var event of result) {
          Event.findByIdAndUpdate(event['_id'], event, {
            upsert: true
          }, function(err, docs) {
            if (err) {
              return console.error(err);
            } else {
              console.log("Document inserted to Collection");
            }
          });
        }

      })
      .catch((err) => console.log(err))
    res.json({
      'ok': 'ok'
    })
  })

  app.get('/api/nextEventsToBet', function(req, res) {

    let query0 = Event.find({
      ftScore: {
        $eq: null
      }
    }).distinct('homeTeam')
    let promise0 = query0.exec()
    promise0.then(teams => {

      let promises = teams.map(team => {
        let query = Event.find({
          $and: [{
            ftScore: {
              $ne: null
            }
          }, {
            $or: [{
              homeTeam: team
            }, {
              awayTeam: team
            }]
          }]

        }).sort({
          date: 'desc'
        })
        var promise = query.exec();

        return promise.then(finishedMatches => {

          // HALF TIME 0-0
          let isHTWoGoalList = finishedMatches.map(event => event.halfTimeWoGoal)
          let maxNoWoGoalAtHTIteration = 0
          cpt = 0
          for (var item of isHTWoGoalList) {
            if (item) {
              cpt++
            } else {
              cpt = 0
            }
            if (cpt > maxNoWoGoalAtHTIteration) {
              maxNoWoGoalAtHTIteration = cpt
            }
          }

          let mustBetGoalAtHT = true
          i = 0
          while (i < maxNoWoGoalAtHTIteration && mustBetGoalAtHT) {
            if (!finishedMatches[i].halfTimeWoGoal) {
              mustBetGoalAtHT = false;
            }
            i++;
          }

          if (finishedMatches.length > 20 && mustBetGoalAtHT) {
            // if (finishedMatches.length > 20 && finishedMatches[0].country == 'USA') {
            let query2 = Event.find({
              $and: [{
                ftScore: {
                  $eq: null
                }
              }, {
                $or: [{
                  homeTeam: team
                }, {
                  awayTeam: team
                }]
              }]

            }).sort({
              date: 'asc'
            })
            let promise2 = query2.exec()
            return promise2.then(nonFinishedMatches => {
              if (nonFinishedMatches.length > 0) {

                let event = {}
                event.country = nonFinishedMatches[0].country
                event.league = nonFinishedMatches[0].league
                event.team = team
                event.nbFinishedMatches = finishedMatches.length
                event.maxNoWoGoalAtHTIteration = maxNoWoGoalAtHTIteration
                event.nextMatch = {
                  homeTeam: nonFinishedMatches[0].homeTeam,
                  awayTeam: nonFinishedMatches[0].awayTeam,
                  date: nonFinishedMatches[0].date,
                  dateString: nonFinishedMatches[0].dateString
                }
                console.log('===========================')
                console.log('Country: ' + nonFinishedMatches[0].country)
                console.log('League: ' + nonFinishedMatches[0].league)
                console.log('Team: ' + team)

                console.log('Nb finished Matches: ' + finishedMatches.length)
                console.log('maxNoWoGoalAtHTIteration: ' + maxNoWoGoalAtHTIteration)
                console.log('next Match: ' + nonFinishedMatches[0].homeTeam + ' VS ' + nonFinishedMatches[0].awayTeam)
                console.log('next Match date: ' + nonFinishedMatches[0].date)
                console.log('next Match date string: ' + nonFinishedMatches[0].dateString)
                return event
              } else {
                return {}
              }
            })
          } else {
            return {}
          }
        })
      })

      Promise.all(promises)
        .then(function(allNextEventsToBet) {

          let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);
          res.json(allNextFilteredSortedEventsToBet)
        })

      // return {'titi' : 'tototo'}

    })

    // })
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

  let olderFirst = (a, b) => (a.nextMatch.date > b.nextMatch.date) ? 1 : ((b.nextMatch.date > a.nextMatch.date) ? -1 : 0)
};
