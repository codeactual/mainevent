/**
 * Test the import.js CLI tool.
 */

'use strict';

var fs = require('fs'),
    testutil = require(__dirname + '/../modules/testutil.js'),
    spawn = require('child_process').spawn,
    mongodb = mainevent.requireModule('mongodb').createInstance(),
    testConfigFile = __dirname + '/../fixtures/tail-config.js',
    testConfig = mainevent.getConfig(testConfigFile),
    source = testConfig.sources[0];

exports.testImport = function(test) {
  var run = testutil.getRandHash(),
      parsed = {message: source.path, t: 1331543011000, run: run},
      log = JSON.stringify(parsed) + "\n"; // lazy.lines requires trailing newline

  test.expect(4);

  // Add one line.
  var fd = fs.openSync(source.path, 'w');
  fs.writeSync(fd, log);
  fs.closeSync(fd);

  // Import it w/ all options.
  var tailJs = spawn(__dirname + '/../../bin/mainevent-import', [
    '--path', source.path,
    '--parser', source.parser,
    '--tags', source.tags.join(','),
    '--timeAttr', source.timeAttr,
    '--previewAttr', source.previewAttr.join(',')
  ]);

  // Verify fields.
  tailJs.on('exit', function(code) {
    mongodb.getTimeline({run: run}, function(err, docs) {
      test.strictEqual(docs[0].time, parsed.t);
      test.strictEqual(docs[0].message, source.path);
      test.deepEqual(docs[0].previewAttr, source.previewAttr);
      test.deepEqual(docs[0].tags, source.tags);
      test.done();
    });
  });
};
