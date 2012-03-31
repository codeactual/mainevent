#!/usr/bin/env node

/**
 * Build dashboard data.
 */

'use strict';

require(__dirname + '/modules/diana.js');

var date = diana.shared.Date,
    now = (new Date()).getTime(),
    parsers = diana.requireModule('parsers/parsers');

/**
 * Total events grouped by time intervals, ex. per hour.
 */
(function() {
  var job = diana.requireJob('count_all_graph').run,
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
          job(options, function(err, results) {
            onIntervalDone();
          });
        },
        null,
        onParserDone
      );
    }
  );
})();
