/**
 * Test the import.js CLI tool.
 */

'use strict';

var fs = require('fs');
var testutil = require(__dirname + '/modules/testutil.js');
var spawn = require('child_process').spawn;
var storage = diana.requireModule('storage/storage').load();

var testConfigFile = __dirname + '/fixtures/tail-config.js';
var testConfig = diana.getConfig(testConfigFile);
var source = testConfig.sources[0];

exports.testImport = function(test) {
  var run = testutil.getRandHash();
  var parsed = {message: source.path, t: 1331543011, run: run};
  var log = JSON.stringify(parsed) + "\n"; // lazy.lines requires trailing newline

  test.expect(4);

  // Add one line.
  var fd = fs.openSync(source.path, 'w');
  fs.writeSync(fd, log);
  fs.closeSync(fd);

  // Import it w/ all options.
  var tailJs = spawn(__dirname + '/../app/import.js', [
    '--path', source.path,
    '--parser', source.parser,
    '--tags', source.tags.join(','),
    '--timeAttr', source.timeAttr,
    '--previewAttr', source.previewAttr.join(',')
  ]);

  // Verify fields.
  tailJs.on('exit', function(code) {
    storage.getTimeline({run: run}, function(err, docs) {
      test.equal(docs[0].time, parsed.t);
      test.equal(docs[0].message, source.path);
      test.deepEqual(docs[0].previewAttr, source.previewAttr);
      test.deepEqual(docs[0].tags, source.tags);
      test.done();
    });
  });
};
