/**
 * Collect total event count at configrable partitions.
 */

var Job = require(__dirname + '/prototype');

'use strict';

exports.getClass = function() {
  return CountAllPartitioned;
};

var CountAllPartitioned = function() {
  this.name = __filename;
  this.__super__.call(this);
};

Job.extend(CountAllPartitioned, {

  map: function() {
    var month = (this.time.getMonth() + 1) + '',
        date = this.time.getDate() + '',
        hours = this.time.getHours() + '',
        minutes = this.time.getMinutes() + '',
        seconds = this.time.getSeconds() + '',
        group = '';

    switch (partition) {
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
    emit(group, {count: 1, _id: this._id.toString()});
  },

  reduce: function(key, values) {
    var result = {count: 0, _id: 0};
    values.forEach(function(value) {
      result.count += value.count;
      result._id = value._id; // Last mapped document ID.
    });
    return result;
  },

  /**
   * See prototype in prototype.js for full notes.
   *
   * Results format:
   *   {
   *     <Date.parse() compatible string>: {count: 5},
   *     ...
   *   }
   * - Key formats based on 'partition':
   *   minute: MM-DD-YYYY HH:MM:00
   *   hour: MM-DD-YYYY HH:00:00
   *   day: MM-DD-YYYY 00:00:00
   *   month: YYYY-MM
   *   year; YYYY
   * - Value format:
   *   {count: <Number>, _id: <hex ID of last mapped document>}
   */
  run: function(query, callback) {
    var date = diana.shared.Date,
        bestFitInterval = date.bestFitInterval(
          parseInt(query['time-lte'], 10) - parseInt(query['time-gte'], 10)
        ),
        partition = date.partitions[bestFitInterval];

    this.extractOptionsFromQuery(query);
    this.updateMapReduceConfig({scope: {partition: partition}});
    this.mapReduce(query, callback);
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
