/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs');
var testutil = require(__dirname + '/testutil.js');
var spawn = require('child_process').spawn;
var storage = helpers.requireModule('storage/storage').load();

exports.testMonitoring = function(test) {
  var testConfigFile = __dirname + '/fixtures/tail-config.js';
  var testConfig = helpers.getConfig(testConfigFile);
  var run = testutil.getRandHash();
  var path = testConfig.sources[0].path;
  var log = JSON.stringify({path: path, run: run});

  var tailJs = spawn('/usr/local/node/bin/node', [
    __dirname + '/../app/tail.js',
    testConfigFile
  ]);
  fs.writeFileSync(path, log);

  test.expect(1);
  storage.getTimeline({path: path, run: run}, function(err, docs) {
    tailJs.kill();
    test.equal(docs[0].run, run);
    test.done();
  });
};
