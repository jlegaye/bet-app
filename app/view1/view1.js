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

    const allLeagues = [
      {
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

    ctrl.getNextEventsToBet = function() {
      ctrl.isLoading = true
      $http.get('/api/nextEventsToBet', {
          timeout: 1000000
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
