/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    testutil = require(__dirname + '/../modules/testutil.js'),
    fork = require('child_process').fork,
    exec = require('child_process').exec,
    tailJsFile = __dirname + '/../../bin/tail.js',
    mongodb = mainevent.requireModule('mongodb').createInstance(),
    pgrepTailCmdFormat = 'pgrep -f "^tail --bytes=0 -F %s -v"';

exports.core = {

  setUp: function(callback) {
    this.configFile = __dirname + '/../fixtures/tail-config.js';
    this.config = mainevent.getConfig(this.configFile);
    this.path = this.config.sources[0].path;
    callback();
  },

  testMonitoring: function(test) {
    test.expect(1);

    var run = testutil.getRandHash(),
        log = JSON.stringify({path: this.path, run: run}),
        fd = fs.openSync(this.path, 'a'),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
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
  },

  testAutoRestart: function(test) {
    test.expect(2);

    var testcase = this,
        run = testutil.getRandHash(),
        log = JSON.stringify({path: this.path, run: run}),
        pgrepTailCmd = util.format(pgrepTailCmdFormat, this.path),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
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
          var fd = fs.openSync(testcase.path, 'a');
          fs.writeSync(fd, log);
          fs.closeSync(fd);

          test.ok(parseInt(stdout.toString(), 10) > 0);
          test.done();
        });
      }
    });

    tailJs.send('START_TEST');
  },

  testMonitorCleanup: function(test) {
    test.expect(2);

    var run = testutil.getRandHash(),
        log = JSON.stringify({path: this.path, run: run}),
        pgrepTailJs = 'pgrep -f "' + tailJsFile + ' --quiet --config ' + testutil + ' --test 1"',
        pgrepTailCmd = util.format(pgrepTailCmdFormat, this.path),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
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
        exec(pgrepTailJs, [], function(error) {
         test.equal(error.code, 1); // 'No processes matched.'
          test.done();
        });
      }
    });

    tailJs.send('START_TEST');
  },

  /**
   * Before adding retries to insertLog(), bursts of concurrent writes would
   * trigger connection loss result in "TypeError: Cannot read property
   * 'arbiterOnly' of undefined".
   *
   * Here `tail` will receive the burst in chunks that trigger independent
   * stdout events and subsequent insert() calls.
   */
  testInsertRetry: function(test) {
    test.expect(1);

    var testcase = this,
        run = testutil.getRandHash(),
        lines = [],
        size = 200,
        fd = fs.openSync(this.path, 'a'),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
          '--test', size
        ], {env: process.env});

    _(size).times(function() {
      lines.push(JSON.stringify({path: testcase.path, run: run}) + "\n");
    });

    // Verify the entire burst was saved.
    tailJs.on('exit', function(code) {
      mongodb.getCollectionCursor(testcase.config.mongodb.collections.event, {run: run}, {}, function(cursor) {
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
  }
};

var sshConfigFile = __dirname + '/../fixtures/tail-config-remote.js';

exports.ssh = {

  setUp: function(callback) {
    this.configFile = sshConfigFile;
    this.config = mainevent.getConfig(this.configFile);
    this.path = this.config.sources[0].path;
    callback();
  },

  testRemoteSource: function(test) {
    test.expect(2);

    var run = testutil.getRandHash(),
        log = JSON.stringify({path: this.path, run: run}),
        fd = fs.openSync(this.path, 'a'),
        pgrepTailCmd = util.format(pgrepTailCmdFormat, this.path),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
          '--test', 1
        ], {env: process.env});

   // Verify remote `tail` output was processed.
   tailJs.on('exit', function(code) {
     mongodb.getTimeline({run: run}, function(err, docs) {
       test.equal(docs[0].run, run);

       // Verify remote `tail` was killed.
       exec(pgrepTailCmd, [], function(error) {
         test.equal(error.code, 1); // 'No processes matched.'
         test.done();
       });
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
  }
};

if (!path.existsSync(sshConfigFile)) {
  delete exports.ssh;
}
