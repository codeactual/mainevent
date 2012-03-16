'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var config = {
    alert: {max: 3, format: 'LT'}
  };

  diana.helpers.Widget = {
    /**
     * Add an alert above the main content area.
     *
     * - Displays up to config.alert.max alert boxes.
     *
     * @param message {String}
     * @param level {String} 'error', 'success' or 'info'
     */
    alert: function(message, level) {
      var element = $('<div class="alert alert-' + level + '" />');
      element.append('<a class="close" data-dismiss="alert">&times;</a>');
      element.append('[' + moment().format(config.alert.format) + '] ' + message);
      $('#alert').prepend(element);
      $('#alert div:nth-child(' + (config.alert.max + 1) + ')').remove();
    }
  };
})();
