#!/usr/bin/env node

/**
 * Build dashboard data.
 */

'use strict';

require(__dirname + '/modules/diana.js');
var date = diana.shared.Date,
    now = (new Date()).getTime(),
    job = '';

/**
 * Total events grouped by time intervals, ex. per hour.
 */
job = diana.requireJob('count_all_graph').run;
diana.shared.Async.runOrdered(
  // Use the same intervals as available in the UI drop-downs.
  _.values(date.presetTimeIntervals),
  function(interval, onIntervalDone) {
    job(now - interval, now, date.bestFitInterval(interval), {}, function(err, results) {
      onIntervalDone();
    }, interval);
  }
);
