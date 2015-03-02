
// Map app models crud routers
App.Router.map(function() {
  this.resource('models',{ path: '/model'}, function() {
    this.resource('model',{ path: '/:modelName'}, function() {

    });
  });
});

App.ModelRoute = Ember.Route.extend({
  model: function(params) {
    if (!params.modelName) {
      return this.transitionTo('models');
    }

    var typeMap = this.get('store').modelFor(params.modelName);
    var attributes = [];

    var attrs = Ember.get(typeMap + '.attributes');
    if (attrs) {
      attributes = attrs.keys.list
    }

    return Ember.RSVP.hash({
      attributes: attributes,
      records: this.loadRecords(typeMap)
    });
  },

  loadRecords: function(Model) {
    return this.get('store').find(Model);
  }

});