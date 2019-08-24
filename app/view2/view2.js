'use strict';

angular.module('myApp.view2', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view2', {
      templateUrl: 'view2/view2.html',
      controller: 'View2Ctrl'
    });
  }])

  .controller('View2Ctrl', ['$scope', '$http', '$q', function($scope, $http, $q) {


    var ctrl = $scope;

    ctrl.toCountryAndLeague = function(event) {
      event.countryAndLeague = event.country + ' (' + event.league + ')'
      return event
    }

    ctrl.getLastSeasonMatches = function() {
      ctrl.isLoading = true
      $http.get('/api/leagues', {
          timeout: 1000000
        })
        .then(function(response) {
          let leagues = response.data
          console.log('leagues: ', leagues)

          // let test = []
          // test.push(leagues[0])
          // let promisesToAllLeagues = test.map(league => {
          let promisesToAllLeagues = leagues.map(league => {

            return $http.get('/api/lastSeasonMatches', {
                timeout: 1000000,
                params: {
                  country: league.country,
                  league: league.league
                }
              })
              .then(function(response) {
                return response.data

              })
              .catch(function(data) {
                console.log('Error: ');
                console.log(data);
              });
          })
          Promise.all(promisesToAllLeagues)
            .then(allLastSeasonMatches => {

              console.log('after promise all')
              console.log('allLastSeasonMatches: ', allLastSeasonMatches)
              allLastSeasonMatches = [].concat.apply([], allLastSeasonMatches)
              // let allNextFilteredSortedEventsToBet = allNextEventsToBet.filter(value => Object.keys(value).length !== 0).sort(olderFirst);

              // console.log(allNextFilteredSortedEventsToBet)
              $scope.$apply(function() {
                ctrl.isLoading = false
                ctrl.allLastSeasonMatches = allLastSeasonMatches
                console.log('ctrl.allLastSeasonMatches: ', ctrl.allLastSeasonMatches)
              });


            })

        })
    }

    ctrl.addBet = function(event) {
      console.log('add bet')
      console.log('event: ', event)

      let bet = {
        _id: event._id + '_' + event.betTeam.replace(/ /g, '_') + '_' + event.method,
        date: event.date,
        betTeam: event.betTeam,
        status: 'WAIT',
        idEvent: event._id,
        method: event.method
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

    ctrl.refreshBets = function() {
      console.log('refreshBets')

      $http.get('/api/refreshBets', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log('bets refreshed!')
        })
    }

    ctrl.refreshWinamaxBets = function() {
      console.log('refreshWinamaxBets')

      $http.get('/api/refreshWinamaxBets', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log(response)
          // console.log('winamax bets refreshed!')
        })
    }

  }]);
