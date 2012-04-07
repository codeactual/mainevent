#!/usr/bin/env node

/**
 * Total events grouped by time intervals, ex. per hour.
 */

'use strict';

var program = require('commander');
program
  .option('-l, --limit <#>', 'Limit chunk size per run', Number, 100)
  .option('-i, --id <hex>', 'Last ID processed')
  .option('-w, --wait <seconds>', 'Run repeatedly after waiting between cycles', Number)
  .option('-i, --interval <milliseconds>', 'Only process a specific interval', Number)
  .option('-p, --parser <name>', 'Only process a specific parser', null)
  .option('-q, --quiet')
  .option('-v, --verbose')
  .parse(process.argv);

require(__dirname + '/../modules/diana.js');

var date = diana.shared.Date,
    cycleStart = null,
    endGraceful = false,

    jobName = 'CountAllPartitioned',
    job = new (diana.requireJob(jobName).getClass()),
    namespace = 'graph:' + jobName,
    log = diana.createUtilogger(jobName, program.quiet),

    redis = diana.requireModule('redis').createInstance(),
    SortedHashSet = diana.requireModule('redis/SortedHashSet').getClass(),

    lastIdKey = namespace + ':lastId', // Holds last document ID processed.
    bulk = true;

// Narrow the job permutations to specific parser/interval.
if (program.parser) {
  var parserNames = [program.parser];
} else {
  var parserNames = diana.requireModule('parsers/parsers').getConfiguredParsers();
}
if (program.interval) {
  var intervals = [program.interval];
} else {
  var intervals = _.values(date.presetTimeIntervals);
}

// Start after a manually set last ID.
if (program.id) {
    run(program.id);

// Start after the recorded last ID, if possible.
} else {
  redis.get(lastIdKey, function(err, lastId) {
    if (err) {
      log('could not read last ID: %s', err);
      process.exit(1);
    }

    run(lastId);
  });
}

/**
 * @param lastId {String} Job will query documents which were inserted after this ID.
 * - If falsey, the job will start at the first inserted ID.
 */
var run = function(lastId) {
  if (program.verbose) {
    if (lastId) {
      log('starting after last ID: %s', lastId);
    } else {
      log('starting from the first event');
    }
  }

  cycleStart = (new Date()).getTime();

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

  // Track the last ID processed by the script. Store at the end of each cycle.
  var newLastId = null;

  // For each parser, walk through the same intervals as available in
  // the UI drop-downs.
  diana.shared.Async.runOrdered(
    parserNames,

    function(parser, onParserDone) {

      // For each interval, run the map/reduce job if the related cache
      // entry has expired.
      diana.shared.Async.runOrdered(
        intervals,

        function(interval, onIntervalDone) {

          if (program.verbose) {
            log('started run with parser %s, interval %d', parser, interval);
          }

          // Ex. graph:CountAllPartitioned:json:3600000
          var sortedSetKey = util.format('%s:%s:%d', namespace, parser, interval),
              runStart = (new Date()).getTime(),
              query = {parser: parser};

          // Start at the first inserted event or after the last one processed.
          if (lastId) {
            query._id = {$gt: lastId};
          }

          // Ex. suffixes: 'json', 'json_3600000'
          job.updateOptions({
            suffix: _.filterTruthy([parser, interval]).join('_'),
            partition: date.partitions[date.bestFitInterval(interval)]
          });

          // Sort ascending to allow 'lastId' to follow insertion order.
          job.updateMapReduceConfig({sort: {_id: 1}, limit: program.limit});

          job.run(query, function(err, results, stats) {
            var changes = {};

            // Collect the changeset for upsert().
            _.each(results, function(result, key) {

              // Ex. 'graph:CountAllPartitioned:json:3600000:result:2012-02'
              var member = sortedSetKey + ':result:' + key,
                  score = (new Date(key)).getTime();

              if (program.verbose) {
                log('key=%s result=%s score=%d member=%s', key, result, score, member);
              }

              // If the partition already exists, the new count is added to the old.
              // Otherwise the count stored directly.
              changes[member] = {hashFields: result, score: score};

              // Track last ID processed.
              newLastId = result._id;
            });

            // Insert totals for new partitions, increment totals for existing.
            (new SortedHashSet(redis)).upsert(sortedSetKey, changes, incrCount, function(err) {
              if (err) {
                log('upsert failed on key %s, changes: %s', sortedSetKey, changes);
              }

              if (program.verbose) {
                log('run took %d seconds', ((new Date()).getTime() - runStart) / 1000);
              }

              onIntervalDone();
            }, bulk);
          });
        },
        onParserDone
      );
    },

    // All parser/interval permutations have been processed.
    function() {
      // Save the last processed document ID so the next run can start after it.
      var pairs = {};
      pairs[lastIdKey] = newLastId;
      redis.set(pairs, null, function(err, replies) {
        if (err) {
          log('could not write last ID: %s', err);
        }
        if (program.verbose) {
          log('cycle ended with ID: %s', newLastId);
          log('cycle took %d seconds', ((new Date()).getTime() - cycleStart) / 1000);
        }

        if (endGraceful) {
          log('next cycle cancelled due to exit signal');
        } else if (program.wait) {  // Start another cycle.
          log('waiting %d seconds until next cycle', program.wait);
          setTimeout(function() {
            run(newLastId);
          }, program.wait * 1000);
        }
      });
    }
  );
};

process.on('SIGINT', function() {
  log('SIGINT received');
  endGraceful = true;
});
process.on('SIGTERM', function() {
  log('SIGINT received');
  endGraceful = true;
});
