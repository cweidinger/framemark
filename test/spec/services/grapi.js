'use strict';

describe('Service: grapi', function () {

  // load the service's module
  beforeEach(module('nglogApp'));

  // instantiate service
  var grapi;
  beforeEach(inject(function (_grapi_) {
    grapi = _grapi_;
  }));

  it('should do something', function () {
    expect(!!grapi).toBe(true);
  });

});
