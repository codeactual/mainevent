var testutil = require(__dirname + '/../../testutil.js');

exports.Php = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testPhpNotice: function(test) {
    testutil.assertParseValid(
      test,
      '[14-Feb-2012 06:38:38 UTC] PHP Notice:  Undefined variable: b in /tmp/errormaker.php on line 2',
      'Php',
      {
        time: '14-Feb-2012 06:38:38 UTC',
        level: 'Notice',
        message: 'Undefined variable: b',
        file: '/tmp/errormaker.php',
        line: '2',
        parser_subtype: 'BuiltIn'
      }
    );
    test.done();
  },

  testPhpUserDefined: function(test) {
    testutil.assertParseValid(
      test,
      '[14-Feb-2012 06:38:38 UTC] something terrible happened',
      'Php',
      {
        time: '14-Feb-2012 06:38:38 UTC',
        message: 'something terrible happened',
        parser_subtype: 'UserDefined'
      }
    );
    test.done();
  },

  testGetPreviewFromTemplate: function(test) {
    // Example row from DB.
    var logs = [{
      parser: 'Php',
      parser_subtype: 'userdef',
      time: 'Tue Feb 21 10:44:23 UTC',
      message: 'foo'
    }];

    var expected = _.clone(logs);
    expected[0].preview = 'foo';

    test.expect(5);
    testutil.parsers.addPreviewContext(logs, function(actual) {
      _.each(_.keys(expected[0]), function(key) {
        test.equal(actual[0][key], expected[0][key]);
      });
      test.done();
    });
  },

  testExtractTime: function(test) {
    var parser = testutil.parsers.createInstance('Php'),
        date = '12-Mar-2012 09:03:31 UTC';
    test.equal(parser.extractTime(date), 1331543011000);
    test.done();
  }
};
