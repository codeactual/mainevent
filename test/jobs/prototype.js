'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');

exports.prototypes = {
  setUp: function(callback) {
    var JobAClass = function() {
      this.name = 'JobA';
      this.__super__.call(this);
    };
    var JobBClass = function() {
      this.name = 'JobB';
      this.__super__.call(this);
    };
    var proto = diana.requireJob('prototype');
    proto.extend(JobAClass, {});
    proto.extend(JobBClass, {});
    this.jobA = new JobAClass();
    this.jobA2 = new JobAClass();
    this.jobB = new JobBClass();

    // For wrapCallback() tests.
    var jobA = this.jobA;
    this.jobA.dropped = false;
    // Stub the function(s) called by wrapCallback().
    this.jobA.mongodb = {
      dropCollection: function(name, callback) {
        jobA.dropped = true;
        callback();
      }
    };

    this.defaultOptions = {dropResultsAfterUse: true, suffix: ''};

    callback();
  },

  tearDown: function(callback) {
    delete this.jobA;
    delete this.jobB;
    delete this.defaultOptions;
    callback();
  },

  testUpdateOptions: function(test) {
    test.deepEqual(this.jobA.getOptions(), this.defaultOptions);

    var updates = {o: 1},
        expected = _.extend(this.defaultOptions, updates);

    this.jobA.updateOptions(updates);
    test.deepEqual(this.jobA.getOptions(), expected);
    test.done();
  },

  testInstanceIsolation: function(test) {
    var updates = {o: 1},
        expected = _.extend(_.clone(updates), this.defaultOptions);

    this.jobA.updateOptions(updates);

    test.deepEqual(this.jobA.getOptions(), expected);
    test.deepEqual(this.jobA2.getOptions(), this.defaultOptions);
    test.deepEqual(this.jobB.getOptions(), this.defaultOptions);
    test.done();
  },

  testExtractOptionsFromQuery: function(test) {
    var customOptions = {opt1: 2, opt2: 3},
        query = _.extend({a: 1, b: 4}, customOptions);

    this.jobA.customOptionKeys = Object.keys(customOptions);

    var expected = _.extend(this.defaultOptions, customOptions),
        updated = this.jobA.extractOptionsFromQuery(query);

    test.deepEqual(updated, expected);
    test.deepEqual(this.jobA.getOptions(), expected);
    test.done();
  },

  testDefaultExpires: function(test) {
    test.equal(60, this.jobA.getExpires());
    test.done();
  },

  testGetSuffixWithValueInOptions: function(test) {
    var updates = {suffix: '_test'},
        query = {code: 200};
    this.jobA.updateOptions(updates);
    test.equal(this.jobA.getSuffix(query), updates.suffix);
    test.done();
  },

  testGetSuffixWithoutValueInOptions: function(test) {
    var options = this.jobA.getOptions(),
        query = {code: 200},
        expected = _.sha1(_.extend(options, query));
    test.equal(this.jobA.getSuffix(query), expected);
    test.done();
  },

  testWrapCallbackWithDropResults: function(test) {
    test.expect(4);
    var expected = {err: 'someerr', results: {a: 1}, stats: {collectionName: 'c'}},
        thisTest = this;
    var wrapper = this.jobA.wrapCallback(function(err, results, stats) {
      test.equal(err, expected.err);
      test.equal(results, expected.results);
      test.equal(stats, expected.stats);
      test.equal(thisTest.jobA.dropped, true);
      test.done();
    });
    wrapper(expected.err, expected.results, expected.stats);
  },

  testWrapCallbackWithoutDropResults: function(test) {
    test.expect(3);
    var expected = {err: 'someerr', results: {a: 1}, stats: {collectionName: 'c'}},
        thisTest = this;
    this.jobA.updateOptions({dropResultsAfterUse: false});
    var wrapper = this.jobA.wrapCallback(function(err, results, stats) {
      test.equal(err, expected.err);
      test.equal(results, expected.results);
      test.equal(thisTest.jobA.dropped, false);
      test.done();
    });
    wrapper(expected.err, expected.results, expected.stats);
  },

  testWrapCallbackWithoutStats: function(test) {
    test.expect(3);
    var expected = {err: 'someerr', results: {a: 1}},
        thisTest = this;
    var wrapper = this.jobA.wrapCallback(function(err, results, stats) {
      test.equal(err, expected.err);
      test.equal(results, expected.results);
      test.equal(thisTest.jobA.dropped, false);
      test.done();
    });
    wrapper(expected.err, expected.results);
  },

  testBuildLastIdKey: function(test) {
    var namespace = 'graph';
    test.equal(this.jobA.buildLastIdKey(namespace), namespace + ':JobA:lastId');
    test.done();
  }
};
