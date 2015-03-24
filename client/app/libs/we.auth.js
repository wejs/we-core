
// // -- Auth Object --
// // TODO move to one bower component
// Ember.auth = Ember.Object.extend({
//   /**
//    * Check if user is authenticated
//    * @return {Boolean}
//    */
//   isAuthenticated: function(){
//     if(App.currentUser.id) return true;
//     return false;
//   }.property('App.currentUser.id'),

//   userOauthServer: false,

//   // flags to check if is provider or consumer
//   isProvider: false,
//   isConsumer: true,
//   devLogin: false,

//   serviceName: 'network',
//   loginUrl: '/login',
//   logoutUrl: '/logout',
//   domain: '.wejs.org',
//   token: {},
//   init: function init () {

//     this.set('isConsumer', we.configs.client.isConsumer);
//     this.set('isProvider', we.configs.client.isProvider);
//     this.set('devLogin', we.configs.client.publicVars.devLogin);

//     var token = this.get('token');
//     // if auth token dont are set try to get it from cookie
//     if( !token ) {
//       token = this.getCookieToken();
//       // if dont have a token exit
//       if(!token ) return;
//       // else set token get from cookie
//       this.set('token', token);
//     }

//     $.ajaxSetup({
//       headers: {
//         'Authorization': 'Bearer '+ token
//       }
//     });
//   },
//   authenticate: function authenticate(){
//     location.href = this.get('loginUrl') + '?service=' + this.get('serviceName');
//   },
//   registerUser: function register(){
//     location.href = this.get('register') + '?service=' + this.get('serviceName');
//   },
//   refreshToken: function refreshToken(){

//   },
//   getAccessToken: function getAccessToken(){

//     if(this.get('token')) {
//       return this.get('token');
//     }

//     var tokenObj = this.getCookieToken();

//     if(tokenObj){
//       return tokenObj;
//     }
//     return null;
//   },

//   setTokenOnData: function (data) {
//     var token = App.auth.getAccessToken();
//     if (token) {
//       data.access_token = App.auth.getAccessToken();
//     }
//   },

//   saveToken: function saveToken (tokenObj, cb) {
//     // configure jquery ajax
//     $.ajaxSetup({
//       data: {
//         access_token: tokenObj.token
//       }
//     });

//     if(tokenObj.user){
//       delete tokenObj.user;
//     }

//     // save in auth object / memory
//     this.set('token', tokenObj);
//     // save token in cookie
//     $.cookie('weAuthToken', tokenObj.token, {
//       expires: 365,
//       path: '/',
//       domain: this.get('domain')
//     });

//     // save the reset token in cookie
//     $.cookie('weResetAuthToken', tokenObj.refreshToken, {
//       expires: 365,
//       path: '/',
//       domain: this.get('domain')
//     });

//     if(cb) cb();
//   },

//   getCookieToken: function getCookieToken () {
//     return $.cookie('weAuthToken');
//   },

//   logOut: function logOut(cb) {
//     $.ajaxSetup({
//       headers: {}
//     });

//     $.removeCookie('weAuthToken',{
//       expires: 365,
//       path: '/',
//       domain: this.get('domain')
//     });

//     // logout from current server
//     $.ajax({
//       url: this.get('logoutUrl')
//     })
//     .always(function() {
//       cb();
//     });
//   },

//   getCurrentUser: function (cb){
//     if(!cb) cb = function(){};

//     // try to get it from we.js preloaded current user config
//     if(we.authenticatedUser && we.authenticatedUser.id) {
//       App.currentUser = App.CurrentUserObject.create(we.authenticatedUser);
//       return cb(null, App.currentUser);
//     }

//   }

// });