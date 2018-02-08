'use strict';

describe('Service: neo4j', function () {

  // load the service's module
  beforeEach(module('nglogApp'));

  // instantiate service
  var neo4j;
  beforeEach(inject(function (_neo4j_) {
    neo4j = _neo4j_;
  }));

  it('should do something', function () {
    expect(!!neo4j).toBe(true);
  });

});
