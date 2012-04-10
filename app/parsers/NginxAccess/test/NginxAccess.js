var testutil = require(__dirname + '/../../testutil.js');

exports.NginxAccess = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testNginxAccess: function(test) {
    testutil.assertParseValid(
      test,
      '127.0.0.1 - www [12/Feb/2012:09:03:31 +0000] "GET /timeline HTTP/1.1" 502 166 "http://www.referer.com/" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0"',
      'NginxAccess',
      {
        host: '127.0.0.1',
        user: 'www',
        time: '12/Feb/2012:09:03:31 +0000',
        method: 'GET',
        path: '/timeline',
        code: '502',
        size: '166',
        referer: 'http://www.referer.com/',
        agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
      }
    );
    test.done();
  },

  testExtractTime: function(test) {
    var parser = testutil.parsers.createInstance('NginxAccess'),
        log = {time: '12/Mar/2012:09:03:31 +0000'};
    test.equal(parser.extractTime(log), 1331543011000);
    test.done();
  }
};
