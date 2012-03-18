/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs');
var testutil = require(__dirname + '/modules/testutil.js');
var spawn = require('child_process').spawn;
var storage = diana.requireModule('storage/storage').load();

exports.testMonitoring = function(test) {
  var testConfigFile = __dirname + '/fixtures/tail-config.js';
  var testConfig = diana.getConfig(testConfigFile);
  var run = testutil.getRandHash();
  var path = testConfig.sources[0].path;
  var log = JSON.stringify({path: path, run: run});

  test.expect(1);

  // -t will enable test mode and force exit after 1 line.
  var tailJs = spawn(__dirname + '/../app/tail.js', [
    '-c', testConfigFile,
    '-t', 1
  ]);

  tailJs.on('exit', function(code) {
    storage.getTimeline({path: path, run: run}, function(err, docs) {
      test.equal(docs[0].run, run);
      test.done();
    });
  });

  // Wait until we know tail.js has started watching 'path' to add a line.
  tailJs.stdout.on('data', function(data) {
    if ("START_TEST\n" == data.toString()) {
      fs.writeFileSync(path, log);
    }
  });
};
