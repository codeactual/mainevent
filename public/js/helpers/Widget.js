define([], function() {

  'use strict';

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
     * @param ttl {Number} (Optional) Number of seconds before removal.
     */
    alert: function(message, level, ttl) {
      var element = $('<div class="alert alert-' + level + '" />');
      element.append('<a class="close" data-dismiss="alert">&times;</a>');
      element.append('[' + moment().format(config.alert.format) + '] ' + message);
      element.on('click', function() { $(this).remove(); });
      if (ttl) {
        setTimeout(function() { element.remove(); ttl = null; }, ttl * 1000);
      }
      $('#alert').prepend(element);
      $('#alert div:nth-child(' + (config.alert.max + 1) + ')').remove();
    },

    /**
     * Close (any) open Twitter Bootstrap dropdown.
     *
     * - Intended as first step in a click handler.
     *
     * @param event {Object} jQuery event object.
     */
    closeDropdown: function(event) {
      event.preventDefault();
      $('.dropdown-toggle').parent().removeClass('open');
    },

    /**
     * Close (any) open Twitter Bootstrap modal.
     *
     * - Intended as first step in a click/submit handler.
     *
     * @param event {Object} jQuery event object.
     */
    closeModal: function(event) {
      event.preventDefault();
      $('.modal').modal('hide');
      diana.helpers.Event.trigger('ModalClose');
    },

    /**
     * Add <option> list based on configured parser list.
     *
     * @param select {Object} jQuery object or selector.
     * @param includeAny {Boolean} If true, "Any Event Type" option is first.
     */
    fillParserSelect: function(select, includeAny) {
      select = $(select);
      if (_.isUndefined(includeAny) || includeAny) {
        select.append('<option value="">Any Event Type</option>');
      }
      _.each(diana.parsers, function(name) {
        select.append('<option value="' + name + '">' + name + '</option>');
      });
    },

    /**
     * Add <option> list based on configured interval list.
     *
     * @param select {Object} jQuery object or selector.
     * @param includeAny {Boolean} If true, "Any Time" option is first.
     */
    fillPresetTimeSelect: function(select, includeAny) {
      select = $(select);
      if (_.isUndefined(includeAny) || includeAny) {
        select.append('<option value="">Any Time</option>');
      }
      _.each(diana.shared.Date.presetTimeIntervals, function(interval, name) {
        select.append('<option value="' + interval + '">' + name + '</option>');
      });
    }
  };
});

