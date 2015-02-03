
/** Copyright 2014, Alberto Souza
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

// starts we.js lib
// TODO move this to ember logic

(function($, we, Ember, App){

  App.postClean = function(){
    return  {
      body: '',
      'isOpen': false,
      'shareboxClass': 'small',
      'shareImages': false,
      'files': [],
      'sharedIn': [],
      'sharedWith': [],
      'images': [],
      'videos': [],
      'links':[],
      'wembed': null,
      'newWembed': null
    };
  };

  // configure moment.js
  moment.lang(we.config.language);

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

  // -- current user object
  App.CurrentUserObject = Ember.Object.extend({
    shareWithOptions: [],
    mentionOptions: [],
    init: function(){
      this.loadShareWithOptions();
    },
    /**
     * Check if user is authenticated
     * TODO move to auth
     * @return {Boolean} [description]
     */
    isAuthenticated: function checkIfAreAuthenticated(){
      if(this.get('id')) return true;
      return false;
    },
    /**
     * Per Load current user shareWith options from server
     */
    loadShareWithOptions: function(){
      var _this = this;
      var userId = this.get('id');
      if(!userId){
        return;
      }

      var domain = we.configs.server.providers.accounts;

      $.ajax({
        type: 'GET',
        url: domain+'/user/'+userId+'/contacts-name',
        cache: false,
        dataType: 'json',
        contentType: 'application/json'
      })
      .done(function success(data){
        if(data.length){

          var mentions = data.map(function(option){
            return option.text;
          });

          _this.setProperties({
            'shareWithOptions': data,
            'mentionOptions': mentions
          });

        }
      })
      .fail(function error(data){
        console.error('Error on get share with list', data);
      });
    }
  });

  // wait document ready ...
  $( document ).ready(function() {
    we.bootstrap(function() {
      // configure moment.js
      moment.lang(Ember.get(we,'configs.client.language'));
      // remove noscripts tags on start
      $('noscript').remove();

      var serviceName = we.configs.client.publicVars.oauthNetworkServiceName;
      if (!serviceName) {
        serviceName = 'network';
      }

      // set wembed api url
      App.set('wembedApiUrl', Ember.get(we, 'configs.server.providers.wembed') + '/api/v1/json?url=');


      // create auth object and set default vars
      App.auth = Ember.auth.create({
        serviceName: serviceName,
        token: we.configs.client.publicVars.authToken,
        domain: we.configs.server.providers.cookieDomain,
        loginUrl: we.configs.server.providers.accounts+ '/login',
        logoutUrl: we.configs.server.providers.accounts+ '/auth/logout',
        register: we.configs.server.providers.accounts+ '/signup'
      });


      App.advanceReadiness();

      // /**
      //  * this config allows change the main api end point to other url
      //  */
      // if (we.configs.server.providers.api) {
      //   // set api host after we.js get server and cliend configs
      //   App.ApplicationAdapter.reopen({
      //     'host': we.configs.server.providers.api
      //   });
      // }

      // if( App.get('auth.isAuthenticated') ) {
      //   return App.advanceReadiness();
      // } else {
      //   // if user dont are logged in send it to authentication
      //   return App.auth.authenticate();
      // }
      // //App.get('WeNotification').loadNotificationCount();
    });
  });


})(jQuery, we, Ember, App);

