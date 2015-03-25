// enable ember.js query params
window.ENV = {FEATURES: {'query-params-new': true}};
Ember.FEATURES['query-params-new'] = true;

Ember.WeApplication = Ember.Application.extend({
  // authenticated user
  currentUser: {},

  configs: Ember.Object.create({
    vocabularyId: 1,
    imageUploadUrl: '/api/v1/images',
    wembedApiUrl: '',
    locale: 'pt-br',

    notifications: true,

    permissionHost: ''
  }, window.WE_BOOTSTRAP_CONFIG),

  // ember application reary event
  ready: function () {
    if (window.WeNotification && this.get('configs.notifications') ) {
      this.set('WeNotification', window.WeNotification.create());
    }

    // dev configs
    if ( !window.PRODUCTION_ENV ) {
      // basic logging of successful transitions
      this.set('LOG_TRANSITIONS', true);
      // detailed logging of all routing steps
      this.set('LOG_TRANSITIONS_INTERNAL', true);
      this.set('LOG_VIEW_LOOKUPS', true);
    }
  },

  auth: {
    token: null,
    cookieName:  window.WE_BOOTSTRAP_CONFIG.auth.cookieName,
    cookieDomain: window.WE_BOOTSTRAP_CONFIG.auth.cookieDomain,
    cookieSecure: window.WE_BOOTSTRAP_CONFIG.auth.cookieSecure,

    /**
     * Check if user is authenticated
     * @return {Boolean}
     */
    isAuthenticated: false,

    // (function(){
    //   if( App.get('currentUser.id') ) return true;
    //   return false;
    // }.property('App.currentUser.id')),

    init: function() {
      var token = this.token;
      if (!token) {
        token = this.getToken();
        if (!token) return;
        this.token = token;
      }

    },

    login: function login(user) {
      if (!this.token) {
        this.token = this.getToken();
      }

      App.set('currentUser', user);
      App.set('auth.isAuthenticated', true);
    },

    logOut: function logOut() {
      $.removeCookie( this.cookieName ,{
        expires: 365,
        path: '/',
        domain: this.cookieDomain
      });

      App.set('currentUser', null);
      App.set('auth.isAuthenticated', false);
    },

    saveToken: function saveToken (token) {
      // save in auth object / memory
      this.token = token;
      // save token in cookie
      $.cookie( this.cookieName , token, {
        expires: 365,
        path: '/',
        domain: this.cookieDomain,
        secure: this.cookieSecure
      });
    },

    getToken: function getAccessToken(){
      if (this.token) return this.token;
      return $.cookie( this.cookieName );
    },

    loadCurrentUser: function(store) {
      return $.getJSON('/account')
      .done(function afterLoadCurrentUser(data) {
        // if user is logged in
        if (data.user) {
          if (data.user.id) {
            App.set('currentUser', store.push('user', data.user));
          } else {
            App.set('currentUser', store.push('user', data.user[0]));
          }

          App.set('auth.isAuthenticated', true);
        }
      })
      .fail(function(data) {
        // forbbiden or user is offline
        if(data.status === 403) return App.auth.logOut();

        Ember.Logger.error('Error on get current user data' , data);
        // auth token is invalid
        // TODO refresh auth token
        if(data.status === 400 && !data.responseJSON.isValid){
          App.auth.logOut();
        }
      })
    }
  }
});
