'use strict';

(function() {

  /**
   * Triggered by rendering of the basic content template.
   */
  var observers  = [];

  // Apply context.tab option.
  observers.push(function(event, config) {
    $('#nav-list > li').removeClass('active');
    $('#' + config.tab).addClass('active');
  });

  _.each(observers, function(observer) {
    $('#content').bind('ContentPreRender', observer);
  });
})();
