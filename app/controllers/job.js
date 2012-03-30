define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Job not found.'}, 404);
        },
        storage = diana.requireModule('storage/storage').createInstance();

    if (!req.params.name.match(/^[a-z_]+$/)) {
      send404();
      return;
    }

    if (req.query.parser && -1 == _.indexOf(parserNames, req.query.parser)) {
      send404();
      return;
    }

    var parser = req.query.parser ? '_' + req.query.parser : '',
    interval = req.query.interval ? '_' + parseInt(req.query.interval, 10) : '',
    collectionName = req.params.name + parser + interval;

    storage.collectionExists(collectionName, function(err, results) {
      if (!results) {
        send404();
        return;
      }
      storage.getMapReduceResults(collectionName, function(err, results) {
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
