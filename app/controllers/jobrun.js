define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Job not found.'}, 404);
        };

    if (!req.params.name.match(/^[a-z_]+$/)) {
      send404();
      return;
    }

    try {
      var job = new (diana.requireJob(req.params.name).getClass());
    } catch (e) {
      send404();
      return;
    }

    var redis = diana.requireModule('redis').createInstance(),
        expires = job.getExpires(req.query),
        cacheKey = req.params.name + '_' + _.sha1(req.query);

    redis.getWithWriteThrough(
      cacheKey,
      function(key, callback) {
        job.run(req.query, function(err, results) {
          callback(err, results);
        });
      },
      expires,
      function(err, results) {
        if (err) {
          res.send({__error: err}, 500);
          return;
        }
        res.send(results);
      }
    );
  };
});
