App.Router.map(function(match) {
  this.resource('permissions',{path: '/permissions'}, function(){
    this.route('create',{path: '/add'});

    this.resource('roles',{path: '/roles'}, function() {
      this.route('create',{path: '/add'});
      this.route('view',{path: '/:id/view'});
      this.route('edit',{path: '/:id/edit'});
    });
  });
});

App.PermissionsRoute = Ember.Route.extend({
  model: function () {
    return Ember.RSVP.hash({
      records: new Ember.RSVP.Promise(function(resolve, reject) {
        var permissionsUrl = '/permission';
        var permissionsHost = Ember.get('App.configs.permissionHost');
        if ( permissionsHost ) {
          permissionsUrl = permissionsHost + permissionsUrl;
        }

        return $.getJSON( permissionsUrl )
        .done(function afterLoadData(data) {
          // on success
          resolve(data.permission);
        })

        .fail(function (result) {
          if (result.status == '403') return resolve(Permissions._perms);

          Ember.Logger.error('Error on load permissions' , result);
          // on failure
          return reject(result);
        })
      }),
      roles: this.get('store').find('role')
    });
  },

  afterModel: function(model) {
    // remove administrator role
    var administrator = model.roles.filterProperty('name', 'administrator');
    if (administrator)
      model.roles.removeObject(administrator[0]);

  }
});

App.RolesRoute = Ember.Route.extend({
  model: function () {
    return this.get('store').find('role')
  }
});

App.RolesIndexRoute = Ember.Route.extend({
  model: function () {
    return this.get('store').find('role', {
      sort: 'id DESC'
    });
  }
});

App.RolesCreateRoute = Ember.Route.extend({
  model: function () {
    return Ember.RSVP.hash({
      role: {}
    });
  },
});
