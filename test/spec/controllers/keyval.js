'use strict';

describe('Controller: KeyvalCtrl', function () {

  // load the controller's module
  beforeEach(module('nglogApp'));

  var KeyvalCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    KeyvalCtrl = $controller('KeyvalCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(KeyvalCtrl.awesomeThings.length).toBe(3);
  });
});
