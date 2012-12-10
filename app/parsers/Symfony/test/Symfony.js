var testutil = require(__dirname + '/../../testutil.js');

exports.Symfony = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testParseEvent: function(test) {
    testutil.assertParseValid(
      test,
      '[2012-02-12 09:03:31] event.DEBUG: Notified event "kernel.response" to listener "Symfony\Bundle\SecurityBundle\EventListener\ResponseListener::onKernelResponse". [] []',
      'Symfony',
      {
        time: '2012-02-12 09:03:31',
        type: 'event',
        level: 'DEBUG',
        event: 'kernel.response',
        listener: 'Symfony\Bundle\SecurityBundle\EventListener\ResponseListener::onKernelResponse',
       parser_subtype: 'event'
      }
    );
    test.done();
  },

  testParseUncaughtException: function(test) {
    testutil.assertParseValid(
      test,
      '[2012-02-10 10:24:17] request.CRITICAL: Twig_Error_Runtime: Variable "rows" does not exist in "MaineventTimelineBundle:Default:index.html.twig" at line 4 (uncaught exception) at /var/dev/mainevent/app/cache/dev/classes.php line 8024 [] []',
      'Symfony',
      {
        time: '2012-02-10 10:24:17',
        type: 'request',
        level: 'CRITICAL',
        class: 'Twig_Error_Runtime',
        message: 'Variable "rows" does not exist in "MaineventTimelineBundle:Default:index.html.twig" at line 4 (uncaught exception)',
        file: '/var/dev/mainevent/app/cache/dev/classes.php',
        line: '8024',
        parser_subtype: 'uncaught_exception'
      }
    );
    test.done();
  },

  testExtractTime: function(test) {
    var parser = testutil.parsers.createInstance('Symfony'),
        log = {time: '2012-03-12 09:03:31 UTC'};
    test.equal(parser.extractTime(log), 1331543011000);
    test.done();
  },
};
