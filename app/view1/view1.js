'use strict';

angular.module('myApp.view1', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view1', {
      templateUrl: 'view1/view1.html',
      controller: 'View1Ctrl'
    });
  }])

  .controller('View1Ctrl', ['$scope', '$http', '$q', function($scope, $http, $q) {

    let uniqEs6 = (arrArg) => {
      return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
      });
    }

    var ctrl = $scope;


    ctrl.nextEventsToBet = []
    ctrl.isLoading = false

    ctrl.getResults = function() {
      $http.get('/api/results', {
          timeout: 1000000,
          params: {
            country: ctrl.country,
            league: ctrl.league
          }
        })
        .then(function(response) {
          console.log('result')
          ctrl.isLoading = false
          ctrl.results = response.data
        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);
          ctrl.isLoading = false
        });

    }

    ctrl.getEvents = function() {
      $http.get('/events', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log('result')
          ctrl.events = response.data
        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);
        });

    }

    ctrl.getNextEventsToBetGoalAtHalfTime = function() {
      ctrl.isLoading = true
      $http.get('/api/nextEventsToBet', {
          timeout: 1000000,
          params: {
            method: 'goal_At_Half_Time'
          }
        })
        .then(function(response) {
          ctrl.isLoading = false
          ctrl.nextEventsToBet = response.data
        })
        .catch(function(data) {
          ctrl.isLoading = false
          console.log('Error: ');
          console.log(data);
        });

    }

    let mustBetCriteria = function(finishedMatches, criteria, methodName) {
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

    ctrl.getNextEventsToBet = function() {
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
                              console.log('methodsFound: ', methodsFound)
                              for (let met of methodsFound) {
                                mustBetObj.filter(m => m.methodName == met.methodName).map(m => m.alreadyBet = met.alreadyBet)
                              }
                              console.log('mustBetObj: ', mustBetObj)
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
          Promise.all(promisesToAllTeams)
            .then(allNextEventsToBet => {

              console.log('after promise all')
              let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);

              console.log(allNextFilteredSortedEventsToBet)
              $scope.$apply(function() {
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
    ctrl.methodsFilter = function(event) {
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

    ctrl.updateDateGroupByCheckBoxes = function() {
      if (ctrl.countryLeagueGroupBy) {
        ctrl.dateGroupBy = false
      }
    }

    ctrl.updateCountryGroupByCheckBoxes = function() {
      if (ctrl.dateGroupBy) {
        ctrl.countryLeagueGroupBy = false
      }
    }

    ctrl.toCountryAndLeague = function(event) {
      event.countryAndLeague = event.country + ' (' + event.league + ')'
      return event
    }

    ctrl.toDay = function(event) {
      let options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      event.nextMatch.day = new Date(event.nextMatch.date).toLocaleDateString('en', options)
      return event
    }


    ctrl.refreshDatabase = function() {
      $http.get('/api/refreshDatabase', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log(response)
          console.log('last Results refreshed')
          $http.get('/api/refreshBets', {
              timeout: 1000000
            })
            .then(function(response) {
              console.log('bet refreshed')
            })

        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);
        });

    }

    function allWithProgress(promises, progress) {
      var total = promises.length;
      var now = 0;
      promises.forEach(function(p) {
        p.then(function() {
          now++;
          progress(now / total);
        });
      })
      return $q.all(promises);
    }

    ctrl.progress = 0

    /*  ctrl.refreshDatabaseNew = function() {
        $http.get('/api/leagues', {
            timeout: 1000000
          })
          .then(function(response) {
            let leagues = response.data

            leagues.reduce((promise, nextLeague) => {
              return promise
                .then((result) => {
                  return $http.get('/api/refreshLeagueDatabase', {
                      timeout: 1000000,
                      params: {
                        country: nextLeague.team,
                        league: nextLeague.team
                      }
                    })
                    .then(function(response) {
                      console.log(response)

                    })
                    .catch(function(data) {
                      console.log('Error: ');
                      console.log(data);
                    });
                })
                .catch(console.error);
            }, Promise.resolve())

          })
      }*/


    ctrl.refreshAllDatabase = function() {
      $http.get('/api/refreshAllDatabase', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log(response)

        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);
        });

    }

    ctrl.createEvent = function() {
      let data = {
        'home': 'test1',
        'away': 'test2'
      }
      $http.post('/event', data)
        .then(function(response) {
          console.log('result')
          ctrl.events = response.data
        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);
        });

    }

    ctrl.addBet = function(event, methodName) {
      console.log('add bet')
      console.log('event: ', event)
      let betId = event._id + '_' + event.team.replace(/ /g, '_') + '_' + methodName
      console.log('betId: ', betId)
      let bet = {
        _id: betId,
        date: event.date,
        betTeam: event.team,
        status: 'WAIT',
        idEvent: event._id,
        method: methodName
      }

      console.log('bet: ', bet)

      $http.get('/api/addBet', {
          timeout: 1000000,
          params: {
            bet: bet
          }
        })
        .then(function(response) {
          console.log('done')
        })
    }

    ctrl.isEventAlreadyBet = function(eventId, betTeam, methodName) {
      console.log('eventId: ', eventId)
      console.log('methodName: ', methodName)
      let isAlreadyBet = false
      let betId = eventId + '_' + betTeam.replace(/ /g, '_') + '_' + methodName
      console.log('betId: ', betId)

      return $http.get('/api/alreadyBet', {
          timeout: 1000000,
          params: {
            id: betId

          }
        })
        .then(function(response) {

          console.log('response.data !!!!!!')
          console.log(response.data)
          return {
            methodName: methodName,
            alreadyBet: response.data.found
          }
        })
        .catch(function(data) {
          console.log('Error: ');
          return {

          }

        });

    }

    ctrl.getLevel = function(betTeam, methodName) {
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
        .then(function(response) {
          // console.log('done')
          let finishedBets = response.data
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

          return {
            methodName: methodName,
            level: level
          };
        })
        .catch(function(data) {
          console.log('Error: ');
          console.log(data);

        });

    }

  }]);
