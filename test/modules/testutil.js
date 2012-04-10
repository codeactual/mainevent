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

exports.getTestMongoDb = function() {
  // Disable all listeners by default. Tests which need them can create
  // a separate instance with custom configuration.
  var config = mainevent.getConfig().mongodb,
      instanceConfig = _.clone(config);
  instanceConfig.listeners = [];

  return mainevent.requireModule('mongodb').createInstance(instanceConfig);
};

// Pre-package new instances of common dependencies.
exports.setUp = function(callback) {
  this.mongodb = exports.getTestMongoDb();
  this.parsers = mainevent.requireModule('parsers');
  callback();
};

exports.tearDown = function(callback) {
  delete this.mongodb;
  delete this.parsers;
  callback();
};
