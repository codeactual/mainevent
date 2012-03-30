define([], function() {

  'use strict';

  return function(req, res) {
    var storage = diana.requireModule('storage/storage').createInstance();

    if ('time' == req.query['sort-attr'] && 'desc' == req.query['sort-dir']) {
      res.setHeader('Cache-Control: no-store, no-cache, must-revalidate');
    }

    _.each(req.query, function(value, key) {
      req.query[key] = decodeURIComponent(value);
    });

    storage.getTimeline(req.query, function(err, docs, info) {
      if (err) {
        res.send({__error: err}, 500);
      } else if (docs.length) {
        // Augment each document object with preview text for the view table.
        diana.requireModule('parsers/parsers').addPreviewContext(docs, function(updated) {
          res.send({info: info, results: updated});
        });
      } else {
        res.send({info: info, results: []});
      }
    });
  };
});
