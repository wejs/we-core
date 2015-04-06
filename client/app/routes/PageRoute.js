// StructureRoutes

App.Router.map(function() {
  this.resource('pages',{ path: '/page'}, function() {
    this.route('create', { path: '/create' } );

    this.resource('page',{path: '/:id'}, function() {
      this.route('edit', { path: '/edit' } );
    });
  });
});

App.PagesIndexRoute = Ember.Route.extend(App.ResetScrollMixin, {

  queryParams: {
    q: { refreshModel: true },
    category: { refreshModel: true },
    sort: { refreshModel: true },
    skip: { refreshModel: true },
    limit: { refreshModel: true }
  },

  model: function (params) {
    var query = this.buildQuery(params);

    return Ember.RSVP.hash({
      attributes: Ember.get('App.Page.attributes').keys.list,
      records: this.store.find('page', query)
    });
  },

  buildQuery: function(params) {
    var query = {};

    query.q = params.q;
    if (params.category && params.category != 'undefined') {
      query.category = params.category;
    }
    //query.skip = (Number(params.currentPage) -1 )* Number(params.limit) ;
    query.skip = params.skip;
    query.limit = params.limit;
    query.sort = params.sort;

    return query;
  }
});

App.PagesCreateRoute = Ember.Route.extend(App.ResetScrollMixin, App.AuthenticatedRouteMixin, {
  model: function () {
    var record = this.get('store').createRecord('page', {});
    var creator = App.get('currentUser');

    // set the creator
    if ( creator.id ) {
      record.set('creator', creator);
    }

    return {
      record: record
    };
  },
  deactivate: function onDeactivate() {
    this.currentModel.record.deleteRecord();
  }
});

App.PageRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function (params) {
    return Ember.RSVP.hash({
      record: this.get('store').find('page', params.id)
    });
  }
});

App.PageEditRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function (params) {
    return Ember.RSVP.hash({
      record: this.modelFor('page').record
    });
  }
});
