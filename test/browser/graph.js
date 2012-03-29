require(['helpers/Graph'], function() {
  var Graph = diana.helpers.Graph;

  YUI({useBrowserConsole: true}).use('test', function(Y) {
    var suite = new Y.Test.Suite("Graph Data");
    suite.add(
      new Y.Test.Case({
        'name': 'placeholder',
        'should assert placeholder': function() {
          Y.Assert.areEqual('asdf', Graph.asdf());
        }
      })
    );
    Y.Test.Runner.add(suite);
    Y.Test.Runner.run();
  });
});
