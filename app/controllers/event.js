define([], function() {

  'use strict';

  return function(req, res) {
    var parsers = mainevent.requireModule('parsers'),
        send404 = function() {
          res.send({__error: 'Event not found.'}, 404);
        },
        mongodb = mainevent.requireModule('mongodb').createInstance();

    if (!req.params.id.match(/^[a-z0-9]{24}$/)) {
      send404();
    }

    mongodb.getLog(req.params.id, function(err, doc) {
      if (err) {
        res.send({__error: err}, 500);
        return;
      }

      if (!doc) {
        send404();
        return;
      }

      if ('Json' == doc.parser) {
        var list = [];
        _.each(doc, function(value, key) {
          list.push({key: key, value: value});
        });
        res.send({__list: list, parser: doc.parser});
      } else {
        doc = parsers.createInstance(doc.parser).decorateFullContext(doc);
        res.send(doc);
      }
    });
  };
});
