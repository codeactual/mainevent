#!/usr/bin/env node

/**
 * Total events grouped by time intervals, ex. per hour.
 */

'use strict';

var program = require('commander');
program
  .option('-l, --limit <#>', 'Limit chunk size per run (default 100)', Number, 100)
  .option('-i, --id <hex>', 'Last ID processed')
  .option('-w, --jobWait <seconds>', 'Wait time between jobs (default 5)', Number, 5)
  .option('-W, --chunkWait <seconds>', 'Wait time between chunks (default 5)', Number, 5)
  .option('-i, --interval <milliseconds>', 'Only process a specific interval', Number)
  .option('-p, --parser <name>', 'Only process a specific parser', null)
  .option('-q, --quiet')
  .option('-v, --verbose')
  .option('-V, --vverbose')
  .parse(process.argv);

require(__dirname + '/../modules/mainevent.js');

var date = mainevent.shared.Date,
    chunkStart = null,
    chunkLastIds = [],
    exitGraceful = false,
    exitGracefulMessage = '%s received, will exit after current chunk',
    exitSleepingMessage = '%s received, exiting from sleep',
    sleeping = false,

    jobName = 'CountAllPartitioned',
    job = new (mainevent.requireJob(jobName).getClass())('graph'),
    log = job.createUtilLogger(program.quiet),

    mongodb = mainevent.requireModule('mongodb').createInstance(),
    redis = mainevent.requireModule('redis').createInstance(),
    SortedHashSet = mainevent.requireModule('redis/SortedHashSet').getClass(),

    lastIdKey = job.buildLastIdKey(),
    bulk = true;

// Narrow the job permutations to specific parser/interval.
if (program.parser) {
  var parserNames = [program.parser];
} else {
  var parserNames = Object.keys(mainevent.requireModule('parsers').getConfiguredParsers());
}
if (program.interval) {
  var intervals = [program.interval];
} else {
  var intervals = _.values(date.presetTimeIntervals);
}

program.verbose = program.verbose || program.vverbose;

// Start after a manually set last ID.
if (program.id) {
    runJob(program.id);

// Start after the recorded last ID, if possible.
} else {
  redis.get(lastIdKey, function(err, lastId) {
    if (err) {
      log('could not read last ID: %s', err);
      process.exit(1);
    }

    runJob(lastId);
  });
}

/**
 * @param lastId {String} Job will query documents which were inserted after this ID.
 * - If falsey, the job will start at the first inserted ID.
 */
