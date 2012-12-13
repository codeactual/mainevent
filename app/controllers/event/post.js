define([], function() {

  'use strict';

  return function(req, res) {
    var mongodb = mainevent.requireModule('mongodb').createInstance();

    var event = req.body;

    if (_.isEmpty(event) || !_.isObject(event)) {
      res.send({__error: 'Missing event definition'}, 400);
      return;
    }

    if (_.has(event, '_id')) {
      res.send({__error: 'Event definition cannot contain _id'}, 400);
      return;
    }

    mongodb.insertLog([event], function(err, doc) {
      if (err) {
        res.send({__error: err}, 500);
        return;
      }

      res.send(doc);
    });
  };
});
