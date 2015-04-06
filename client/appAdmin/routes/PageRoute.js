// StructureRoutes

App.Router.map(function() {

  this.resource('pages',{ path: '/page'}, function() {
    this.route('create', { path: '/create' } );

    this.resource('page',{path: '/:id'}, function() {
      this.route('edit', { path: '/edit' } );
    });
  });
});

App.PagesIndexRoute = Ember.Route.extend({
  model: function () {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Page.attributes').keys.list,
      records: this.get('store').find('page')
    });
  }
});

App.PagesCreateRoute = Ember.Route.extend({
  model: function () {
    return {
      record: {}
    };
  }
});

App.PageRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Page.attributes').keys.list,
      record: this.get('store').find('page', params.id)
    });
  }
});

App.PageIndexRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Page.attributes').keys.list,
      record: this.modelFor('page').record
    });
  }
});

App.PageEditRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Page.attributes').keys.list,
      record: this.modelFor('page').record
    });
  }
});