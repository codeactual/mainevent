'use strict';

var util = require('util');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var db = null;
var collection = null;

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
      collection.insert(log, function(err, docs) {
        console.log('inserted: ' + util.inspect(log));
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
        options.limit = parseInt(params.limit, 10);
        delete params.limit;
      }
      collection.find(params, options).toArray(callback);
    });
  });
};
