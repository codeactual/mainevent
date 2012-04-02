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

  diana.shared.Async.runOrdered(
    parserNames,
    function(parser, onParserDone) {
      diana.shared.Async.runOrdered(
        // Use the same intervals as available in the UI drop-downs.
        _.values(date.presetTimeIntervals),
        function(interval, onIntervalDone) {
          var bestFitInterval = date.bestFitInterval(interval),
              jobNameSuffix = (parser ? parser + '_' : '') + interval,
              partition = date.partitions[bestFitInterval],
              query = {};

          if (parser) {
            query.parser = parser;
          }

          var options = {
            startTime: now - interval,
            endTime: now,
            interval: partition,
            query: query,
            suffix: jobNameSuffix
          };
          job.run(options, function(err, results) {
            var expires = job.getCacheExpires(options);
            redis.set(jobName + '_' + jobNameSuffix, results, expires, function(err) {
              onIntervalDone();
            });
          });
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
})();
