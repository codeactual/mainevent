'use strict';

var util = require('util');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var link = null;
var collection = null;
var maxResultSize = 100;

var db_connect_and_open = function(callback) {
  if (link) {
    callback(null, link);
  } else {
    var config = require(__dirname + '/../../../config/config.js').read().storage;
    collection = config.collection;
    link = new mongodb.Db(
      config.db,
      new mongodb.Server(config.host, config.port, {})
    );
    link.open(callback);
  }
};

exports.db_close = function() {
  if (link) {
    link.close();
    link = null;
  }
};

exports.insert_log = function(source, log, callback, bulk) {
  db_connect_and_open(function(err, db) {
    db.collection(collection, function(err, collection) {
      log.parser = source.parser;
      log.tags = source.tags;
      collection.insert(log, { safe: true }, function(err, docs) {
        // close() required after one-time insert to avoid hang
        if (!bulk) {
          exports.db_close();
        }
        callback(err, docs);
      });
    });
  });
};

exports.get_log = function(id, callback) {
  db_connect_and_open(function(err, db) {
    db.collection(collection, function(err, collection) {
      collection.findOne({_id: new BSON.ObjectID(id)}, function(err, doc) {
        callback(err, doc);
        exports.db_close();
      });
    });
  });
};

exports.get_timeline = function(params, callback) {
  db_connect_and_open(function(err, db) {
    db.collection(collection, function(err, collection) {
      var options = {};
      if (params.sort_attr) {
        if ('desc' == params.sort_dir) {
          options.sort = [[params.sort_attr, 'desc']];
          delete params.sort_dir;
        } else if ('asc' == params.sort_dir) {
          options.sort = [[params.sort_attr, 'asc']];
          delete params.sort_dir;
        }
        delete params.sort_attr;
      }
      if (params.limit) {
        options.limit = Math.min(parseInt(params.limit, 10), maxResultSize);
        delete params.limit;
      } else {
        options.limit = maxResultSize;
      }
      if (params.skip) {
        options.skip = parseInt(params.skip, 10);
        delete params.skip;
      }
      collection.find(params, options).toArray(function(err, data) {
        exports.db_close();
        callback(err, data);
      });
    });
  });
};
