const util = require('util')
const bet = require('./bet')
const events = require('./events')
const winamax = require('./winamax')
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
//URL de notre base
const urlmongo = "mongodb+srv://admin:zZ01X0J95wewjfWL@cluster0-cfjcc.mongodb.net/bet-app2?retryWrites=true&w=majority";

module.exports = function (app) {

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

  db.once('open', function () {
    console.log("Connection Successful!");
  })

  // define Schema
  var EventSchema = mongoose.Schema({
    _id: String,
    country: String,
    league: String,
    season: String,
    round: String,
    nbOfRounds: Number,
    date: Date,
    status: String,
    homeTeam: String,
    awayTeam: String,
    halfTime1Score: String,
    halfTime1HomeScore: Number,
    halfTime1AwayScore: Number,
    halfTime1Goals: Number,
    halfTime1Draw: Boolean,
    halfTime1NoGoal: Boolean,
    halfTime2HomeScore: Number,
    halfTime2AwayScore: Number,
    halfTime2Goals: Number,
    halfTime2Draw: Boolean,
    halfTime2NoGoal: Boolean,
    fullTimeScore: String,
    fullTimeHomeScore: Number,
    fullTimeAwayScore: Number,
    fullTimeGoals: Number,
    fullTimeDraw: Boolean,
    fullTimeNoGoal: Boolean,
    secondHalfBetter: Boolean,
    twoOrThreeGoals: Boolean
  }, {
      _id: false
    })

  var BetSchema = mongoose.Schema({
    _id: String,
    date: Date,
    betTeam: String,
    status: String,
    idEvent: String,
    method: String,
    level: Number
  }, {
      _id: false
    })

  var WinamaxBetSchema = mongoose.Schema({
    _id: String,
    type: String,
    status: String,
    betTime: Date,
    betResultTime: Date,
    mise: Number,
    odds: Number,
    result: Number,
    betTechnique: String,
    events: [{
      sport: String,
      eventName: String,
      eventResult: String,
      eventTime: Date,
      eventHome: String,
      eventAway: String,
      betDesc: String,
      betTechnque: String,
      betOdds: Number
    }]
  }, {
      _id: false
    })

  // compile schema to model
  var Event = mongoose.model('Event', EventSchema, 'events')
  var Bet = mongoose.model('Bet', BetSchema, 'bets')
  var WinamaxBet = mongoose.model('WinamaxBet', WinamaxBetSchema, 'winamaxBets')

  // let updateEventsInDatabase = function(events) {
  //   let p = Promise.resolve(); // Q() in q
  //
  //   events.forEach(event =>
  //     p = p.then(() => {
  //       return Event.findByIdAndUpdate(event['_id'], event, {
  //         upsert: true
  //       }, function(err, docs) {
  //         if (err) {
  //           return console.error(err);
  //         } else {
  //           console.log('Document (' + event['_id'] + ') inserted/updated to Collection');
  //         }
  //       })
  //     })
  //   )
  //   return p
  // }

  var updateEvent = function (ev) {
    Event.findByIdAndUpdate(ev['_id'], ev, {
      upsert: true
    }, function (err, docs) {
      if (err) {
        return console.error(err);
      } else {
        // console.log('Document (' + ev['_id'] + ') inserted/updated to Collection');
      }
    })
  }
  var updateEventsInDatabase = function (events) {
    var p = Promise.resolve(); // Q() in q

    events.forEach(ev => { return p = p.then(() => updateEvent(ev)) })
    return p
  };

  app.get('/api/refreshLeagueDatabase', function (req, res) {
    let country = req.query.country
    let league = req.query.league
    return events.getAllLastEventsByCountryAndLeague(req.query.country, req.query.league)
      .then((result) => {
        // save multiple documents to the collection referenced by Book Model

        updateEventsInDatabase(result)

        res.json({
          message: country + ' ' + league + ' updated!'
        })

      })
      .catch((err) => console.log(err))

  })

  app.get('/api/addBet', function (req, res) {
    let bet = JSON.parse(req.query.bet)

    Bet.findByIdAndUpdate(bet['_id'], bet, {
      upsert: true
    }, function (err, docs) {
      if (err) {
        return console.error(err);
      } else {
        console.log('Bet (' + bet['_id'] + ') inserted to Collection');
        res.json({
          'ok': 'ok'
        })
      }
    });

  })

  app.get('/api/finishedBets', function (req, res) {
    let queryToExtractFinishedBets = Bet.find({
      $and: [{
        betTeam: {
          $eq: req.query.betTeam
        }
      }, {
        method: {
          $eq: req.query.methodName
        }
      }, {
        $or: [{
          status: 'WON'
        }, {
          status: 'LOST'
        }]
      }]

    }).sort({
      date: 'desc'
    })
    let promiseQueryToExtractFinishedBets = queryToExtractFinishedBets.exec()
    promiseQueryToExtractFinishedBets.then(finishedBets => {
      res.json(finishedBets)
    })
  })

  app.get('/api/methodWinamaxBets', function (req, res) {
    console.log('/api/methodWinamaxBets')
    let queryToExtractMethodWinamaxBets = WinamaxBet.find({
      betTechnique: {
        $ne: ''
      }
    })
    let promiseQueryToExtractMethodWinamaxBets = queryToExtractMethodWinamaxBets.exec()
    promiseQueryToExtractMethodWinamaxBets.then(methodWinamaxBets => {
      console.log('methodWinamaxBets')
      console.log(methodWinamaxBets)
      res.json(methodWinamaxBets)
    })
  })

  app.get('/api/alreadyBet', function (req, res) {
    let betId = req.query.id
    let queryToExtractAlreadyBet = Bet.findOne({

      _id: {
        $eq: betId
      }
    })
    let promiseQueryToExtractAlreadyBet = queryToExtractAlreadyBet.exec()
    promiseQueryToExtractAlreadyBet.then(alreadyBet => {
      if (alreadyBet !== null && alreadyBet !== undefined) {
        return res.json({
          found: true
        })
      } else {
        return res.json({
          found: false
        })
      }
    }).catch((err) => res.json({
      found: false
    }))

  })

  app.get('/api/refreshWinamaxBets', function (req, res) {
    winamax.getAllWinamaxBets()
      .then((winamaxBets) => {

        let promisesWinamaxBets = winamaxBets.map(winamaxBet => {


          WinamaxBet.findByIdAndUpdate(winamaxBet['_id'], winamaxBet, {
            upsert: true
          }, function (err, docs) {
            if (err) {
              return console.error(err);
            } else {
              console.log('Winamax bet (' + winamaxBet['_id'] + ') inserted to Collection');

            }
          });


        })

        Promise.all(promisesWinamaxBets)
          .then(function (allNextEventsToBet) {

            res.status(200).send('all winamax updated in database!');
          })


      });

  })

  app.get('/api/refreshBets', function (req, res) {


    let queryToExtractWaitingBets = Bet.find({
      status: {
        $eq: 'WAIT'
      }
    })
    let promiseQueryToExtractWaitingBets = queryToExtractWaitingBets.exec()
    return promiseQueryToExtractWaitingBets.then(waitingBets => {


      let promisesWaitingBets = waitingBets.map(waitingBet => {
        let idEvent = waitingBet.idEvent
        let method = waitingBet.method

        let queryToExtractAssociatedEvent = Event.findOne({
          _id: {
            $eq: idEvent
          }
        })
        let promiseQueryToExtractAssociatedEvent = queryToExtractAssociatedEvent.exec()
        return promiseQueryToExtractAssociatedEvent.then(event => {
          let status = event.status
          if (status == 'FIN') {
            let newBetStatus = 'LOST'
            if (method == 'secondHalfBetter' && event.secondHalfBetter) {
              newBetStatus = 'WON'
            }
            if (method == 'moreThan1_5Goal' && event.fullTimeGoals >= 2) {
              newBetStatus = 'WON'
            }
            if (method == 'goalAtHalfTime' && event.halfTime1Goals > 0) {
              newBetStatus = 'WON'
            }
            if (method == 'twoOrThreeGoals' && event.twoOrThreeGoals) {
              newBetStatus = 'WON'
            }
            waitingBet.status = newBetStatus
            return Bet.findByIdAndUpdate(waitingBet['_id'], waitingBet, {
              upsert: true
            }, function (err, docs) {
              if (err) {
                return console.error(err);
              } else {
                console.log('Bet (' + waitingBet['_id'] + ') updated to Collection');
                res.json({
                  'ok': 'ok'
                })
              }
            });



          } else {
            return {
              'ok': 'ok'
            }
          }
        })


      })

      Promise.all(promisesWaitingBets)
        .then(function (allNextEventsToBet) {

          res.json({
            'ok': 'ok'
          })
        })


    })

  })

  app.get('/api/addLevelInBets', function (req, res) {


    let queryToExtractAllBets = Bet.find()
    let promiseQueryToExtractAllBets = queryToExtractAllBets.exec()
    return promiseQueryToExtractAllBets.then(allBets => {

      let promisesAllBets = allBets.map(bet => {
        let id = bet._id
        let methodName = bet.method
        let date = bet.date
        let betTeam = bet.betTeam
        let status = bet.status
        let level = 0

        let queryToExtractFinishedBets = Bet.find({
          $and: [{
            betTeam: {
              $eq: betTeam
            }
          }, {
            date: {
              $lt: date
            }
          }, {
            method: {
              $eq: methodName
            }
          }, {
            $or: [{
              status: 'WON'
            }, {
              status: 'LOST'
            }]
          }]

        }).sort({
          date: 'desc'
        })
        let promiseQueryToExtractFinishedBets = queryToExtractFinishedBets.exec()
        promiseQueryToExtractFinishedBets.then(finishedBets => {

          if (finishedBets.length > 0) {

            // console.log('finishedBets: ', finishedBets)
            let lostList = finishedBets.map(bet => bet.status == 'LOST')
            // console.log('lostList: ', lostList)
            let i = 0
            while (lostList[i] && i < lostList.length) {
              i++
              level++
            }
          }
          console.log('id: ', id)
          console.log('status: ', status)
          console.log('level: ', level)
          bet.level = level
          return Bet.findByIdAndUpdate(bet['_id'], bet, {
            upsert: true
          }, function (err, docs) {
            if (err) {
              return console.error(err);
            } else {
              console.log('Bet (' + bet['_id'] + ') updated to Collection with level ' + bet.level);

            }
          });
        })
          .catch(function (data) {
            console.log('Error: ');
            console.log(data);

          });


      })

      Promise.all(promisesAllBets)
        .then(function (bet) {

          res.json({
            'ok': 'ok'
          })
        })
    })

  })

  app.get('/api/refreshDatabase', function (req, res) {

    events.getAllLastSeasonEvents()
      // events.getAllEvents()
      // events.getAllEventsByCountryAndLeague('USA', 'MAJOR LEAGUE SOCCER')
      .then((result) => {
        // save multiple documents to the collection referenced by Book Model
        for (var event of result) {
          Event.findByIdAndUpdate(event['_id'], event, {
            upsert: true
          }, function (err, docs) {
            if (err) {
              return console.error(err);
            } else {
              console.log('Document (' + event['_id'] + ') inserted/updated to Collection');
            }
          });
        }

      })
      .catch((err) => console.log(err))
    res.json({
      'ok': 'ok'
    })
  })

  app.get('/api/leagues', function (req, res) {
    res.json(events.leagues)
  })

  app.get('/api/refreshAllDatabase', function (req, res) {

    // events.getAllLastSeasonEvents()
    events.getAllEvents()
      // events.getAllEventsByCountryAndLeague('USA', 'MAJOR LEAGUE SOCCER')
      .then((result) => {
        // save multiple documents to the collection referenced by Book Model
        for (var event of result) {
          if (event !== undefined) {
            Event.findByIdAndUpdate(event['_id'], event, {
              upsert: true
            }, function (err, docs) {
              if (err) {
                return console.error(err);
              } else {
                console.log('Document (' + event['_id'] + ') inserted/updated to Collection');
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

  app.get('/api/nextEvent', function (req, res) {
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
  })

  app.get('/api/finishedMatches', function (req, res) {
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
  })

  app.get('/api/teams', function (req, res) {
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
  })

  app.get('/api/nextEventsToBet', function (req, res) {


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
        .then(function (allNextEventsToBet) {

          let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);
          res.json(allNextFilteredSortedEventsToBet)
        })

    })

  })

  app.get('/api/lastSeasonMatches', function (req, res) {
    let queryToExtractLastFinishedMatches = Event.find({
      $and: [{
        status: {
          $eq: 'FIN'
        }
      }, {
        $and: [{
          country: req.query.country
        }, {
          league: req.query.league
        }]
      }]

    }, {
        _id: 1,
        date: 1,
        homeTeam: 1,
        awayTeam: 1,
        country: 1,
        league: 1
      })
      .
      limit(25).sort({
        date: 'desc'
      })
    let promiseQueryToExtractLastFinishedMatches = queryToExtractLastFinishedMatches.exec()
    promiseQueryToExtractLastFinishedMatches.then(finishedMatches => {
      res.json(finishedMatches)
    })
  });

  // Event.deleteMany({ country: 'LUXEMBOURG' }, function (err) { });

  // application -------------------------------------------------------------
  app.get('*', function (req, res) {
    res.sendfile('./index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });

  let olderFirst = (a, b) => (a.nextMatch.date > b.nextMatch.date) ? 1 : ((b.nextMatch.date > a.nextMatch.date) ? -1 : 0)
};
