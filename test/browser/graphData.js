YUI({useBrowserConsole: true}).use('test', function(Y) {
  var suite = new Y.Test.Suite("Graph Data");
  suite.add(
    new Y.Test.Case({
      'name': 'placeholder',
      'should assert placeholder': function() {
        Y.Assert.areEqual(1, 1);
      }
    })
  );
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();
});
