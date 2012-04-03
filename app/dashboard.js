#!/usr/bin/env node

/**
 * Build dashboard data.
 */

'use strict';

require(__dirname + '/modules/diana.js');

var date = diana.shared.Date,
    now = (new Date()).getTime(),
    parsers = diana.requireModule('parsers/parsers'),
    redis = diana.requireModule('redis').createInstance();

/**
 * Total events grouped by time intervals, ex. per hour.
 */
(function() {
  var jobName = 'count_all_graph',
      jobWait = 60000,
      job = new (diana.requireJob(jobName).getClass()),
      parserNames = parsers.getConfiguredParsers();

  // 'Any Parser' permutations.
  parserNames.push('');

  var runJob = function() {
    // Walk through parserNames sequentially.
   diana.shared.Async.runOrdered(
      parserNames,
      function(parser, onParserDone) {
        // For each parser, walk through the same intervals as available in
        // the UI drop-downs.
        diana.shared.Async.runOrdered(
          _.values(date.presetTimeIntervals),
          // For each interval, run the map/reduce job if the related cache
          // entry has expired.
          function(interval, onIntervalDone) {
            var bestFitInterval = date.bestFitInterval(interval),
                jobNameSuffix = _.filterTruthy([parser, interval]).join('_'),
                cacheKey = _.filterTruthy([jobName, jobNameSuffix]).join('_'),
                partition = date.partitions[bestFitInterval],
                // Expire a 1 hour interval in 1 minute,
                // expire a 1 day interval in 1 hour, etc.
                expires = Math.max(60, date.unitToMilli(1, partition) / 1000),
                // Prevent gaps where 60s-volatile data expires before its job finishes.
                expiresGrace = (jobWait / 1000) * 0.5;

            redis.getWithWriteThrough(
              cacheKey,
              // Cache miss, run the job.
              function(key, callback) {
                var query = {
                  interval: partition,
                  'time-gte': now - interval,
                  'time-lte': now,
                };

                if (parser) {
                  query.parser = parser;
                }

                job.updateOptions({suffix: jobNameSuffix});

                job.run(query, function(err, results) {
                  callback(err, results);
                });
              },
              expires + expiresGrace,
              // Cache hit or job completed, process next interval.
              function(err, results) {
                onIntervalDone();
              },
              true // Don't auto-close connection.
            );
          },
          null,
          onParserDone
        );
      },
      null,
      function() {
        redis.end();
        setTimeout(runJob, jobWait);
      }
    );
  };

  runJob();
})();
