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
    useNewUrlParser: true,
    autoIndex: false
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
    round: Number,
    nbOfRounds: Number,
    dateString: String,
    date: Number,
    status: String,
    homeTeam: String,
    awayTeam: String,
    htScore: String,
    homeHt1Score: Number,
    awayHt1Score: Number,
    halfTime1Goals: Number,
    halfTime1Draw: Boolean,
    halfTime1NoGoal: Boolean,
    homeHt2Score: Number,
    awayHt2Score: Number,
    halfTime2Goals: Number,
    halfTime2Draw: Boolean,
    halfTime2NoGoal: Boolean,
    ftScore: String,
    homeFtScore: Number,
    awayFtScore: Number,
    fullTimeGoals: Number,
    fullTimeDraw: Boolean,
    fullTimeNoGoal: Boolean,
    secondHalfBetter: Boolean,
    twoOrThreeGoals: Boolean
  }, {
    _id: false
  });

  EventSchema.index({
    homeTeam: 1,
    awayTeam: 1,
    date: 1,
    status: 1
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
          if (event !== undefined) {
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
        }

      })
      .catch((err) => console.log(err))
    res.json({
      'ok': 'ok'
    })
  })


  app.get('/api/nextEvent', function(req, res) {
    let queryToExtractNextEvent = Event.findOne({
      $and: [{
        status: {
          $eq: 'SCH'
        }
      }, {
        $or: [{
          homeTeam: req.query.team
        }, {
          awayTeam: req.query.team
        }]
      }]

    }).sort({
      date: 'asc'
    })
    let promiseQueryToExtractNextEvent = queryToExtractNextEvent.exec()
    return promiseQueryToExtractNextEvent.then(firstNonFinishedMatch => {
      res.json(firstNonFinishedMatch)
    })
  });

  app.get('/api/finishedMatches', function(req, res) {
    let queryToExtractTeams = Event.find({
      $and: [{
        status: {
          $eq: 'FIN'
        }
      }, {
        $or: [{
          homeTeam: req.query.team
        }, {
          awayTeam: req.query.team
        }]
      }]

    }, {
      date: 1,
      secondHalfBetter: 1,
      fullTimeGoals: 1,
      twoOrThreeGoals: 1,
      halfTime1NoGoal: 1
    }).sort({
      date: 'desc'
    })
    let promiseQueryToExtractTeams = queryToExtractTeams.exec()
    promiseQueryToExtractTeams.then(teams => {
      res.json(teams)
    })
  });



  app.get('/api/teams', function(req, res) {
    let queryToExtractTeams = Event.find({
      status: {
        $eq: 'SCH'
      }
    }, {
      homeTeam: 1
    }).distinct('homeTeam')
    let promiseQueryToExtractTeams = queryToExtractTeams.exec()
    promiseQueryToExtractTeams.then(teams => {
      res.json(teams)
    })
  });

  app.get('/api/nextEventsToBet', function(req, res) {


    // let teams = Event.collection.distinct('homeTeam')

    let queryToExtractTeams = Event.find({
      status: {
        $eq: 'SCH'
      }
    }, {
      homeTeam: 1
    }).distinct('homeTeam')
    let promiseQueryToExtractTeams = queryToExtractTeams.exec()
    promiseQueryToExtractTeams.then(teams => {
      // Event.collection.distinct('homeTeam').then(teams => {

      let promisesToAllTeams = teams.map(team => {
        let queryToExtractAllFinishedMatches = Event.find({
          $and: [{
            status: {
              $eq: 'FIN'
            }
          }, {
            $or: [{
              homeTeam: team
            }, {
              awayTeam: team
            }]
          }]

        }, {
          date: 1,
          secondHalfBetter: 1,
          fullTimeGoals: 1,
          twoOrThreeGoals: 1,
          halfTime1NoGoal: 1
        }).sort({
          date: 'desc'
        })
        var promiseQueryToExtractAllFinishedMatches = queryToExtractAllFinishedMatches.exec();

        return promiseQueryToExtractAllFinishedMatches.then(finishedMatches => {
          let method = req.query.method

          if (method == '2nd_Half_better') {
            // 2nd half better
            let isNoMoreThan1_5GoalList = finishedMatches.map(event => !event.secondHalfBetter)

            let maxIteration = 0
            if (isNoMoreThan1_5GoalList.length > 0) {

              var str = isNoMoreThan1_5GoalList.map(bool => Number(bool)).join('').match(/1+/g);

              if (str !== null) {
                let proc = Math.max(...(str.map(el => el.length)))
                maxIteration = proc
              }
            }

            maxIteration = maxIteration
            let mustBet = true
            i = 0
            while (i < maxIteration && mustBet) {
              if (finishedMatches[i].secondHalfBetter) {
                mustBet = false;
              }
              i++;
            }

            if (finishedMatches.length > 20 && mustBet) {
              let queryToExtractNextEvent = Event.findOne({
                $and: [{
                  status: {
                    $eq: 'SCH'
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
              let promiseQueryToExtractNextEvent = queryToExtractNextEvent.exec()
              return promiseQueryToExtractNextEvent.then(firstNonFinishedMatch => {

                let event = {}
                event.country = firstNonFinishedMatch.country
                event.league = firstNonFinishedMatch.league
                event.team = team
                event.nbFinishedMatches = finishedMatches.length
                event.maxIteration = maxIteration
                event.method = method
                event.round = firstNonFinishedMatch.round
                event.nbOfRounds = firstNonFinishedMatch.nbOfRounds
                event.nextMatch = {
                  homeTeam: firstNonFinishedMatch.homeTeam,
                  awayTeam: firstNonFinishedMatch.awayTeam,
                  date: firstNonFinishedMatch.date,
                  dateString: firstNonFinishedMatch.dateString
                }
                return event

              }).catch(err => {
                return {}
              })

            } else {
              return {}
            }
          }
          if (method == 'more_than_1_5_goal') {
            // more than 1.5 goal
            let isNoMoreThan1_5GoalList = finishedMatches.map(event => event.fullTimeGoals < 2)

            let maxIteration = 0
            if (isNoMoreThan1_5GoalList.length > 0) {

              var str = isNoMoreThan1_5GoalList.map(bool => Number(bool)).join('').match(/1+/g);

              if (str !== null) {
                let proc = Math.max(...(str.map(el => el.length)))
                maxIteration = proc
              }
            }

            maxIteration = maxIteration
            let mustBet = true
            i = 0
            while (i < maxIteration && mustBet) {
              if (finishedMatches[i].fullTimeGoals > 1) {
                mustBet = false;
              }
              i++;
            }

            if (finishedMatches.length > 20 && mustBet) {
              let queryToExtractNextEvent = Event.findOne({
                $and: [{
                  status: {
                    $eq: 'SCH'
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
              let promiseQueryToExtractNextEvent = queryToExtractNextEvent.exec()
              return promiseQueryToExtractNextEvent.then(firstNonFinishedMatch => {

                let event = {}
                event.country = firstNonFinishedMatch.country
                event.league = firstNonFinishedMatch.league
                event.team = team
                event.nbFinishedMatches = finishedMatches.length
                event.maxIteration = maxIteration
                event.method = method
                event.round = firstNonFinishedMatch.round
                event.nbOfRounds = firstNonFinishedMatch.nbOfRounds
                event.nextMatch = {
                  homeTeam: firstNonFinishedMatch.homeTeam,
                  awayTeam: firstNonFinishedMatch.awayTeam,
                  date: firstNonFinishedMatch.date,
                  dateString: firstNonFinishedMatch.dateString
                }
                return event

              }).catch(err => {
                return {}
              })

            } else {
              return {}
            }
          }
          if (method == 'two_or_three_goals') {
            // 2 or 3 goals
            let isNo2Or3GoalsList = finishedMatches.map(event => !event.twoOrThreeGoals)

            let maxIteration = 0
            if (isNo2Or3GoalsList.length > 0) {

              var str = isNo2Or3GoalsList.map(bool => Number(bool)).join('').match(/1+/g);

              if (str !== null) {
                let proc = Math.max(...(str.map(el => el.length)))
                maxIteration = proc
              }
            }

            maxIteration = maxIteration
            let mustBet = true
            i = 0
            while (i < maxIteration && mustBet) {
              // stop condition => what we are looking for
              if (finishedMatches[i].twoOrThreeGoals) {
                mustBet = false;
              }
              i++;
            }

            if (finishedMatches.length > 20 && mustBet) {
              let queryToExtractNextEvent = Event.findOne({
                $and: [{
                  status: {
                    $eq: 'SCH'
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
              let promiseQueryToExtractNextEvent = queryToExtractNextEvent.exec()
              return promiseQueryToExtractNextEvent.then(firstNonFinishedMatch => {

                let event = {}
                event.country = firstNonFinishedMatch.country
                event.league = firstNonFinishedMatch.league
                event.team = team
                event.nbFinishedMatches = finishedMatches.length
                event.maxIteration = maxIteration
                event.method = method
                event.round = firstNonFinishedMatch.round
                event.nbOfRounds = firstNonFinishedMatch.nbOfRounds
                event.nextMatch = {
                  homeTeam: firstNonFinishedMatch.homeTeam,
                  awayTeam: firstNonFinishedMatch.awayTeam,
                  date: firstNonFinishedMatch.date,
                  dateString: firstNonFinishedMatch.dateString
                }
                return event

              }).catch(err => {
                return {}
              })

            } else {
              return {}
            }
          }
          if (method == 'goal_At_Half_Time') {
            // +0.5 goal at HT
            let isHTWoGoalList = finishedMatches.map(event => event.halfTime1NoGoal)

            let maxIteration = 0
            if (isHTWoGoalList.length > 0) {

              var str = isHTWoGoalList.map(bool => Number(bool)).join('').match(/1+/g);

              if (str !== null) {
                let proc = Math.max(...(str.map(el => el.length)))
                maxIteration = proc
              }
            }


            let mustBet = true
            i = 0
            while (i < maxIteration && mustBet) {
              if (!finishedMatches[i].halfTime1NoGoal) {
                mustBet = false;
              }
              i++;
            }

            if (finishedMatches.length > 20 && mustBet) {
              let queryToExtractNextEvent = Event.findOne({
                $and: [{
                  status: {
                    $eq: 'SCH'
                  }
                }, {
                  $or: [{
                    homeTeam: team
                  }, {
                    awayTeam: team
                  }]
                }]

              }, {
                date: 1,
                dateString: 1,
                country: 1,
                league: 1,
                round: 1,
                nbOfRounds: 1,
                homeTeam: 1,
                awayTeam: 1
              }).sort({
                date: 'asc'
              })
              let promiseQueryToExtractNextEvent = queryToExtractNextEvent.exec()
              return promiseQueryToExtractNextEvent.then(firstNonFinishedMatch => {

                let event = {}
                event.country = firstNonFinishedMatch.country
                event.league = firstNonFinishedMatch.league
                event.team = team
                event.nbFinishedMatches = finishedMatches.length
                event.maxIteration = maxIteration
                event.method = method
                event.round = firstNonFinishedMatch.round
                event.nbOfRounds = firstNonFinishedMatch.nbOfRounds
                event.nextMatch = {
                  homeTeam: firstNonFinishedMatch.homeTeam,
                  awayTeam: firstNonFinishedMatch.awayTeam,
                  date: firstNonFinishedMatch.date,
                  dateString: firstNonFinishedMatch.dateString
                }
                return event

              }).catch(err => {
                return {}
              })

            } else {
              return {}
            }
          }
        })
      })

      Promise.all(promisesToAllTeams)
        .then(function(allNextEventsToBet) {

          let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);
          res.json(allNextFilteredSortedEventsToBet)
        })

    })

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
