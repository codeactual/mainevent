/**
 * MongoDB storage implementation.
 */

'use strict';

var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var link = null;
var collection = null;
var maxResultSize = 100;

/**
 * In one or more documents, convert BSON Timestamp objects to their UNIX
 * timestamp integer values.
 *
 * @param docs {Array|Object} Query result(s).
 * @return {Array}
 */
var unpackTime = function(docs) {
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
 * @param callback {Function} Fired after connection attempted.
 */
var dbConnectAndOpen = function(error, success) {
  if (link) {
    success(null, link);
  } else {
    var config = diana.getConfig().storage;
    collection = config.collection;
    link = new mongodb.Db(
      config.db,
      new mongodb.Server(config.host, config.port, {})
    );
    link.open(function(err, db) {
      if (err) {
        exports.dbClose();
        error('Could not access database.', null);
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
 * @param error {Function} Fired on failed opening.
 * @param error {Function} Fired on successful opening.
 */
var dbCollection = function(db, collection, error, success) {
  db.collection(collection, function(err, collection) {
    if (err) {
      exports.dbClose();
      error('Could not access collection.', null);
    } else {
      success(err, collection);
    }
  });
};

/**
 * Disconnect from the DB.
 */
exports.dbClose = function() {
  if (link) {
    link.close();
    link = null;
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
exports.insertLog = function(source, log, callback, bulk) {
  dbConnectAndOpen(callback, function(err, db) {
    dbCollection(db, collection, callback, function(err, collection) {
      log.time = new mongodb.Timestamp(null, log.time);
      log.parser = source.parser;
      log.tags = source.tags;

      collection.insert(log, { safe: true }, function(err, docs) {
        // close() required after one-time insert to avoid hang.
        if (!bulk) {
          exports.dbClose();
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
exports.getLog = function(id, callback) {
  dbConnectAndOpen(callback, function(err, db) {
    dbCollection(db, collection, callback, function(err, collection) {
      collection.findOne({_id: new BSON.ObjectID(id)}, function(err, doc) {
        exports.dbClose();
        if (doc) {
          doc = unpackTime(doc);
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
 * - sort_dir {String} 'desc' or 'asc'
 * - sort_attr {String} Ex. 'time'
 * - skip {Number} Amount of documents skipped.
 * - limit {Number} Maximum amount of documents retrieved.
 * - All other key/value pairs are considered conditions.
 * @param callback {Function} Receives find() results.
 */
exports.getTimeline = function(params, callback) {
  dbConnectAndOpen(callback, function(err, db) {
    dbCollection(db, collection, callback, function(err, collection) {
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
      collection.find(params, options).toArray(function(err, docs) {
        exports.dbClose();
        if (docs) {
          docs = unpackTime(docs);
        }
        callback(err, docs);
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
exports.getTimelineUpdates = function(id, params, callback) {
  params._id = {$gt: new BSON.ObjectID(id)};
  params.sort_attr = '_id';
  params.sort_dir = 'desc';
  exports.getTimeline(params, callback);
};
