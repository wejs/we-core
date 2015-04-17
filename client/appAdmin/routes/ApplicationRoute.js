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

    // // check acess
    if (!App.get('auth.isAuthenticated')) return this.transitionTo('authLogin');
    if (!Permissions.can('can_administer')) return this.transitionTo('403');

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
  },

  actions: {
    willTransition: function () {
      NProgress.start();
    },
    loading: function(){
      NProgress.set(0.5);
    },
    // after change route
    didTransition: function() {
      NProgress.done(true);
    },

    logRegister: function () {
      App.auth.registerUser();
    },

    logIn: function () {
      App.auth.authenticate();
    },
    /**
     * Log out current user
     */
    logOut: function logOut() {
      //disconect from socket.io
      window.io.socket.disconnect();

      App.auth.logOut(function(){
        // redirect to logout in express
        location.href = '/auth/logout';
      });
    },
    error: function(error, transition){
      if (error.status === 0) {
        Ember.Logger.error('Unhandled error on route', error);
        //showErrorDialog('Sorry, but we\'re having trouble connecting to the server. This problem is usually the result of a broken Internet connection. You can try refreshing this page.');
      } else if (error.status == 403) {
        Ember.Logger.error('Unhandled error on route', error);
        //go to some default route
      } else if (error.status == 401) {
        Ember.Logger.error('Unhandled error on route', error);
        //handle 401
      } else if (error.status == 500) {
        Ember.Logger.error('500 error', error);
        this.transitionTo('500');
        //handle 401
      } else if (error.status == 404) {
        // send to 404 page
        this.transitionTo('404');
      } else {
        Ember.Logger.error('Unhandled error on route', error);
      }
    },
    showModal: function(name, model) {
      this.render(name, {
        into: 'application',
        outlet: 'modal',
        model: model
      });
    },
    removeModal: function() {
      this.disconnectOutlet({
        outlet: 'modal',
        parentView: 'application'
      });
    }
  }
});
