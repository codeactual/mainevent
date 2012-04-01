define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Job not found.'}, 404);
        },
        mongodb = diana.requireModule('mongodb').createInstance();

    if (!req.params.name.match(/^[a-z0-9_]+$/)) {
      send404();
      return;
    }

    mongodb.collectionExists(req.params.name, function(err, results) {
      if (!results) {
        send404();
        return;
      }
      mongodb.getMapReduceResults(req.params.name, function(err, results) {
        if (err) {
          res.send({__error: err}, 500);
        } else {
          if (results) {
            res.send(results);
          } else {
            send404();
          }
        }
      });
    });
  };
});
