'use strict';

var util = require('util');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var db = null;

exports.connect = function(config) {
  if (!db) {
    db = new mongodb.Db(
      config.db,
      new mongodb.Server(config.host, config.port, {})
    );
  }
  return db;
};

exports.insert_log = function(source, log) {
  db.open(function(err, db) {
    db.collection('access', function(err, collection) {
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
    db.collection('access', function(err, collection) {
      collection.findOne({_id: new BSON.ObjectID(id)}, callback);
    });
  });
};
