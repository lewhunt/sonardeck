//  © 2016 Lew Hunt - SonarDeck - the free web app that filters your SoundCloud stream, likes and new music tracks

// unused module - 'ya.nouislider'
var sonardeckApp = angular.module('sonardeckApp', ['ngAnimate', 'ngStorage', 'checklist-model', 'infinite-scroll', 'ngRoute']);

//sonardeckApp.value('yaNoUiSliderConfig', {step: 1});

sonardeckApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType = "explore";
				$scope.mainCtrl.initPublicTracks();	

			}	
		})
		.when('/explore/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType =  "explore";
				$scope.mainCtrl.initPublicTracks();	
			}	
		})
		.when('/latest/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType =  "latest";
				$scope.mainCtrl.initPublicTracks();	
			}	
		})
		.when('/stream/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType =  "stream";
				$scope.mainCtrl.initUserTracks();
			}
		})
		.when('/likes/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType =  "likes";
				$scope.mainCtrl.initUserTracks();
			}
		})
		.when('/playlists/', {
			templateUrl: 'templates/grid.html',
			controller: function($scope) {
				$scope.mainCtrl.pageType =  "playlists";
				$scope.mainCtrl.initUserTracks();
			}
		});
});


sonardeckApp.filter("customFilter", function() {

  return function (input, filter, filterKey) {
    var out = [];

    if (filter && filter.length > 0) {

      angular.forEach(input,function (e) {

        if (filter.indexOf(e[filterKey])>=0) {
          out.push(e);
        }
      }) 
           
    } else  {
      out = input;
    }
 
  return out;
  };
});

sonardeckApp.filter("rangeFilter", function() {

  return function (input, filter, filterKey) {
    var out = [];

    if (filter) {

      angular.forEach(input,function (e) {
        
        //if (e[filterKey] >= filter.start[0] && e[filterKey] <= filter.start[1])
		if (e[filterKey] >= filter.start && e[filterKey] <= filter.end)
		{
			out.push(e);
		} 
        
      }) 
           
    } else  {
      out = input;
    }
 
  return out;
  };
});

sonardeckApp.filter('capitalize', function() {
    return function(input, all) {
      var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
      return (!!input) ? input.replace(reg, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
  });
