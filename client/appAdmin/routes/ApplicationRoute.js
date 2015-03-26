// Map app routers
App.Router.map(function() {
  this.resource('home',{path: '/'});

  this.route('forbidden', { path: '403'});
  // 403 page
  this.route('403', { path: '403'});
  // 404 page
  this.route('404', { path: '404'});
  // 500 page
  this.route('500', { path: '500'});
  // use unknown page to redirect to 404
  this.route('unknown', { path: '*path'});
});


App.ApplicationRoute = Ember.Route.extend(WeApplicationRoutesMixin, {
  beforeModel: function() {
    var store = this.get('store');
    var promisses = {};

    App.auth.init();
    if (App.auth) {
      // get current user
      promisses.currentUser = App.auth.loadCurrentUser(store);
    }

    promisses.loadPermissionsAndRoles = Permissions.loadAndRegisterAllRolesAndPermissions(store);

    return Ember.RSVP.hash(promisses);
  },

  model: function() {
    var promisse = {};
    var user = App.currentUser;
    // // check acess
    if (!user) return this.transitionTo('authLogin');
    if(!Permissions.can('can_administer')) return this.transitionTo('403');

    // app configs
    promisse.configs = App.configs;

    promisse.auth = App.auth;

    return Ember.RSVP.hash(promisse);
  },
  afterModel: function(model) {
    if (App.get('auth.isAuthenticated') && App.Contact) {
      // set filter for mentionOptions
      App.set('currentUser.mentionOptions', this.get('store').filter('contact', function (contact) {
        if (contact.get('status') == 'accepted') {
          return true;
        }
        return false;
      }));
    } else {
      App.set('currentUser.mentionOptions', []);
    }
  }
});
