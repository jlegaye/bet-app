'use strict';

angular.module('myApp.view1', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view1', {
      templateUrl: 'view1/view1.html',
      controller: 'View1Ctrl'
    });
  }])

  .controller('View1Ctrl', ['$scope', '$http', function($scope, $http) {

    let uniqEs6 = (arrArg) => {
      return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
      });
    }

    const allLeagues = [{
        country: 'FRANCE',
        league: 'LIGUE 1'
      }, {
        country: 'FRANCE',
        league: 'LIGUE 2'
      }, {
        country: 'ENGLAND',
        league: 'PREMIER LEAGUE'
      }, {
        country: 'ENGLAND',
        league: 'CHAMPIONSHIP'
      }, {
        country: 'GERMANY',
        league: 'BUNDESLIGA'
      }, {
        country: 'GERMANY',
        league: '2. BUNDESLIGA'
      }, {
        country: 'SPAIN',
        league: 'PRIMERA DIVISION'
      }, {
        country: 'SPAIN',
        league: 'SEGUNDA DIVISION'
      }, {
        country: 'ITALY',
        league: 'SERIE A'
      }, {
        country: 'ITALY',
        league: 'SERIE B'
      }, {
        country: 'PORTUGAL',
        league: 'PRIMEIRA LIGA'
      }, {
        country: 'ARGENTINA',
        league: 'PRIMERA DIVISION'
      },
      // {
      //  country: 'CHILE',
      //  league: 'PRIMERA DIVISION'
      //},
      {
        country: 'COLOMBIA',
        league: 'PRIMERA A'
      }, {
        country: 'RUSSIA',
        league: 'RUSSIAN FOOTBALL PREMIER LEAGUE'
      }, {
        country: 'USA',
        league: 'MAJOR LEAGUE SOCCER',
        seasonOffset: true
      }, {
        country: 'ALGERIA',
        league: 'LIGUE 1'
      }, {
        country: 'AUSTRIA',
        league: 'BUNDESLIGA'
      }, {
        country: 'BRAZIL',
        league: 'SERIE A',
        seasonOffset: true
      }, {
        country: 'BULGARIA',
        league: 'FIRST PROFESSIONAL FOOTBALL LEAGUE'
      }, {
        country: 'CYPRUS',
        league: 'DIVISION 1'
      }, {
        country: 'CROATIA',
        league: 'PRVA HNL'
      }, {
        country: 'DENMARK',
        league: 'SUPERLIGAEN'
      }, {
        country: 'SCOTLAND',
        league: 'SCOTTISH PREMIERSHIP'
      }, {
        country: 'FINLAND',
        league: 'VEIKKAUSLIIGA'
      }, {
        country: 'GREECE',
        league: 'SUPER LEAGUE'
      }, {
        country: 'HUNGARY',
        league: 'NB I'
      }, {
        country: 'JAPAN',
        league: 'J1 LEAGUE',
        seasonOffset: true
      }, {
        country: 'REPUBLIC OF IRELAND',
        league: 'PREMIER DIVISION'
      }, {
        country: 'NORTHERN IRELAND',
        league: 'SCOTTISH PREMIERSHIP'
      }, {
        country: 'MALTA',
        league: 'PREMIER LEAGUE'
      }, {
        country: 'MEXICO',
        league: 'LIGA MX'
      }, {
        country: 'NORWAY',
        league: 'ELITESERIEN'
      }, {
        country: 'WALES',
        league: 'WELSH PREMIER LEAGUE'
      }, {
        country: 'NETHERLANDS',
        league: 'EREDIVISIE'
      }, {
        country: 'POLAND',
        league: 'EKSTRAKLASA'
      }, {
        country: 'CZECH REPUBLIC',
        league: 'DIVISION 1'
      }, {
        country: 'ROMANIA',
        league: 'LIGA I'
      }, {
        country: 'SLOVAKIA',
        league: 'SUPER LIGA'
      }, {
        country: 'SWEDEN',
        league: 'ALLSVENSKAN'
      }, {
        country: 'SWITZERLAND',
        league: 'SUPER LEAGUE'
      }, {
        country: 'TURKEY',
        league: 'SUPER LIG'
      }, {
        country: 'UKRAINE',
        league: 'PREMIER LEAGUE'
      }
    ]

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

    ctrl.getNextEventsToBet2ndBetter = function() {
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

                // let mustBetsecondHalfBetter = mustBetCriteria(finishedMatches, 'secondHalfBetter')
                // let mustBet = mustBetCriteria(finishedMatches, 'twoOrThreeGoals')

                let mustBetObj = [
                  mustBetCriteria(finishedMatches, secondHalfBetter, 'secondHalfBetter'),
                  mustBetCriteria(finishedMatches, twoOrThreeGoals, 'twoOrThreeGoals'),
                  mustBetCriteria(finishedMatches, moreThan1_5Goal, 'moreThan1_5Goal'),
                  mustBetCriteria(finishedMatches, goalAtHalfTime, 'goalAtHalfTime')

                ]
                // console.log('mustBet: ' + mustBet)
                if (mustBetObj.map(obj => obj.mustBet).includes(true)) {
                  return $http.get('/api/nextEvent', {
                      params: {
                        team: team
                      }
                    })
                    .then(response => {
                      let nextEvent = response.data
                      let event = {}
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
                        dateString: nextEvent.dateString
                      }
                      return event
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
              ctrl.isLoading = false
              console.log('after promise all')
              let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);

              console.log(allNextFilteredSortedEventsToBet)
              ctrl.nextEventsToBet = allNextFilteredSortedEventsToBet

            })
        })
        .catch(data => {
          ctrl.isLoading = false
          console.log('Error during getting teams: ' + data);
        })


    }
    let olderFirst = (a, b) => (a.nextMatch.date > b.nextMatch.date) ? 1 : ((b.nextMatch.date > a.nextMatch.date) ? -1 : 0)
    ctrl.getNextEventsToBet2ndBetterOld = function() {
      ctrl.isLoading = true
      $http.get('/api/nextEventsToBet', {
          timeout: 1000000,
          params: {
            method: '2nd_Half_better'
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

    ctrl.getNextEventsToBetMore1_5Goal = function() {
      ctrl.isLoading = true
      $http.get('/api/nextEventsToBet', {
          timeout: 1000000,
          params: {
            method: 'more_than_1_5_goal'
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

    ctrl.getNextEventsToBet2Or3Goals = function() {
      ctrl.isLoading = true
      $http.get('/api/nextEventsToBet', {
          timeout: 1000000,
          params: {
            method: 'two_or_three_goals'
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


    ctrl.refreshDatabase = function() {
      $http.get('/api/refreshDatabase', {
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

    ctrl.countries = uniqEs6(allLeagues.map(item => item.country))

    ctrl.refreshLeagues = function() {
      console.log('refresh Leagues')
      ctrl.leagues = allLeagues.filter(item => item.country == ctrl.country).map(item => item.league)
    }

  }]);
