define([], function() {

  'use strict';

  return function(req, res) {
    var config = mainevent.getConfig(),
        parsers = mainevent.requireModule('parsers'),
        parserNames = Object.keys(parsers.getConfiguredParsers());

    // Serve the backbone.js MVC app.
    res.render('index.html', {
      // Injected into global client-side 'mainevent' object.
      parsers: JSON.stringify(parserNames),
      maxResultSize: config.mongodb.maxResultSize
    });
  };
});
