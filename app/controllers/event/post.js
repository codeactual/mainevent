define([], function() {

  'use strict';

  return function(req, res) {
    var mongodb = mainevent.requireModule('mongodb').createInstance();
    var parser = mainevent.requireModule('parsers').createInstance('Json');

    var event = req.body;

    if (_.isEmpty(event) || !_.isObject(event)) {
      res.send({__error: 'Missing event definition'}, 400);
      return;
    }

    event = parser.beforeLineInsert(JSON.stringify(event), event);

    mongodb.insertLog([event], function(err, doc) {
      if (err) {
        res.send({__error: err}, 500);
        return;
      }

      res.send(doc);
    });
  };
});
