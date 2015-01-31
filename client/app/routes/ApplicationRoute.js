

// Map app routers
App.Router.map(function() {
  this.resource('home',{path: '/'});

  this.route('forbiden', { path: 'forbiden'});
  // 404 page
  this.route('404', { path: '404'});
  // 500 page
  this.route('500', { path: '500'});
  // use unknown page to redirect to 404
  this.route('unknown', { path: '*path'});
});

App.ApplicationRoute = Ember.Route.extend({

  beforeModel: function() {
    var self = this;
    var store = this.get('store');

    App.configs.set('client',  window.we.configs.client);

    return Ember.RSVP.hash({
      // get current user
      currentUser: $.getJSON('/account')
        .done(function afterLoadCurrentUser(data) {
          // if user is logged in
          if (data.user) {
            // TODO remove we.authenticatedUser requirement
            we.authenticatedUser = data.user;
            // ser App.currentUser and save it in store
            App.set('currentUser', self.store.push('user', data.user));
          }
        })
        .fail(function(data) {
          Ember.Logger.error('Error on get current user data' , data);
          // auth token is invalid
          // TODO refresh auth token
          if(data.status === 400 && !data.responseJSON.isValid){
            App.auth.logOut();
          }
        }),
      loadPermissionsAndRoles: Permissions.loadAndRegisterAllPermissions(store)
    });
  },
  model: function() {
    var promisse = {};
    if (App.get('auth.isAuthenticated')) {
      if (App.Contact) {
        promisse.contacts = this.store.find('contact');
      }
    }
    return Ember.RSVP.hash(promisse);
  },
  afterModel: function(model) {
    if (App.get('auth.isAuthenticated')) {
      if (App.Contact) {
        // set filter for mentionOptions
        App.set('currentUser.mentionOptions', this.get('store').filter('contact', function (contact) {
          if (contact.get('status') === 'accepted') {
            return true;
          }
          return false;
        }));
      }
      App.get('WeNotification').loadNotificationCount();
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
    }
  }
});
