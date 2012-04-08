/**
 * Common requirement for all test modules.
 */

'use strict';

require(__dirname + '/../../app/modules/mainevent.js');

var fs = require('fs');
var crypto = require('crypto');

exports.getRandHash = function() {
  var sha1 = crypto.createHash('sha1');
  sha1.update(crypto.randomBytes(50))
  return sha1.digest('hex');
};

exports.getTempFile = function() {
  var path = '/tmp/mainevent-test-' + exports.getRandHash();
  return {
    path: path,
    fd: fs.openSync(path, 'w')
  };
};

exports.sortNum = function(arr) {
  return _.sortBy(arr, function(num) { return num; });
};
