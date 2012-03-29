require(['helpers/Graph'], function() {
  var Graph = diana.helpers.Graph;

  YUI({useBrowserConsole: true}).use('test', function(Y) {
    var suite = new Y.Test.Suite("Graph Data");
    suite.add(
      new Y.Test.Case({
        'name': 'Utils',

        'should zoom in on single-point data set': function() {
          var data = [["03/28/2012", 35]],
              axes = {xaxis: {}, yaxis: {}};
          areDeepEqual(
            {
              xaxis: {
                min: '03/27/2012',
                max: '03/29/2012',
                tickInterval: '1 day'
              },
              yaxis: {
                min: 0,
                max: 52.5
              }
            },
            Graph.adjustAxes(data, axes)
          );
        },

        'should add date unit': function() {
          Y.Assert.areEqual('03/12/2012 10:03:00', Graph.addDateUnit('03/12/2012 10:02:00', 1));
          Y.Assert.areEqual('03/12/2012 11:00', Graph.addDateUnit('03/12/2012 10:00', 1));
          Y.Assert.areEqual('03/13/2012', Graph.addDateUnit('03/12/2012', 1));
          Y.Assert.areEqual('2012-04', Graph.addDateUnit('2012-03', 1));
          Y.Assert.areEqual('2013', Graph.addDateUnit('2012', 1));
        },

        'should subtract date unit': function() {
          Y.Assert.areEqual('03/12/2012 10:01:00', Graph.subtractDateUnit('03/12/2012 10:02:00', 1));
          Y.Assert.areEqual('03/12/2012 09:00', Graph.subtractDateUnit('03/12/2012 10:00', 1));
          Y.Assert.areEqual('03/11/2012', Graph.subtractDateUnit('03/12/2012', 1));
          Y.Assert.areEqual('2012-02', Graph.subtractDateUnit('2012-03', 1));
          Y.Assert.areEqual('2011', Graph.subtractDateUnit('2012', 1));
        },

        'should detect date unit': function() {
          Y.Assert.areEqual('minute', Graph.detectDateUnit('03/12/2012 10:01:00'));
          Y.Assert.areEqual('hour', Graph.detectDateUnit('03/12/2012 10:00'));
          Y.Assert.areEqual('day', Graph.detectDateUnit('03/12/2012'));
          Y.Assert.areEqual('month', Graph.detectDateUnit('2012-03'));
          Y.Assert.areEqual('year', Graph.detectDateUnit('2012'));
          Y.Assert.areEqual(null, Graph.detectDateUnit('03/12/2012 10'));
        }
      })
    );
    Y.Test.Runner.add(suite);
    Y.Test.Runner.run();
  });
});
