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

    try {
      var job = diana.requireJob(req.params.name).run;
    } catch (e) {
      send404();
      return;
    }

    req.query.persist = false;

    job(req.query, function(err, results) {
      if (err) {
        res.send({__error: err}, 500);
        return;
      }

      res.send(results);
    });
  };
});
