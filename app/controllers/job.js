/**
 * Run an ad-hoc MongoDB MapReduce job.
 *
 * Ex. job/<name>?time-gte=<timestamp>&time-lte=<timestamp>&parser=Json&partition=hour&code=404
 */

define([], function() {

  'use strict';

  return function(req, res) {
    var send404 = function() {
          res.send({__error: 'Job not found.'}, 404);
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

    var redis = mainevent.requireModule('redis').createInstance(),
        cacheKey = ['adhoc', req.params.name, _.sha1(req.query)].join('_'),
        expires = 60000;

    redis.getWithWriteThrough(
      cacheKey,
      // On miss.
      function(key, readerCallback) {
        try {
          var job = new (mainevent.requireJob(req.params.name).getClass())('graph');
        } catch (e) {
          if (e.toString().match(/Cannot find module/)) {
            send404();
            return;
          } else {
            throw e;
          }
        }

        var date = mainevent.shared.Date,
            span = parseInt(req.query['time-lte'], 10) - parseInt(req.query['time-gte'], 10);

        job.updateOptions({
          // Ex. 'adhoc_CountAllPartitioned_<hash>'
          suffix: cacheKey,
          // Ex. 'hour'
          partition: date.partitions[date.bestFitInterval(span)],
        });

        job.run(req.query, function(err, results) {
          readerCallback(err, results);
        });
      },
      expires,
      // On read/read-through completion.
      function(err, results) {
        if (err) {
          res.send({__error: err}, 500);
          return;
        }

        var points = {};
        _.each(results, function(value, key) {
          points[key] = {count: value.count};
        });
        res.send(points);
      }
    );
  };
});
