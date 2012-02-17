'use strict';

var util = require('util');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var db = null;
var collection = null;
var maxResultSize = 100;

exports.connect = function(config) {
  if (!db) {
    collection = config.collection;
    db = new mongodb.Db(
      config.db,
      new mongodb.Server(config.host, config.port, {})
    );
  }
  return db;
};

exports.insert_log = function(source, log) {
  db.open(function(err, db) {
    db.collection(collection, function(err, collection) {
      log.parser = source.parser;
      log.tags = source.tags;
      collection.insert(log, { safe: true }, function(err, docs) {
        // close() required -- otherwise will hang
        db.close();
      });
    });
  });
};

exports.get_log = function(id, callback) {
  db.open(function(err, db) {
    db.collection(collection, function(err, collection) {
      collection.findOne({_id: new BSON.ObjectID(id)}, callback);
    });
  });
};

exports.get_timeline = function(params, callback) {
  db.open(function(err, db) {
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
      collection.find(params, options).toArray(callback);
    });
  });
};
