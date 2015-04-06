/**
 * Register 'term' ember.js data type
 */

DS.TermTransform = DS.Transform.extend({
  deserialize: function(serialized) {
    return (Ember.typeOf(serialized) === 'array') ? serialized : [];
  },
  serialize: function(deserialized) {
    var type = Ember.typeOf(deserialized);
    if (type === 'array') {
      return deserialized;
    } else if (type === 'string') {
      return deserialized.split(',').map(function(item) {
        return jQuery.trim(item);
      });
    } else {
      return [];
    }
  }
});

App.register('transform:term', DS.TermTransform);
