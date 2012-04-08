define([], function() {

  'use strict';

  var root = 'undefined' == typeof window ? GLOBAL : window;
  root.diana = root.diana || {};
  root.diana.shared = root.diana.shared || {};
  var diana = root.diana;

  var Lang = diana.shared.Lang = {

    /**
     * Recursively convert all numeric Strings to Numbers.
     *
     * @param val {mixed}
     * @return {mixed}
     */
    numericStrToNum: function(val) {
      if (_.isUndefined(val)) {
        return val;
      }

      var constructor = val.constructor.toString().match(/^function ([^\(]+)/);
      if (constructor[1] == 'Object' || constructor[1] == 'Array') {
        val = _.clone(val);
        _.each(val, function(oVal, oKey) {
          val[oKey] = Lang.numericStrToNum(oVal);
        });
      } else if (_.isString(val) && val.match(/^-?[0-9.]+$/)) {
        if (val.match(/\./)) {
          val = parseFloat(val);
        } else {
          val = parseInt(val, 10);
        }
      }
      return val;
    },

    /**
     * Prototypal inheritance by Douglas Crockford.
     *
     * @param o {Object}
     */
    object: function(o) {
      function F() {};
      F.prototype = o;
      return new F();
    },

    /**
     * Parasitic combination inheritance by Nicholas Zakas.
     *
     * @param subType {Object}
     * @param superType {Object}
     */
    inheritPrototype: function(subType, superType) {
      var prototype = Lang.object(superType.prototype);
      prototype.constructor = subType;
      subType.prototype = prototype;
    }
  };
});
