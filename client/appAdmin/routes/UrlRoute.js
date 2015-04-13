App.Router.map(function() {

  this.resource('urls',{ path: '/urls'}, function() {
    this.route('create', { path: '/create' } );

    this.resource('url',{path: '/:id'}, function() {
      this.route('edit', { path: '/edit' } );
    });
  });
});

App.UrlsIndexRoute = Ember.Route.extend({
  model: function () {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Url.attributes').keys.list,
      records: this.get('store').find('url')
    });
  }
});

App.UrlsCreateRoute = Ember.Route.extend({
  model: function () {
    return {
      record: {}
    };
  }
});

App.UrlRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Url.attributes').keys.list,
      record: this.get('store').find('url', params.id)
    });
  }
});

App.UrlIndexRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Url.attributes').keys.list,
      record: this.modelFor('url').record
    });
  }
});

App.UrlEditRoute = Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Url.attributes').keys.list,
      record: this.modelFor('url').record
    });
  }
});