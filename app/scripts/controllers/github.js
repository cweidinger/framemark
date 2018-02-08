'use strict';

/**
 * @ngdoc function
 * @name nglogApp.controller:GithubCtrl
 * @description
 * # GithubCtrl
 * Controller of the nglogApp
 */
angular.module('nglogApp').controller('GithubCtrl', ['$scope', 'lgOrm', function($scope, lgOrm) {
	var schema = {
		primaryKey: 'name',
		recordOrder: [{
			attribute: 'stargazers',
			descending: true
		}],
		fieldOrder: ['name', 'stargazers', 'commits'],
		fields: {
			name: {
				header: 'Repo',
				type: 'string'
			},
			daysSinceLastUpdate: {
				header: 'Last Update',
				type: 'string'
			},
			commits: {
				header: 'Commits',
				type: 'string'
			},
			releases: {
				header: 'Releases',
				type: 'string'
			},
			contributors: {
				header: 'Contributors',
				type: 'string'
			},
			watchers: {
				header: 'Watchers',
				type: 'string'
			},
			stargazers: {
				header: 'Stars',
				type: 'string'
			},
			network: {
				header: 'Forks',
				type: 'string',
			},
			openIssues: {
				header: 'Open Issues',
				type: 'string',
			},
			closedIssues: {
				header: 'Closed Issues',
				type: 'string'
			},
			openPrs: {
				header: 'Open PRs',
				type: 'string'
			},
			closedPrs: {
				header: 'Closed PRs',
				type: 'string',
			},
		}
	};

	$scope.tablename = 'repos';
	lgOrm.registerFixture({
			name : $scope.tablename,
			data : [],
			schema : schema
		});

	$.getJSON('repos.backend.json', {}, function(data, textStatus, jqXHR) {
		lgOrm.registerFixture({
			name : $scope.tablename,
			data : data,
			schema : schema
		});
			lgOrm.callWatchAll($scope.tablename);

	});



	}]);