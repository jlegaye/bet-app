'use strict';

angular.module('myApp.view1', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/view1', {
      templateUrl: 'view1/view1.html',
      controller: 'View1Ctrl'
    });
  }])

  .controller('View1Ctrl', ['$scope', '$http', '$q', function ($scope, $http, $q) {

    let uniqEs6 = (arrArg) => {
      return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
      });
    }

    var ctrl = $scope;


    ctrl.nextEventsToBet = []
    ctrl.isLoading = false
    ctrl.isRefreshLoading = false

    let mustBetCriteria = function (finishedMatches, criteria, methodName) {
      if (finishedMatches.length < 20) {
        return {
          mustBet: false
        }
      } else {
        let fieldToBetList = finishedMatches.map(event => !criteria(event))

        let maxIteration = 0
        if (fieldToBetList.length > 0) {

          var str = fieldToBetList.map(bool => Number(bool)).join('').match(/1+/g);

          if (str !== null) {
            let proc = Math.max(...(str.map(el => el.length)))
            maxIteration = proc
          }
        }

        let mustBet = true
        let i = 0
        while (i < maxIteration && mustBet) {
          if (criteria(finishedMatches[i])) {
            mustBet = false;
          }
          i++;
        }
        return {
          methodName: methodName,
          iteration: maxIteration,
          mustBet: mustBet
        }
      }

    }

    let secondHalfBetter = event => event.secondHalfBetter
    let twoOrThreeGoals = event => event.twoOrThreeGoals
    let moreThan1_5Goal = event => event.fullTimeGoals >= 2
    let goalAtHalfTime = event => !event.halfTime1NoGoal

    let allProgress = (proms, progress_cb) => {
      let d = 0;
      progress_cb(0);
      for (const p of proms) {
        p.then(() => {
          d++;
          progress_cb((d * 100) / proms.length);
        });
      }
      return Promise.all(proms);
    }


    ctrl.getNextEventsToBet = function () {
      ctrl.isLoading = true

      $http.get('/api/teams')
        .then(response => {

          let teams = response.data
          console.log('teams.length: ' + teams.length)
          let promisesToAllTeams = teams.map(team => {

            return $http.get('/api/finishedMatches', {

              params: {
                team: team
              }
            })
              .then(response => {
                let finishedMatches = response.data
                // console.log('finishedMatches.length: ' + finishedMatches.length)

                let mustBetObj = [
                  mustBetCriteria(finishedMatches, secondHalfBetter, 'secondHalfBetter'),
                  mustBetCriteria(finishedMatches, twoOrThreeGoals, 'twoOrThreeGoals'),
                  mustBetCriteria(finishedMatches, moreThan1_5Goal, 'moreThan1_5Goal'),
                  mustBetCriteria(finishedMatches, goalAtHalfTime, 'goalAtHalfTime')

                ]
                // console.log('mustBet: ' + mustBet)
                if (mustBetObj.map(obj => obj.mustBet).includes(true)) {
                  mustBetObj = mustBetObj.filter(o => o.mustBet)
                  let betTeam = team

                  let methodsLevelspromises = mustBetObj.map(meth => {
                    let methodName = meth.methodName
                    return ctrl.getLevel(betTeam, methodName)

                  })

                  return Promise.all(methodsLevelspromises)
                    .then(methodsLevels => {
                      // console.log('methodsLevels: ', methodsLevels)
                      for (let met of methodsLevels) {
                        mustBetObj.filter(m => m.methodName == met.methodName).map(m => m.level = met.level)
                      }
                      // console.log('mustBetObj: ', mustBetObj)


                      return $http.get('/api/nextEvent', {
                        params: {
                          team: team
                        }
                      })
                        .then(response => {
                          let nextEvent = response.data


                          let methodsAlreadyBetspromises = mustBetObj.map(meth => {
                            let methodName = meth.methodName
                            return ctrl.isEventAlreadyBet(nextEvent._id, team, methodName)

                          })

                          return Promise.all(methodsAlreadyBetspromises)
                            .then(methodsFound => {
                              // console.log('methodsFound: ', methodsFound)
                              for (let met of methodsFound) {
                                mustBetObj.filter(m => m.methodName == met.methodName).map(m => m.alreadyBet = met.alreadyBet)
                              }
                              // console.log('mustBetObj: ', mustBetObj)
                              let event = {}
                              event._id = nextEvent._id
                              event.date = nextEvent.date
                              event.country = nextEvent.country
                              event.league = nextEvent.league
                              event.team = team
                              event.nbFinishedMatches = finishedMatches.length
                              event.mustBetObj = mustBetObj.filter(o => o.mustBet)
                              // event.maxIteration = mustBet[1]
                              // event.method = '2nd_Half_better'
                              event.round = nextEvent.round
                              event.nbOfRounds = nextEvent.nbOfRounds
                              event.nextMatch = {
                                homeTeam: nextEvent.homeTeam,
                                awayTeam: nextEvent.awayTeam,
                                date: nextEvent.date,
                              }
                              return event
                            })


                        })

                    })




                } else {
                  return {}
                }

              })
              .catch(data => {
                ctrl.isLoading = false
                console.log('Error during getting finished Matches: ' + data);
              })
          })
          allProgress(promisesToAllTeams,
            (p) => {
              // console.log(`% Done = ${p.toFixed(2)}`);
              ctrl.progress = p.toFixed(2)
              // console.log(`% Done = ${p.toFixed(2)}`);
            })
          Promise.all(promisesToAllTeams)
            .then(allNextEventsToBet => {

              // console.log('after promise all')
              let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);

              // console.log(allNextFilteredSortedEventsToBet)
              $scope.$apply(function () {
                ctrl.isLoading = false
                ctrl.nextEventsToBet = allNextFilteredSortedEventsToBet
              });


            })
        })
        .catch(data => {
          ctrl.isLoading = false
          console.log('Error during getting teams: ' + data);
        })


    }

    let olderFirst = (a, b) => (a.nextMatch.date > b.nextMatch.date) ? 1 : ((b.nextMatch.date > a.nextMatch.date) ? -1 : 0)

    ctrl.moreThan1_5GoalFilter = true
    ctrl.secondHalfBetterFilter = true
    ctrl.goalAtHalfTimeFilter = true
    ctrl.twoOrThreeGoalsFilter = true

    ctrl.dateGroupBy = false
    ctrl.leagueGroupBy = false

    ctrl.methodsToFilter = []
    ctrl.methodsFilter = function (event) {
      let methodList = event.mustBetObj.filter(met => met.mustBet).map(met => met.methodName)
      let moreThan1_5GoalTest = ctrl.moreThan1_5GoalFilter && methodList.includes('moreThan1_5Goal')
      let secondHalfBetterTest = ctrl.secondHalfBetterFilter && methodList.includes('secondHalfBetter')
      let goalAtHalfTimeFilterTest = ctrl.goalAtHalfTimeFilter && methodList.includes('goalAtHalfTime')
      let twoOrThreeGoalsTest = ctrl.twoOrThreeGoalsFilter && methodList.includes('twoOrThreeGoals')
      if (moreThan1_5GoalTest || secondHalfBetterTest || goalAtHalfTimeFilterTest || twoOrThreeGoalsTest) {
        return event
      } else {
        return
      }
    }

    ctrl.flatMap = function (events) {
      return [].concat.apply([], events)
    }

    ctrl.updateDateGroupByCheckBoxes = function () {
      if (ctrl.countryLeagueGroupBy) {
        ctrl.dateGroupBy = false
      }
    }

    ctrl.updateCountryGroupByCheckBoxes = function () {
      if (ctrl.dateGroupBy) {
        ctrl.countryLeagueGroupBy = false
      }
    }

    ctrl.toCountryAndLeague = function (event) {
      event.countryAndLeague = event.country + ' (' + event.league + ')'
      return event
    }

    ctrl.toDay = function (event) {
      let options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      event.nextMatch.day = new Date(event.nextMatch.date).toLocaleDateString('en', options)
      return event
    }

    ctrl.toMethodBets = function (event) {
      return event.mustBetObj
    }


    let allWithProgress = function (promises, progress) {
      var total = promises.length;
      var now = 0;
      promises.forEach(function (p) {
        p.then(function () {
          now++;
          progress(now / total);
        });
      })
      return $q.all(promises);
    }

    ctrl.progress = 0
    ctrl.refreshProgress = 0

    let refreshLastSeasonOfLeagueInDatabase = function (league, progress, finished, callback) {
      return $http.get('/api/refreshLeagueDatabase', {
        timeout: 1000000,
        params: {
          country: league.country,
          league: league.league
        }
      })
        .then(function (response) {
          console.log(response.data.message)
          callback(progress)

        })
        .catch(function (data) {
          console.log('Error: ');
          console.log(data);
          callback(progress)


        }).finally(() => {
          if (finished) {
            console.log('Refreshing bets!')
            $http.get('/api/refreshBets', {
              timeout: 1000000
            })
              .then(function (response) {
                ctrl.isRefreshLoading = false
                console.log('bets refreshed!')
              })

          }
        })
    }

    let refreshLastSeasonOfAllLeaguesInDatabase = function (leagues) {
      let p = Promise.resolve(); // Q() in q

      leagues.forEach((league, i) =>
        p = p.then(() => {
          let progress = (i + 1) * 100 / leagues.length
          let finished = (i + 1) == leagues.length
          return refreshLastSeasonOfLeagueInDatabase(league, progress, finished, (p) => {
            ctrl.refreshProgress = p.toFixed(2)
          })
        })
      )
      return p
    }

    ctrl.refreshDatabase = function () {
      ctrl.isRefreshLoading = true
      $http.get('/api/leagues', {
        timeout: 1000000
      })
        .then(function (response) {
          let leagues = response.data
          console.log('leagues: ', leagues)
          refreshLastSeasonOfAllLeaguesInDatabase(leagues)
        })
    }

    ctrl.refreshAllDatabase = function () {
      $http.get('/api/refreshAllDatabase', {
        timeout: 1000000
      })
        .then(function (response) {
          console.log(response)

        })
        .catch(function (data) {
          console.log('Error: ');
          console.log(data);
        });

    }

    ctrl.addBet = function (event, method) {
      let methodName = method.methodName
      let level = method.level
      console.log('add bet')
      let betId = event._id + '_' + event.team.replace(/ /g, '_') + '_' + methodName
      console.log('betId: ', betId)
      let bet = {
        _id: betId,
        date: event.date,
        betTeam: event.team,
        status: 'WAIT',
        idEvent: event._id,
        method: methodName,
        level: level
      }

      $http.get('/api/addBet', {
        timeout: 1000000,
        params: {
          bet: bet
        }
      })
        .then(function (response) {
          console.log('done')
          method.disabled = true
        })
    }

    ctrl.isEventAlreadyBet = function (eventId, betTeam, methodName) {
      // console.log('eventId: ', eventId)
      // console.log('methodName: ', methodName)
      let isAlreadyBet = false
      let betId = eventId + '_' + betTeam.replace(/ /g, '_') + '_' + methodName
      // console.log('betId: ', betId)

      return $http.get('/api/alreadyBet', {
        timeout: 1000000,
        params: {
          id: betId

        }
      })
        .then(function (response) {

          // console.log('response.data !!!!!!')
          // console.log(response.data)
          return {
            methodName: methodName,
            alreadyBet: response.data.found
          }
        })
        .catch(function (data) {
          console.log('Error: ');
          return {

          }

        });

    }

    ctrl.getLevel = function (betTeam, methodName) {
      // console.log('betTeam: ', betTeam)
      // console.log('methodName: ', methodName)
      let level = 0

      return $http.get('/api/finishedBets', {
        timeout: 1000000,
        params: {
          betTeam: betTeam,
          methodName: methodName
        }
      })
        .then(function (response) {
          // console.log('done')
          let finishedBets = response.data
          if (finishedBets.length > 0) {
            level = finishedBets[0].level + 1

          }

          return {
            methodName: methodName,
            level: level
          };
        })
        .catch(function (data) {
          console.log('Error: ');
          console.log(data);

        });

    }

    let generateStatsFromBetsList = function (filteredBets, methodName) {
      let nbOfBets = filteredBets.length
      let nbOfWonBets = filteredBets.filter(bet => bet.status == 'GAGNÉ').length
      let nbOfLostBets = filteredBets.filter(bet => bet.status == 'PERDU').length
      let nbOfCurrentBets = filteredBets.filter(bet => bet.status == 'EN COURS').length
      let wonPercentage = Math.floor((nbOfWonBets / nbOfBets) * 100)
      const miseArray = filteredBets.map(bet => bet.mise)
      const currentMiseArray = filteredBets.filter(bet => bet.status == 'EN COURS').map(bet => bet.mise)
      const oddsArray = filteredBets.map(bet => bet.odds)
      let averageMise = (miseArray.reduce((a, b) => a + b, 0) / miseArray.length).toFixed(2)
      let averageOdds = (oddsArray.reduce((a, b) => a + b, 0) / oddsArray.length).toFixed(2)
      let totalMise = (miseArray.reduce((prev, next) => prev + next)).toFixed(2)
      let currentMise = currentMiseArray.length == 0 ? 0 : (currentMiseArray.reduce((prev, next) => prev + next)).toFixed(2)
      let result = (filteredBets.map(bet => bet.result).reduce((prev, next) => prev + next)).toFixed(2)
      let roi = Math.floor((result / totalMise) * 100)
      return {
        methodName,
        nbOfBets,
        nbOfWonBets,
        nbOfLostBets,
        nbOfCurrentBets,
        currentMise,
        wonPercentage,
        averageOdds,
        averageMise,
        totalMise,
        roi,
        result,
      }
    }

    let generateStats = function (methodWinamaxBets, methodName) {
      let filteredBets = methodWinamaxBets.filter(bet => bet.betTechnique == methodName)
      return generateStatsFromBetsList(filteredBets, methodName)
    }

    ctrl.getWinamaxResults = function () {
      console.log('getWinamaxResults')
      return $http.get('/api/methodWinamaxBets', {
        timeout: 1000000
      })
        .then(function (response) {
          let methodWinamaxBets = response.data
          console.log('methodWinamaxBets: ', methodWinamaxBets)

          ctrl.stats = [
            generateStats(methodWinamaxBets, 'moreThan1_5Goal'),
            generateStats(methodWinamaxBets, 'goalAtHalfTime'),
            generateStats(methodWinamaxBets, 'secondHalfBetter'),
            generateStats(methodWinamaxBets, 'twoOrThreeGoals'),
            generateStatsFromBetsList(methodWinamaxBets, 'TOTAL'),
          ]

          console.log('ctrl.stats: ', ctrl.stats)

          // let moreThan1_5GoalBets = methodWinamaxBets.filter(bet => bet.betTechnique == 'moreThan1_5Goal')
          // let goalAtHalfTimeBets = methodWinamaxBets.filter(bet => bet.betTechnique == 'goalAtHalfTime')
          // let secondHalfBetterBets = methodWinamaxBets.filter(bet => bet.betTechnique == 'secondHalfBetter')
          // let twoOrThreeGoalsBets = methodWinamaxBets.filter(bet => bet.betTechnique == 'twoOrThreeGoals')


          // ctrl.moreThan1_5GoalBetsTotal = moreThan1_5GoalBets.length
          // ctrl.moreThan1_5GoalBetsWon = moreThan1_5GoalBets.filter(bet => bet.status == 'GAGNÉ').length
          // ctrl.moreThan1_5GoalBetsPercentage = Math.floor((ctrl.moreThan1_5GoalBetsWon / ctrl.moreThan1_5GoalBetsTotal) * 100)
          // ctrl.moreThan1_5GoalBetsResult = (moreThan1_5GoalBets.map(bet => bet.result).reduce((prev, next) => prev + next)).toFixed(2)

          // ctrl.goalAtHalfTimeBetsTotal = goalAtHalfTimeBets.length
          // ctrl.goalAtHalfTimeBetsWon = goalAtHalfTimeBets.filter(bet => bet.status == 'GAGNÉ').length
          // ctrl.goalAtHalfTimeBetsPercentage = Math.floor((ctrl.goalAtHalfTimeBetsWon / ctrl.goalAtHalfTimeBetsTotal) * 100)
          // ctrl.goalAtHalfTimeBetsResult = (goalAtHalfTimeBets.map(bet => bet.result).reduce((prev, next) => prev + next)).toFixed(2)

          // ctrl.secondHalfBetterBetsTotal = secondHalfBetterBets.length
          // ctrl.secondHalfBetterBetsWon = secondHalfBetterBets.filter(bet => bet.status == 'GAGNÉ').length
          // ctrl.secondHalfBetterBetsPercentage = Math.floor((ctrl.secondHalfBetterBetsWon / ctrl.secondHalfBetterBetsTotal) * 100)
          // ctrl.secondHalfBetterBetsResult = (secondHalfBetterBets.map(bet => bet.result).reduce((prev, next) => prev + next)).toFixed(2)

          // ctrl.twoOrThreeGoalsBetsTotal = twoOrThreeGoalsBets.length
          // ctrl.twoOrThreeGoalsBetsWon = twoOrThreeGoalsBets.filter(bet => bet.status == 'GAGNÉ').length
          // ctrl.twoOrThreeGoalsBetsPercentage = Math.floor((ctrl.twoOrThreeGoalsBetsWon / ctrl.twoOrThreeGoalsBetsTotal) * 100)
          // ctrl.twoOrThreeGoalsBetsResult = (twoOrThreeGoalsBets.map(bet => bet.result).reduce((prev, next) => prev + next)).toFixed(2)
          return { methodWinamaxBetsLength: methodWinamaxBets.length }
        })
        .catch(function (data) {
          console.log('Error: ');
          console.log(data);

        });
    }

  }]);