var runJob = function(lastId) {
  if (program.verbose) {
    if (lastId) {
      log('starting after last ID: %s', lastId);
    } else {
      log('starting from the first event');
    }
  }

  chunkLastIds = [];  // Last IDs processed by all jobs within a chunk.
  chunkStart = (new Date()).getTime();

  /**
   * Increment the existing 'count' value by the updated hash's 'count' value.
   *
   * - Used below for SortedHashSet.upsert().
   */
  var incrCount = function(existing, updates, redis, onDone) {
    redis.hincrby(updates, function(err, replies) {
      onDone(err);
    });
  };

  // For each parser, walk through the same intervals as available in
  // the UI drop-downs.
  mainevent.shared.Async.runSync(
    parserNames,

    function(parser, onParserDone) {

      // For each interval, run the map/reduce job if the related cache
      // entry has expired.
      mainevent.shared.Async.runSync(
        intervals,

        function(interval, onIntervalDone) {

          if (program.verbose) {
            log('started job with parser %s, interval %d', parser, interval);
          }

          // Ex. graph:CountAllPartitioned:Json:3600000
          var jobStart = (new Date()).getTime(),
              query = {parser: parser},
              jobLastId = null;

          // Start at the first inserted event or after the last one processed.
          if (lastId) {
            query._id = {$gt: lastId};
          }

          job.updateOptions({
            // Ex. 'Json', 'Json_3600000'
            suffix: _.compact([parser, interval]).join('_'),
            // Ex. 'hour'
            partition: date.partitions[date.bestFitInterval(interval)],
          });
          job.updateKeyFields({parser: parser});

          var sortedSetKey = job.buildSortedSetKey();

          job.updateMapReduceConfig({
            // Sort ascending to allow 'lastId' to follow insertion order.
            sort: {_id: 1},
            // Enforce chunk size.
            limit: program.limit
          });

          job.run(query, function(err, results, stats) {
            var changes = {};

            // Collect the changeset for upsert().
            _.each(results, function(result, key) {

              // Ex. 'graph:CountAllPartitioned:Json:3600000:result:2012-02'
              var member = job.buildHashKey(key),
                  score = (new Date(key)).getTime();

              if (program.vverbose) {
                log('key=%s result=%s score=%d member=%s', key, result, score, member);
              }

              // If the partition already exists, the new count is added to the old.
              // Otherwise the count stored directly.
              changes[member] = {hashFields: result, score: score};

              // Track last ID processed.
              jobLastId = result._id;
            });

            if (!_.size(changes)) {
              if (program.verbose) {
                log('no job results');
              };
              onIntervalDone();
              return;
            }

            // Insert totals for new partitions, increment totals for existing.
            (new SortedHashSet(redis)).upsert(sortedSetKey, changes, incrCount, function(err) {
              if (err) {
                log('upsert failed on key %s, changes: %s', sortedSetKey, changes);
              }

              if (program.verbose) {
                log('job took %d seconds', ((new Date()).getTime() - jobStart) / 1000);
                log('waiting %d seconds until starting next job', program.jobWait)
              }

              chunkLastIds.push(jobLastId);

              setTimeout(onIntervalDone, program.jobWait * 1000);
            }, bulk);
          });
        },
        onParserDone
      );
    },

    // All parser/interval permutations have been processed.
    function() {

      // Find the last inserted ID seen in the chunk.
      if (chunkLastIds.length) {
        var chunkLastId = chunkLastIds.sort(mongodb.sortObjectIdAsc).pop();
      // No results from chunk -- keep old cursor.
      } else {
        chunkLastId = lastId;
      }

      if (lastId == chunkLastId) {
        if (program.verbose) {
          log('last event reached');
        }
        if (exitGraceful) {
          log('next chunk cancelled due to exit signal');
          return;
        } else {
          if (program.verbose) {
            log('sleeping for 60 seconds');
          }

          setTimeout(function() {
            sleeping = false;
            runJob(chunkLastId);
          }, 60000);

          sleeping = true;
          return;
        }
      }

      // Save the last processed document ID so the next chunk can start after it.
      var pairs = {};
      pairs[lastIdKey] = chunkLastId;

      redis.set(pairs, null, function(err, replies) {
        if (err) {
          log('exiting to prevent dupes, could not write last ID %s: %s', chunkLastId, err);
          process.exit();
        }
        if (program.verbose) {
          log('chunk ended with ID: %s', chunkLastId);
          log('chunk took %d seconds', ((new Date()).getTime() - chunkStart) / 1000);
        }

        if (exitGraceful) {
          log('next chunk cancelled due to exit signal');
        } else if (program.chunkWait) {  // Start another chunk.
          log('waiting %d seconds until next chunk', program.chunkWait);
          setTimeout(function() {
            runJob(chunkLastId);
          }, program.chunkWait * 1000);
        }
      });
    }
  );
};

process.on('SIGINT', function() {
  if (sleeping) {
    log(exitSleepingMessage, 'SIGINT');
    process.exit();
  }
  log(exitGracefulMessage, 'SIGINT');
  exitGraceful = true;
});
process.on('SIGTERM', function() {
  if (sleeping) {
    log(exitSleepingMessage, 'SIGTERM');
    process.exit();
  }
  log(exitGracefulMessage, 'SIGTERM');
  exitGraceful = true;
});
