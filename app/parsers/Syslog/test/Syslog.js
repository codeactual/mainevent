var testutil = require(__dirname + '/../../testutil.js');

exports.Syslog = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testSyslog: function(test) {
    testutil.assertParseValid(
      test,
      'Mar  5 21:36:00 mainevent kernel: [186333.803057] HDMI hot plug event: Pin=3 Presence_Detect=0 ELD_Valid=1',
      'Syslog',
      {
        time: 'Mar  5 21:36:00',
        host: 'mainevent',
        ident: 'kernel',
        pid: null,
        message: '[186333.803057] HDMI hot plug event: Pin=3 Presence_Detect=0 ELD_Valid=1'
      }
    );
    test.done();
  },

  testExtractTimeFromCurrentYear: function(test) {
    var parser = testutil.parsers.createInstance('Syslog'),
        date = 'Mar  12 09:03:31',
        now = new Date('3/13/2012 00:00:00');
    test.equal(parser.extractTime(date, now), 1331543011000);
    test.done();
  },

  testExtractTimeFromPriorYear: function(test) {
    var parser = testutil.parsers.createInstance('Syslog'),
        date = 'Dec  31 23:03:31',
        now = new Date('1/01/2012 00:00:00');
    test.equal(parser.extractTime(date, now), 1325372611000);
    test.done();
  }
};
