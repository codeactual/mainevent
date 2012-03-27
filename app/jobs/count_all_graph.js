/**
 * Collect total event count at configrable intervals.
 */

'use strict';

require(__dirname + '/../modules/diana.js');
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
        + ':00:00';
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
 * @param startTime {Number} UNIX timestamp in seconds.
 * @param endTime {Number} UNIX timestamp in seconds.
 * @param interval {String} Size of grouped totals.
 * - hour, minute
 * @param query {Object} Additional query arguments.
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
exports.run = function(startTime, endTime, interval, query, callback) {
  storage.mapReduceTimeRange(startTime, endTime, {
    name: __filename,
    map: map,
    reduce: reduce,
    options: {
      query: query,
      scope: {interval: interval}
    },
    return: 'array',
    callback: callback
  });
};
