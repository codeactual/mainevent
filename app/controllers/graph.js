/**
 * Read pre-generated graph data from Redis.
 *
 * Ex. graph/<name>?time-gte=<timestamp>&time-lte=<timestamp>&parser=json&partition=hour
 */

define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Graph not found.'}, 404);
        },
        validTime = /^\d+$/

    if (!req.params.name.match(/^[a-zA-Z]+$/)) {
      send404();
      return;
    }
    if (!req.query['time-lte'] || !req.query['time-gte']) {
      send404();
      return;
    }
    if (!req.query['time-lte'].match(validTime) || !req.query['time-gte'].match(validTime)) {
      send404();
      return;
    }

    try {
      var job = new (diana.requireJob(req.params.name).getClass())('graph');
    } catch (e) {
      if (e.toString().match(/Cannot find module/)) {
        send404();
        return;
      } else {
        throw e;
      }
    }

    // Ex. extract 'partition' value.
    job.extractOptionsFromQuery(req.query);

    // Ex. extract 'parser' value.
    job.updateKeyFields(req.query);

    var redis = diana.requireModule('redis').createInstance(),
        key = job.buildSortedSetKey(),
        shs = new (diana.requireModule('redis/SortedHashSet').getClass())(redis);

    shs.get(key, req.query['time-gte'], req.query['time-lte'], function(err, results) {
      if (err) {
        res.send({__error: err}, 500);
        return;
      }

      var points = [];

      _.each(results.hashes, function(fieldset, key) {
        points.push([job.extractResultKey(key), fieldset]);
      });

      res.send(points);
    });
  };
});
