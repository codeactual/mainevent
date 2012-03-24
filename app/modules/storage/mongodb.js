/**
 * MongoDB storage implementation.
 */

'use strict';

var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var config = diana.getConfig().storage;

exports.createInstance = function() {
  return new MongoDbStorage();
};

var MongoDbStorage = function() {
  Storage.call(this);
};

diana.shared.Lang.inheritPrototype(MongoDbStorage, Storage);

// Db instance.
MongoDbStorage.prototype.link = null;

// Collection name.
MongoDbStorage.prototype.collection = null;

/**
 * In one or more documents, convert BSON Timestamp objects to their UNIX
 * timestamp integer values.
 *
 * @param docs {Array|Object} Query result(s).
 * @return {Array}
 */
MongoDbStorage.prototype.unpackTime = function(docs) {
  if (_.isArray(docs)) {
    return _.map(docs, function(doc) {
      doc.time = doc.time.high_;
      return doc;
    });
  } else {
    docs.time = docs.time.high_;
    return docs;
  }
};

/**
 * Connect to the DB based on config.js. Reuse a link if available.
 *
 * @param error {Function} Fired after error.
 * @param success {Function} Fired after success.
 */
MongoDbStorage.prototype.dbConnectAndOpen = function(error, success) {
  if (this.link) {
    success(null, this.link);
  } else {
    this.collection = config.collection;
    this.link = new mongodb.Db(
      config.db,
      new mongodb.Server(config.host, config.port, {})
    );
    var mongo = this;
    this.link.open(function(err, db) {
      if (err) {
        mongo.dbClose('Could not access database.', error);
      } else {
        success(err, db);
      }
    });
  }
};

/**
 * Open a DB collection.
 *
 * @param db {Object} Connection link.
 * @param collection {String} Collection name.
 * @param error {Function} Fired on error.
 * @param success {Function} Fired on success.
 */
MongoDbStorage.prototype.dbCollection = function(db, collection, error, success) {
  var mongo = this;
  db.collection(collection, function(err, collection) {
    if (err) {
      mongo.dbClose('Could not access collection.', error);
    } else {
      success(err, collection);
    }
  });
};

/**
 * Disconnect from the DB.
 *
 * @param err {String} Optional error value passed to 'callback'.
 * @param callback {Function} Optional function called after link is closed.
 * - Receives two arguments, 'err' and null.
 */
MongoDbStorage.prototype.dbClose = function(err, callback) {
  if (this.link) {
    this.link.close();
    this.link = null;
  }
  if (callback) {
    callback(err, null);
  }
};

/**
 * Insert a single parsed log line.
 *
 * @param source {Object} See config.js.dist for the structure.
 * @param log {Object} Output from a parser module's parse() function.
 * @param callback {Function} Receives insert() results.
 * @param bulk {Boolean} If true, DB connection is not auto-closed.
 */
MongoDbStorage.prototype.insertLog = function(source, log, callback, bulk) {
  var mongo = this;
  this.dbConnectAndOpen(callback, function(err, db) {
    mongo.dbCollection(db, mongo.collection, callback, function(err, collection) {
      log.time = new mongodb.Timestamp(null, log.time);
      log.parser = source.parser;
      log.tags = source.tags;
      collection.insert(log, {safe: true}, function(err, docs) {
        // close() required after one-time insert to avoid hang.
        if (!bulk) {
          mongo.dbClose();
        }
        callback(err, docs);
      });
    });
  });
};

/**
 * Retrieve a single log's attributes.
 *
 * @param id {String} Document ID.
 * @param callback {Function} Receives findOne() results.
 */
MongoDbStorage.prototype.getLog = function(id, callback) {
  var mongo = this;
  this.dbConnectAndOpen(callback, function(err, db) {
    mongo.dbCollection(db, mongo.collection, callback, function(err, collection) {
      collection.findOne({_id: new BSON.ObjectID(id)}, function(err, doc) {
        if (err) { mongo.dbClose(err, callback); return; }
        mongo.dbClose();
        if (doc) {
          doc = mongo.unpackTime(doc);
        }
        callback(err, doc);
      });
    });
  });
};

/**
 * Retrieve the attributes of all matching logs.
 *
 * @param params {Object}
 * - sort-dir {String} 'desc' or 'asc'
 * - sort-attr {String} Ex. 'time'
 * - skip {Number} Amount of documents skipped.
 * - limit {Number} Maximum amount of documents retrieved.
 * - All other key/value pairs are considered conditions.
 * @param callback {Function} Receives find() results.
 * - {String} MongoDB driver error message.
 * - {Array} Result set.
 * - {Object} Additional result details.
 *   'nextPage' {Boolean} True if additional documents exist.
 */
