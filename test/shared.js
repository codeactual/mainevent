/**
 * Test the Javascript helpers shared client-side and server-side.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');

exports.testWalkAsync = function(test) {
  var list = [1, 2, 3];
  var consumed = [];

  var consumer = function(num, callback) {
    consumed.push(num);
    callback(num);
  };

  var onDone = function() {
    test.deepEqual(consumed, list);
    test.done();
  };

  test.expect(1);
  diana.shared.Async.runOrdered(list, consumer, onDone);
};
