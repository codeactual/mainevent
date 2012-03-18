'use strict';

(function() {

  /**
   * Triggered by rendering of the basic content template.
   */
  var observers  = [];

  // Apply context.tab option.
  observers.push(function(config) {
    $('#nav-list > li').removeClass('active');
    $('#' + config.tab).addClass('active');
  });

  _.each(observers, function(observer) {
    diana.helpers.Event.on('ContentPreRender', observer);
  });
})();
