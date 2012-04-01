/**
 * Collect total event count at configrable intervals.
 */

'use strict';

var storage = diana.requireModule('storage/storage').createInstance();

var map = function() {
  var month = (this.time.getMonth() + 1) + '',
      date = this.time.getDate() + '',
      hours = this.time.getHours() + '',
      minutes = this.time.getMinutes() + '',
      seconds = this.time.getSeconds() + '',
      group = '';

  switch (interval) {
    case 'year':
      group = this.time.getFullYear();
      break;
    case 'month':
      group =
        this.time.getFullYear()
        + '-' + (month.length == 2 ? month : '0' + month);
      break;
    case 'day':
      group =
        (month.length == 2 ? month : '0' + month)
        + '/' + (date.length == 2 ? date : '0' + date)
        + '/' + this.time.getFullYear()
        + ' 00:00:00';
      break;
    case 'hour':
      group =
        (month.length == 2 ? month : '0' + month)
        + '/' + (date.length == 2 ? date : '0' + date)
        + '/' + this.time.getFullYear()
        + ' ' + (hours.length == 2 ? hours : '0' + hours)
        + ':00';
      break;
    case 'minute':
      group =
        (month.length == 2 ? month : '0' + month)
        + '/' + (date.length == 2 ? date : '0' + date)
        + '/' + this.time.getFullYear()
        + ' ' + (hours.length == 2 ? hours : '0' + hours)
        + ':' + (minutes.length == 2 ? minutes : '0' + minutes)
        + ':00';
      break;
    case 'second':
      group =
        (month.length == 2 ? month : '0' + month)
        + '/' + (date.length == 2 ? date : '0' + date)
        + '/' + this.time.getFullYear()
        + ' ' + (hours.length == 2 ? hours : '0' + hours)
        + ':' + (minutes.length == 2 ? minutes : '0' + minutes)
        + ':' + (seconds.length == 2 ? seconds : '0' + seconds);
      break;
    default:
      return;
  }
  emit(group, {count: 1});
};

var reduce = function(key, values) {
  var result = {count: 0};
  values.forEach(function(value) {
    result.count += value.count;
  });
  return result;
};

/**
 * @param options {Object}
 * - startTime {Number} UNIX timestamp in seconds.
 * - endTime {Number} UNIX timestamp in seconds.
 * - interval {String} Size of grouped totals.
 *   - hour, minute
 * - query {Object} Additional query arguments.
 * - suffix {String} Appended to the default results collection name.
 *   - suffix 'hourly' -> collection name 'count_all_graph_hourly'
 * @param callback {Function} Fires after success/error.
 * - See MongoDbStorage.mapReduce for payload arguments.
 * - Results format:
 *   {
 *     <Date.parse() compatible string>: {count: 5},
 *     ...
 *   }
 * - Key formats based on 'interval':
 *   minute: MM-DD-YYYY HH:MM:00
 *   hour: MM-DD-YYYY HH:00:00
 *   day: MM-DD-YYYY 00:00:00
 *   month: YYYY-MM
 *   year; YYYY
 */
exports.run = function(options, callback) {
  storage.mapReduceTimeRange(options.startTime, options.endTime, {
    name: __filename,
    map: map,
    reduce: reduce,
    options: {
      query: options.query,
      scope: {interval: options.interval}
    },
    return: 'array',
    suffix: options.suffix,
    callback: function(err, results, stats) {
      if (options.persist) {
        callback(err, results, stats);
        return;
      }
      storage.dropCollection(stats.collectionName, function() {
        callback(err, results, stats);
      });
    }
  });
};
