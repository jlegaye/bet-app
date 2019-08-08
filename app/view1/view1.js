'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', '$http', function($scope, $http) {
  var ctrl = $scope;
  ctrl.results = 'titi';
  ctrl.getResults = function() {
    $http.get('/api/results', {
          timeout: 1000000
        })
        .then(function(response) {
          console.log('result')
          ctrl.isLoading = false
          ctrl.results = response.data
        })
        .catch(function(data) {
          console.log('Error: ' + data);
          ctrl.isLoading = false
        });

  }
}]);
