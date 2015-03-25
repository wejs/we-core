WeApplicationRoutesMixin = Ember.Mixin.create({
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
      if (error.status == 403) {
        Ember.Logger.error('403 error', error);
        this.transitionTo('403');
        //go to some default route
      } else if (error.status == 401) {
        Ember.Logger.error('401 error',error);
        //handle 401
      } else if (error.status == 500) {
        Ember.Logger.error('500 error', error);
        this.transitionTo('500');
        //handle 401
      } else if (error.status == 404) {
        // send to 404 page
        this.transitionTo('404');
      } else {
        Ember.Logger.error('Unhandled error on route', error.stack, error);
      }
    }
  }
});
