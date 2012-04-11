/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs'),
    testutil = require(__dirname + '/../modules/testutil.js'),
    fork = require('child_process').fork,
    exec = require('child_process').exec,
    tailJsFile = __dirname + '/../../bin/tail.js',
    mongodb = mainevent.requireModule('mongodb').createInstance(),
    testConfigFile = __dirname + '/../fixtures/tail-config.js',
    testConfig = mainevent.getConfig(testConfigFile),
    path = testConfig.sources[0].path;

exports.testMonitoring = function(test) {
  test.expect(1);

  var run = testutil.getRandHash(),
      log = JSON.stringify({path: path, run: run}),
      fd = fs.openSync(path, 'a'),
      // -t will enable test mode and force exit after 1 line.
      tailJs = fork(tailJsFile, [
        '--quiet',
        '--config', testConfigFile,
        '--test', 1
      ], {env: process.env});

  tailJs.on('exit', function(code) {
    mongodb.getTimeline({run: run}, function(err, docs) {
      test.equal(docs[0].run, run);
      test.done();
    });
  });

  // Wait until we know tail.js has started watching 'path' to add a line.
  tailJs.on('message', function(message) {
    if ('MONITORS_STARTED' == message) {
      fs.writeSync(fd, log);
      fs.closeSync(fd);
    }
  });

  tailJs.send('START_TEST');
};

exports.testAutoRestart = function(test) {
  test.expect(2);

  var run = testutil.getRandHash(),
      log = JSON.stringify({path: path, run: run}),
      pgrepTailCmd = 'pgrep -f "tail --bytes=0 -F ' + path + '"',
      // -t will enable test mode and force exit after 1 line.
      tailJs = fork(tailJsFile, [
        '--quiet',
        '--config', testConfigFile,
        '--test', 1
      ], {env: process.env});

  tailJs.on('message', function(message) {
    // Wait until we know tail.js has started watching 'path' to add a line.
    if ('MONITORS_STARTED' == message) {
      exec(pgrepTailCmd, [], function(code, pid) {
        exec('env kill -9 ' + pid.toString(), [], function(code, stdout) {
          test.equal(stdout.toString(), '');
        });
      });

    // Wait until we know tail.js should have restarted `tail`.
    } else if ('MONITOR_RESTART' == message) {
      exec(pgrepTailCmd, [], function(code, stdout, stderr) {
        // Force tail.js to exit.
        var fd = fs.openSync(path, 'a');
        fs.writeSync(fd, log);
        fs.closeSync(fd);

        test.ok(parseInt(stdout.toString(), 10) > 0);
        test.done();
      });
    }
  });

  tailJs.send('START_TEST');
};

exports.testMonitorCleanup = function(test) {
  test.expect(2);

  var run = testutil.getRandHash(),
      log = JSON.stringify({path: path, run: run}),
      pgrepTailJs = 'pgrep -f "' + tailJsFile + ' --quiet --config ' + testutil + ' --test 1"',
      pgrepTailCmd = 'pgrep -f "tail --bytes=0 -F ' + path + '"',
      // -t will enable test mode and force exit after 1 line.
      tailJs = fork(tailJsFile, [
        '--quiet',
        '--config', testConfigFile,
        '--test', 1
      ], {env: process.env});

  tailJs.on('message', function(message) {
    // Wait until we know tail.js has started watching 'path' to add a line.
    if ('MONITORS_STARTED' == message) {
      exec(pgrepTailCmd, [], function(code, stdout, stderr) {
        test.ok(parseInt(stdout.toString(), 10) > 0);
        tailJs.kill();
      });

    // Wait until we know tail.js should have restarted `tail`.
    } else if ('MONITORS_ENDED' == message) {
      exec(pgrepTailJs, [], function(code, stdout, stderr) {
        test.equal(stdout.toString(), '');
        test.done();
      });
    }
  });

  tailJs.send('START_TEST');
};

/**
 * Before adding retries to insertLog(), bursts of concurrent writes would
 * trigger connection loss result in "TypeError: Cannot read property
 * 'arbiterOnly' of undefined".
 *
 * Here `tail` will receive the burst in chunks that trigger independent
 * stdout events and subsequent insert() calls.
 */
exports.testInsertRetry = function(test) {
  test.expect(1);

  var run = testutil.getRandHash(),
      lines = [],
      size = 200,
      fd = fs.openSync(path, 'a'),
      // -t will enable test mode and force exit after 1 line.
      tailJs = fork(tailJsFile, [
        '--quiet',
        '--config', testConfigFile,
        '--test', size
      ], {env: process.env});

  _(size).times(function() {
    lines.push(JSON.stringify({path: path, run: run}) + "\n");
  });

  // Verify the entire burst was saved.
  tailJs.on('exit', function(code) {
    mongodb.getCollectionCursor(testConfig.mongodb.collections.event, {run: run}, {}, function(cursor) {
      cursor.count(function(err, count) {
        mongodb.dbClose();
        test.equal(count, lines.length);
        test.done();
      });
    });
  });

  // Wait until we know tail.js has started watching 'path' to add lines.
  tailJs.on('message', function(message) {
    if ('MONITORS_STARTED' == message) {
      _.each(lines, function(line) {
        fs.writeSync(fd, line);
      });
      fs.closeSync(fd);
    }
  });

  tailJs.send('START_TEST');
};
