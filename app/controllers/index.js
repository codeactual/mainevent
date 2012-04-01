define([], function() {

  'use strict';

  return function(req, res) {
    var config = diana.getConfig(),
        parsers = diana.requireModule('parsers/parsers'),
        parserNames = parsers.getConfiguredParsers();

    // Serve the backbone.js MVC app.
    res.render('index.html', {
      // Injected into global client-side 'diana' object.
      parsers: JSON.stringify(parserNames),
      maxResultSize: config.mongodb.maxResultSize
    });
  };
});
