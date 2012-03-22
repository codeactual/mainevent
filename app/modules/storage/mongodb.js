/**
 * MongoDB storage implementation.
 */

'use strict';

var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var link = null;
var collection = null;
var config = diana.getConfig().storage;

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

      collection.insert(log, {safe: true}, function(err, docs) {
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
exports.getTimeline = function(params, callback) {
  dbConnectAndOpen(callback, function(err, db) {
    dbCollection(db, collection, callback, function(err, collection) {
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
          params[matches[1]] = {};
          params[matches[1]]['$' + matches[2]] = value;
          delete params[key];
        }
      });
      options.limit += 1; // For next-page detection.
      collection.find(params, options).toArray(function(err, docs) {
        exports.dbClose();
        var info = {nextPage: docs && (docs.length == options.limit)};
        if (docs) {
          if (info.nextPage) { // Discard next-page hint doc.
            docs.pop();
          }
          docs = unpackTime(docs);
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
exports.getTimelineUpdates = function(id, params, callback) {
  params._id = {$gt: new BSON.ObjectID(id)};
  params['sort-attr'] = '_id';
  params['sort-dir'] = 'desc';
  exports.getTimeline(params, callback);
};
