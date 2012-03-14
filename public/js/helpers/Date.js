'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  diana.helpers.Date = {
    /**
     * Convert a UNIX timestamp in seconds to string format.
     *
     * @param time {Number}
     * @return {String}
     */
    formatTime: function(time) {
      return moment(new Date(time * 1000)).format('LLLL z');
    }
  };
})();

