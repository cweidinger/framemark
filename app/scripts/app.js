'use strict';

angular
  .module('nglogApp', [
      'ngRoute',
    'ui.bootstrap',
  ])
  .config(['$httpProvider', '$compileProvider', '$routeProvider', function ($httpProvider, $compileProvider, $routeProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    // $compileProvider.debugInfoEnabled(false);  // collides with some of angular ui sortable functionality
    // type "angular.reloadWithDebugInfo();" into console and the page will reload and you'll have debug info available again.

    $routeProvider
      .when('/', {
        templateUrl: 'views/framemark.html',
        controller: 'FramemarkCtrl'
      })
      .when('/github', {
        templateUrl: 'views/github.html',
        controller: 'GithubCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

// Prevent the backspace key from navigating back.
$(document).unbind('keydown').bind('keydown', function (event) {
    var doPrevent = false;
    if (event.keyCode === 8) {
        var d = event.srcElement || event.target;
        if ((d.tagName.toUpperCase() === 'INPUT' &&
             (
                 d.type.toUpperCase() === 'TEXT' ||
                 d.type.toUpperCase() === 'PASSWORD' ||
                 d.type.toUpperCase() === 'FILE' ||
                 d.type.toUpperCase() === 'EMAIL' ||
                 d.type.toUpperCase() === 'SEARCH' ||
                 d.type.toUpperCase() === 'DATE' )
             ) ||
             d.tagName.toUpperCase() === 'TEXTAREA') {
            doPrevent = d.readOnly || d.disabled;
        }
        else {
            doPrevent = true;
        }
    }

    if (doPrevent) {
        event.preventDefault();
    }
});
