define([], function() {

  'use strict';

  return Backbone.View.extend({
    initialize: function(options) {
      this.render();
    },

    events: {
    },

    onClose: function() {
    },

    render: function() {
      // Use convention-based IDs so markup can just hold positional containers.
      var id = this.el.id + '-canvas';
      this.$el.append($('<div>').attr('id', id));

      $.jqplot(
        id,
        [
          [[1, 2],[3,5.12],[5,13.1],[7,33.6],[9,85.9],[11,219.9]],
          [[2, 4],[6,10.12],[10,26.1],[14,66.6],[18,170.9],[22,440.9]]
        ],
        {
          title: 'Events',
          series: [
            {color:'#5FAB78'},
            {color:'#000000'},
          ]
        }
      );
    }
  });
});
