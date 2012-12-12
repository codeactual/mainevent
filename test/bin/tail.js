/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs'),
    testutil = require(__dirname + '/../modules/testutil.js'),
    fork = require('child_process').fork,
    exec = require('child_process').exec,
    tailJsFile = __dirname + '/../../bin/mainevent-tail',
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

    // Wait until we know tail.js has started watching 'path' to add a line.
    tailJs.on('message', function(message) {
      if ('MONITORS_STARTED' == message) {
        fs.writeSync(fd, log);
        fs.closeSync(fd);
      } else if ('TEST_BATCH_ENDED' === message) {
        mongodb.getTimeline({run: run}, function(err, docs) {
          tailJs.send('TEST_ENDED');
          test.strictEqual(docs[0].run, run);
          test.done();
        });
      }
    });

    tailJs.send('TEST_STARTED');
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
            test.strictEqual(stdout.toString(), '');
          });
        });

      // Wait until we know tail.js should have restarted `tail`.
      } else if ('MONITOR_RESTART' == message) {
        exec(pgrepTailCmd, [], function(code, stdout, stderr) {
          // Force tail.js to exit.
          var fd = fs.openSync(testcase.path, 'a');
          fs.writeSync(fd, log);
          fs.closeSync(fd);

          tailJs.send('TEST_ENDED');

          test.ok(parseInt(stdout.toString(), 10) > 0);
          test.done();
        });
      }
    });

    tailJs.send('TEST_STARTED');
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
      } else if ('ALL_MONITORS_ENDED' == message) {
        exec(pgrepTailJs, [], function(error) {
         test.strictEqual(error.code, 1); // 'No processes matched.'
          test.done();
        });
      }
    });

    tailJs.send('TEST_STARTED');
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
        size = 100,
        fd = fs.openSync(this.path, 'w'),
        // -t will enable test mode and force exit after 1 line.
        tailJs = fork(tailJsFile, [
          '--quiet',
          '--config', this.configFile,
          '--test', size
        ], {env: process.env});

    _(size).times(function(pos) {
      lines.push(JSON.stringify({path: testcase.path, run: run, pos: pos}) + "\n");
    });

    // Wait until we know tail.js has started watching 'path' to add lines.
    tailJs.on('message', function(message) {
      if ('MONITORS_STARTED' == message) {
        _.each(lines, function(line) {
          fs.writeSync(fd, line);
        });
        fs.closeSync(fd);
      } else if ('TEST_BATCH_ENDED' === message) {
        mongodb.getCollectionCursor(testcase.config.mongodb.collections.event, {run: run}, {}, function(cursor) {
          cursor.count(function(err, count) {
            mongodb.dbClose();
            tailJs.send('TEST_ENDED');
            test.strictEqual(count, lines.length);
            test.done();
          });
        });
      }
    });

    tailJs.send('TEST_STARTED');
  }
};

var sshConfigFile = __dirname + '/../fixtures/tail-config-remote.js';

exports.ssh = {

  setUp: function(callback) {
    this.configFile = sshConfigFile;
    this.config = mainevent.getConfig(this.configFile);
    this.path = this.config.sources[0].path;

    // How long to wait for the remote kill to complete.
    this.remoteKillWait = 500;

    callback();
  },

  testRemoteSource: function(test) {
    var self = this;

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

   tailJs.on('message', function(message) {
     // Wait until we know tail.js has started watching 'path' to add a line.
     if ('MONITORS_STARTED' === message) {
       fs.writeSync(fd, log);
       fs.closeSync(fd);
    } else if ('TEST_BATCH_ENDED' === message) {
      tailJs.send('TEST_ENDED');
       // Verify remote `tail` output was processed.
     } else if ('ALL_MONITORS_ENDED' === message) {
       mongodb.getTimeline({run: run}, function(err, docs) {
         test.strictEqual(docs[0].run, run);
          setTimeout(function() {
            // Verify remote `tail` was killed.
            exec(pgrepTailCmd, [], function(error, stdout) {
              test.strictEqual(error.code, 1); // 'No processes matched.'
              test.done();
            });
          }, self.remoteKillWait);
       });
      }
   });

   tailJs.send('TEST_STARTED');
  }
};

// Remove the SSH/remote test case if it wasn't configured.
if (!fs.existsSync(sshConfigFile)) {
  delete exports.ssh;
}
