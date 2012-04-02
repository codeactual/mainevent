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
      job = diana.requireJob(jobName),
      parserNames = parsers.getConfiguredParsers();

  parserNames.push(''); // Collect all-parser counts.

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
              jobNameSuffix = (parser ? parser + '_' : '') + interval,
              cacheKey = jobName + '_' + jobNameSuffix,
              partition = date.partitions[bestFitInterval],
              // Expire a 1 hour interval in 1 minute,
              // expire a 1 day interval in 1 hour, etc.
              expires = Math.max(60, date.unitToMilli(1, partition) / 1000);

          redis.getWithWriteThrough(
            cacheKey,
            // Cache miss, run the job.
            function(key, callback) {
              var options = {
                  startTime: now - interval,
                  endTime: now,
                  interval: partition,
                  query: query,
                  suffix: jobNameSuffix
                },
                query = {};

              if (parser) {
                query.parser = parser;
              }

              job.run(options, function(err, results) {
                callback(err, results);
              });
            },
            expires,
            // Cache hit or job completed, process next interval.
            function(err, results) {
              onIntervalDone();
            }
          );
        },
        null,
        onParserDone
      );
    },
    null,
    function() {
      redis.end();
    }
  );


  var writeThrough = function(key, callback) {
  };
})();
