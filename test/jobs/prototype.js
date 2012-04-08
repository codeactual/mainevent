'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');

exports.prototypes = {
  setUp: function(callback) {
    var JobAClass = function() {
      this.name = 'JobA';
      this.__super__.apply(this, arguments);
    };
    var JobBClass = function() {
      this.name = 'JobB';
      this.__super__.apply(this, arguments);
    };
    var proto = diana.requireJob('prototype');
    proto.extend(JobAClass, {});
    proto.extend(JobBClass, {});
    this.namespace = 'test';
    this.jobA = new JobAClass(this.namespace);
    this.jobA2 = new JobAClass(this.namespace);
    this.jobB = new JobBClass(this.namespace);

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
    this.defaultMapReduceConfig = {};
    this.defaultKeyFields = {};

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

  testUpdateMapReduceConfig: function(test) {
    test.deepEqual(this.jobA.getMapReduceConfig(), this.defaultMapReduceConfig);

    var updates = {o: 1},
        expected = _.extend(this.defaultMapReduceConfig, updates);

    this.jobA.updateMapReduceConfig(updates);
    test.deepEqual(this.jobA.getMapReduceConfig(), expected);
    test.done();
  },

  testUpdateKeyFields: function(test) {
    test.deepEqual(this.jobA.getKeyFields(), this.defaultKeyFields);

    var updates = {o: 1},
        expected = _.extend(this.defaultKeyFields, updates);

    this.jobA.updateKeyFields(updates);
    test.deepEqual(this.jobA.getKeyFields(), expected);
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

  testBuildKey: function(test) {
    test.equal(this.jobA.buildKey('a', 'b', 'c'), 'a:b:c');
    test.equal(this.jobA.buildKey('', 'b', 'c'), 'b:c');
    test.done();
  },

  testBuildLastIdKey: function(test) {
    test.equal(this.jobA.buildLastIdKey(), this.namespace + ':JobA:lastId');
    test.done();
  },

  testBuildHashKey: function(test) {
    var resultId = '2012-02';
    test.equal(
      this.jobA.buildHashKey(resultId),
      this.namespace + ':JobA:result:' + resultId
    );
    test.done();
  },

  testExtractResultKey: function(test) {
    var resultId = '2012-02',
        hashKey = this.jobA.buildHashKey(resultId);
    test.equal(
      this.jobA.extractResultKey(hashKey),
      resultId
    );
    test.done();
  }
};