MongoDbStorage.prototype.getTimeline = function(params, callback) {
  var mongo = this;
  mongo.dbConnectAndOpen(callback, function(err, db) {
    mongo.dbCollection(db, mongo.collection, callback, function(err, collection) {
      var options = {};
      if (params['sort-attr']) {
        if ('desc' == params['sort-dir']) {
          options.sort = [[params['sort-attr'], 'desc']];
          delete params['sort-dir'];
        } else if ('asc' == params['sort-dir']) {
          options.sort = [[params['sort-attr'], 'asc']];
          delete params['sort-dir'];
        }
        delete params['sort-attr'];
      }
      if (params.limit) {
        options.limit = Math.min(parseInt(params.limit, 10), config.maxResultSize);
        delete params.limit;
      } else {
        options.limit = config.maxResultSize;
      }
      if (params.skip) {
        options.skip = parseInt(params.skip, 10);
        delete params.skip;
      }
      _.each(params, function(value, key) {
        var matches = null;
        if ((matches = key.match(/^(.*)-(gte|gt|lte|lt|ne)$/))) {
          if ('time' == matches[1]) {
            value = new mongodb.Timestamp(null, value);
          }
          if (!params[matches[1]]) {
            params[matches[1]] = {};
          }
          params[matches[1]]['$' + matches[2]] = value;
          delete params[key];
        } else if ('_id' == key && _.isString(value)) {
          params[key] = new BSON.ObjectID(value);
        }
      });
      options.limit += 1; // For next-page detection.
      collection.find(params, options).toArray(function(err, docs) {
        if (err) { mongo.dbClose(err, callback); return; }
        mongo.dbClose();
        var info = {
          prevPage: docs && options.skip > 0,
          nextPage: docs && (docs.length == options.limit)
        };
        if (docs) {
          if (info.nextPage) { // Discard next-page hint doc.
            docs.pop();
          }
          docs = mongo.unpackTime(docs);
        }
        callback(err, docs, info);
      });
    });
  });
};

/**
 * Retrieve the attributes of all logs newer than a given ID.
 *
 * @param id {String}
 * @param params {Object} getTimeline() compatible parameters.
 * @param callback {Function} Receives find() results.
 */
MongoDbStorage.prototype.getTimelineUpdates = function(id, params, callback) {
  params._id = {$gt: new BSON.ObjectID(id)};
  params['sort-attr'] = 'time';
  params['sort-dir'] = 'desc';
  this.getTimeline(params, callback);
};

/**
 * Retrieve the attributes of all logs newer than a given ID.
 *
 * @param job {Object}
 * - name {String} Name of collection to receive results.
 *   - Optionally supply __filename of a job script and the basename will be used.
 * - map {Function}
 * - reduce {Function}
 * - query {Object} Filter query object.
 * - out {Object} MongoDB output directive. (Default: {replace: <name>})
 * - callback {Function} Fires after success/error.
 *   - err {String}
 *   - stats {Object}
 */
MongoDbStorage.prototype.mapReduce = function(job) {
  if (job.name[0] == '/') { job.name = require('path').basename(job.name, '.js'); }
  var options = {out: job.out || {replace: job.name}};
  if (job.query) { options.query = job.query; delete job.query; }
  var mongo = this;
  this.dbConnectAndOpen(job.callback, function(err, db) {
    mongo.dbCollection(db, mongo.collection, job.callback, function(err, collection) {
      collection.mapReduce(job.map, job.reduce, options, function(err, stats) {
        mongo.dbClose();
        job.callback(err, stats);
      });
    });
  });
};

/**
 * Time-ranged wrapped for mapReduce().
 *
 * @param startTime {Number}
 * @param endTime {Number}
 * @param job {Object} mapReduce() argument.
 */
MongoDbStorage.prototype.mapReduceTimeRange = function(startTime, endTime, job) {
  job.query = job.query || {};
  job.query.time = {
    $gte: new mongodb.Timestamp(null, startTime),
    $lte: new mongodb.Timestamp(null, endTime)
  };
  this.mapReduce(job);
};

/**
 * Return all documents in a collection.
 *
 * @param name {String}
 * @param callback {Function} Fires after success/error.
 */
MongoDbStorage.prototype.getWholeCollection = function(name, callback) {
  var mongo = this;
  mongo.dbConnectAndOpen(callback, function(err, db) {
    mongo.dbCollection(db, name, callback, function(err, collection) {
      collection.find().toArray(function(err, docs) {
        mongo.dbClose();
        callback(err, docs);
      });
    });
  });
};
