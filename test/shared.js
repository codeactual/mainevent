/**
 * Test the Javascript helpers shared client-side and server-side.
 */

'use strict';

var helpers = require(__dirname + '/../app/modules/helpers.js');
var build = helpers.requireModule('build');
build.combineSharedJavascript();

exports.testWalkAsync = function(test) {
  var list = [1, 2, 3];
  var consumed = [];
  var calledBack = [];

  var consumer = function(num, callback) {
    consumed.push(num);
    callback(num);
  };

  var consumerCallback = function(num) {
    calledBack.push(num);
  };

  var onDone = function() {
    test.deepEqual(consumed, list);
    test.deepEqual(calledBack, list);
    test.done();
  };

  test.expect(2);
  diana.shared.Async.runOrdered(list, consumer, consumerCallback, onDone);
};
