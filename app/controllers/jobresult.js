define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Job results not found.'}, 404);
        };

    if (!req.params.name.match(/^[a-z0-9_]+$/)) {
      send404();
      return;
    }

    var redis = diana.requireModule('redis').createInstance();
    redis.get(req.params.name, function(err, results) {
      redis.end();
      if (err) {
        res.send({__error: err}, 500);
        return;
      } else if (_.isUndefined(results)) {
        send404();
        return;
      }
      res.send(results);
    });
  };
});
