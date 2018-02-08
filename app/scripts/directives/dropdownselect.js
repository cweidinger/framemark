'use strict';

/**
 * @ngdoc directive
 * @name nglogApp.directive:dropdownselect
 * @description
 * # dropdownselect
 */
angular.module('nglogApp')
  .directive('dropdownselect', ['$timeout', function ($timeout) {
    return {
      template: '<div class="btn-group">' +
         '<button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">' +
			'{{ label }} ' + 
			'<span class="caret"></span> {{ text }}' + 
			'</button>' +
			'<ul class="dropdown-menu" role="menu"></ul>' +
			'</div>',
		replace: true,
      restrict: 'E',
      scope : {
        label : '@',
        value : '=',
        options : '='
      },
      link: function postLink(scope, element, attrs) {
      	for (var i = 0; i < scope.options.length; i++) {
      		element.find('ul').append('<li><a data-key="'+scope.options[i].key+'" href="#" >'+scope.options[i].value+'</li>');
      	}
      	scope.$watch('value', function(nu, old) {
      		if (typeof nu !== 'undefined') {
      			scope.text = getTextFromOptions(nu);
      		}
      	});
      	scope.text = scope.value;
      	function getTextFromOptions(key) {
      		for (var i = 0; i < scope.options.length; i++) {
      			if (scope.options[i].key == key) {
      				return scope.options[i].value;
      			}
      		}
      	}
      	element.find('ul').children().each(function() {
      		this.onclick = function () {
      			var self = this;
      			event.preventDefault();
      			$timeout(function() {
      				scope.value = $(self).find('a').attr('data-key');
      				scope.text = getTextFromOptions(scope.value);
      				if (scope.value == 0) {
      					element.find('button').addClass('active');
      				} else {
      					element.find('button').removeClass('active');
      				}
      			});
      		};
      	});
        // scope.label = attrs.label; // ngModel.$setViewValue .. scope.$apply
      }
    };
  }]);
