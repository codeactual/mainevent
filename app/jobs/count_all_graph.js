/**
 * Collect total event count at configrable intervals.
 */

var Job = require(__dirname + '/prototype');

'use strict';

exports.getClass = function() {
  return CountAllGraph;
};

var CountAllGraph = function() {
  this.name = __filename;
  this.__super__.call(this);
};

Job.extend(CountAllGraph, {

  map: function() {
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
  },

  reduce: function(key, values) {
    var result = {count: 0};
    values.forEach(function(value) {
      result.count += value.count;
    });
    return result;
  },

  customOptionKeys: ['interval'],

  /**
   * See prototype in prototype.js for full notes.
   *
   * Results format:
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
  run: function(query, callback) {
    var options = this.extractOptionsFromQuery(query);
    this.mapReduce(query, {scope: {interval: options.interval}}, callback);
  },

  /**
   * See prototype in prototype.js for full notes.
   */
  getExpires: function(query, now) {
    var defaultExpires = 60;

    if (!query['time-lte']) {
      return defaultExpires;
    }

    // If the time range ends within the last 60 seconds, cache the result
    // for a minute. Otherwise store it without an expiration.
    now = now || (new Date()).getTime();
    return Math.abs(now - query['time-lte']) <= defaultExpires * 1000 ? defaultExpires : null;
  }
});
