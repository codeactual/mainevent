#!/usr/bin/env node

/**
 * Build dashboard data.
 */

'use strict';

require(__dirname + '/modules/diana.js');

var date = diana.shared.Date,
    now = (new Date()).getTime(),
    job = '',
    parsers = diana.requireModule('parsers/parsers').getConfiguredParsers();

parsers.push(''); // Collect all-parser counts.

/**
 * Total events grouped by time intervals, ex. per hour.
 */
job = diana.requireJob('count_all_graph').run;
diana.shared.Async.runOrdered(
  parsers,
  function(parser, onParserDone) {
    diana.shared.Async.runOrdered(
      // Use the same intervals as available in the UI drop-downs.
      _.values(date.presetTimeIntervals),
      function(interval, onIntervalDone) {
        var bestFitInterval = date.bestFitInterval(interval),
            jobNameSuffix = (parser ? parser + '_' : '') + interval,
            query = {};

        if (parser) {
          query.parser = parser;
        }

        job(now - interval, now, bestFitInterval, query, function(err, results) {
          onIntervalDone();
        }, jobNameSuffix);
      },
      null,
      onParserDone
    );
  }
);
