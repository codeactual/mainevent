require(['helpers/Graph'], function() {
  var Graph = mainevent.helpers.Graph;

  YUI({useBrowserConsole: true}).use('test', function(Y) {
    var suite = new Y.Test.Suite("Graph Data");
    suite.add(
      new Y.Test.Case({
        setUp: function() {
          this.height = 400;
          this.width = 1300;
        },

        name: 'Utils',

        'should adjust single-point data set': function() {
          var axes = {xaxis: {}, yaxis: {}},
              data = [["03/28/2012", 35]];

          areDeepEqual(
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
        },

        'should adjust multi-point data set': function() {
          var axes = {xaxis: {}, yaxis: {}},
              data = [
                ["03/21/2012", 575],
                ["03/25/2012", 1002],
                ["03/26/2012", 2311],
                ["03/28/2012", 4320]
              ];

          areDeepEqual(
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
        },

        'should add date unit': function() {
          Y.Assert.areEqual('03/12/2012 10:02:01', Graph.addDateUnit('03/12/2012 10:02:00', 1, 'second'));
          Y.Assert.areEqual('03/12/2012 10:03:00', Graph.addDateUnit('03/12/2012 10:02:00', 1));
          Y.Assert.areEqual('03/12/2012 11:00', Graph.addDateUnit('03/12/2012 10:00', 1));
          Y.Assert.areEqual('03/13/2012', Graph.addDateUnit('03/12/2012', 1));
          Y.Assert.areEqual('2012-04', Graph.addDateUnit('2012-03', 1));
          Y.Assert.areEqual('2013', Graph.addDateUnit('2012', 1));
        },

        'should subtract date unit': function() {
          Y.Assert.areEqual('03/12/2012 10:01:59', Graph.subtractDateUnit('03/12/2012 10:02:00', 1, 'second'));
          Y.Assert.areEqual('03/12/2012 10:01:00', Graph.subtractDateUnit('03/12/2012 10:02:00', 1));
          Y.Assert.areEqual('03/12/2012 09:00', Graph.subtractDateUnit('03/12/2012 10:00', 1));
          Y.Assert.areEqual('03/11/2012', Graph.subtractDateUnit('03/12/2012', 1));
          Y.Assert.areEqual('2012-02', Graph.subtractDateUnit('2012-03', 1));
          Y.Assert.areEqual('2011', Graph.subtractDateUnit('2012', 1));
        },

        'should detect date unit': function() {
          Y.Assert.areEqual('second', Graph.detectDateUnit('03/12/2012 10:01:05', 'second'));
          Y.Assert.areEqual('minute', Graph.detectDateUnit('03/12/2012 10:01:00', 'minute'));
          Y.Assert.areEqual('hour', Graph.detectDateUnit('03/12/2012 10:00'));
          Y.Assert.areEqual('day', Graph.detectDateUnit('03/12/2012'));
          Y.Assert.areEqual('month', Graph.detectDateUnit('2012-03'));
          Y.Assert.areEqual('year', Graph.detectDateUnit('2012'));
          Y.Assert.areEqual(null, Graph.detectDateUnit('03/12/2012 10'));
        },

        'should trim trailing zeros off dates': function() {
          Y.Assert.areEqual('03/12/2012 05:00', Graph.trimDate('03/12/2012 05:00'));
          Y.Assert.areEqual('03/12/2012 00:05:10', Graph.trimDate('03/12/2012 00:05:10'));
          Y.Assert.areEqual('03/12/2012 00:05', Graph.trimDate('03/12/2012 00:05:00'));
          Y.Assert.areEqual('03/12/2012 10:00', Graph.trimDate('03/12/2012 10:00:00'));
          Y.Assert.areEqual('03/12/2012', Graph.trimDate('03/12/2012 00:00:00'));
        },

        'should derive partition size from span and ideal ticks': function() {
          var idealTicks = 25,
              hour = 3600000,
              day = 86400000;
          Y.Assert.areEqual(hour / 4, Graph.findBestPartition(idealTicks, day / 6).size);
          Y.Assert.areEqual(hour / 2, Graph.findBestPartition(idealTicks, day / 2).size);
          Y.Assert.areEqual(hour, Graph.findBestPartition(idealTicks, day).size);
          Y.Assert.areEqual(2 * hour, Graph.findBestPartition(idealTicks, 2 * day).size);
          Y.Assert.areEqual(6 * hour, Graph.findBestPartition(idealTicks, 7 * day).size);
          Y.Assert.areEqual(8 * hour, Graph.findBestPartition(idealTicks, 10 * day).size);
          Y.Assert.areEqual(12 * hour, Graph.findBestPartition(idealTicks, 14 * day).size);
          Y.Assert.areEqual(day, Graph.findBestPartition(idealTicks, 24 * day).size);
          Y.Assert.areEqual(7 * day, Graph.findBestPartition(idealTicks, 48 * day).size);
        },
      })
    );
    Y.Test.Runner.add(suite);
    Y.Test.Runner.run();
  });
});
