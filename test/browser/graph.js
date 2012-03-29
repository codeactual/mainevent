require(['helpers/Graph'], function() {
  var Graph = diana.helpers.Graph;

  YUI({useBrowserConsole: true}).use('test', function(Y) {
    var suite = new Y.Test.Suite("Graph Data");
    suite.add(
      new Y.Test.Case({
        'name': 'Utils',
        'should detect date interval': function() {
          Y.Assert.areEqual('minute', Graph.detectDateInterval('03/12/2012 10:01:00'));
          Y.Assert.areEqual('hour', Graph.detectDateInterval('03/12/2012 10:00'));
          Y.Assert.areEqual('day', Graph.detectDateInterval('03/12/2012'));
          Y.Assert.areEqual('month', Graph.detectDateInterval('2012-03'));
          Y.Assert.areEqual('year', Graph.detectDateInterval('2012'));
          Y.Assert.areEqual(null, Graph.detectDateInterval('03/12/2012 10'));
        }
      })
    );
    Y.Test.Runner.add(suite);
    Y.Test.Runner.run();
  });
});
