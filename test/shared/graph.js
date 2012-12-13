/**
 * Test the shared Graph helper shared client-side and server-side.
 */

'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');

requirejs('moment');
requirejs('helpers/Graph');

  var Graph = mainevent.helpers.Graph;

  exports.graph = {
    setUp: function(done) {
      this.height = 400;
      this.width = 1300;
      done();
    },

    testShouldAdjustSinglePointDataset: function(test) {
      var axes = {xaxis: {}, yaxis: {}},
      data = [["03/28/2012", 35]];

      test.deepEqual(
        {
          xaxis: {
            min: '03/27/2012',
            max: '03/29/2012',
            tickInterval: 14400,
            tickOptions: {formatString: '%H:00\n%m/%d'}
          },
          yaxis: {
            max: 42,
            numberTicks: 14,
            tickInterval: 3,
            min: 0
          }
        },
        Graph.adjustAxes(this.height, this.width, data, axes)
      );
      test.done();
    },

    testShouldAdjustMultiPointDataset: function(test) {
      var axes = {xaxis: {}, yaxis: {}},
      data = [
        ["03/21/2012", 575],
        ["03/25/2012", 1002],
        ["03/26/2012", 2311],
        ["03/28/2012", 4320]
      ];

      test.deepEqual(
        {
          xaxis: {
            min: '03/21/2012',
            max: '03/28/2012',
            tickInterval: 21600,
            tickOptions: {formatString: '%H:00\n%m/%d'}
          },
          yaxis: {
            numberTicks: 14,
            tickInterval: 400,
            max: 5600,
            min: 0
          }
        },
        Graph.adjustAxes(this.height, this.width, data, axes)
      );
      test.done();
    },

    testShouldAddDateUnit: function(test) {
      test.strictEqual('03/12/2012 10:02:01', Graph.addDateUnit('03/12/2012 10:02:00', 1, 'second'));
      test.strictEqual('03/12/2012 10:03:00', Graph.addDateUnit('03/12/2012 10:02:00', 1));
      test.strictEqual('03/12/2012 11:00', Graph.addDateUnit('03/12/2012 10:00', 1));
      test.strictEqual('03/13/2012', Graph.addDateUnit('03/12/2012', 1));
      test.strictEqual('2012-04', Graph.addDateUnit('2012-03', 1));
      test.strictEqual('2013', Graph.addDateUnit('2012', 1));
      test.done();
    },

    testShouldSubtractDateUnit: function(test) {
      test.strictEqual('03/12/2012 10:01:59', Graph.subtractDateUnit('03/12/2012 10:02:00', 1, 'second'));
      test.strictEqual('03/12/2012 10:01:00', Graph.subtractDateUnit('03/12/2012 10:02:00', 1));
      test.strictEqual('03/12/2012 09:00', Graph.subtractDateUnit('03/12/2012 10:00', 1));
      test.strictEqual('03/11/2012', Graph.subtractDateUnit('03/12/2012', 1));
      test.strictEqual('2012-02', Graph.subtractDateUnit('2012-03', 1));
      test.strictEqual('2011', Graph.subtractDateUnit('2012', 1));
      test.done();
    },

    testShouldDetectDateUnit: function(test) {
      test.strictEqual('second', Graph.detectDateUnit('03/12/2012 10:01:05', 'second'));
      test.strictEqual('minute', Graph.detectDateUnit('03/12/2012 10:01:00', 'minute'));
      test.strictEqual('hour', Graph.detectDateUnit('03/12/2012 10:00'));
      test.strictEqual('day', Graph.detectDateUnit('03/12/2012'));
      test.strictEqual('month', Graph.detectDateUnit('2012-03'));
      test.strictEqual('year', Graph.detectDateUnit('2012'));
      test.strictEqual(null, Graph.detectDateUnit('03/12/2012 10'));
      test.done();
    },

    testShouldTrimTrailingZeroesOffDates: function(test) {
      test.strictEqual('03/12/2012 05:00', Graph.trimDate('03/12/2012 05:00'));
      test.strictEqual('03/12/2012 00:05:10', Graph.trimDate('03/12/2012 00:05:10'));
      test.strictEqual('03/12/2012 00:05', Graph.trimDate('03/12/2012 00:05:00'));
      test.strictEqual('03/12/2012 10:00', Graph.trimDate('03/12/2012 10:00:00'));
      test.strictEqual('03/12/2012', Graph.trimDate('03/12/2012 00:00:00'));
      test.done();
    },

    testShouldDerivePartitionSize: function(test) {
      var idealTicks = 25,
      hour = 3600000,
      day = 86400000;
      test.strictEqual(hour / 4, Graph.findBestPartition(idealTicks, day / 6).size);
      test.strictEqual(hour / 2, Graph.findBestPartition(idealTicks, day / 2).size);
      test.strictEqual(hour, Graph.findBestPartition(idealTicks, day).size);
      test.strictEqual(2 * hour, Graph.findBestPartition(idealTicks, 2 * day).size);
      test.strictEqual(6 * hour, Graph.findBestPartition(idealTicks, 7 * day).size);
      test.strictEqual(8 * hour, Graph.findBestPartition(idealTicks, 10 * day).size);
      test.strictEqual(12 * hour, Graph.findBestPartition(idealTicks, 14 * day).size);
      test.strictEqual(day, Graph.findBestPartition(idealTicks, 24 * day).size);
      test.strictEqual(7 * day, Graph.findBestPartition(idealTicks, 48 * day).size);
      test.done();
    }
  };
