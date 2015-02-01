
App.ApplicationController = Ember.Controller.extend({
  App: App,

  title: function() {
    return App.appName;
  }.property('App.appName'),
  subTitle: function() {
    return App.appAbout;
  }.property('App.appAbout'),

  breadCrumb: 'Inicio',
  resetQuery: null,
  // is connected in socket.io?
  isConnected: false,

  auth: function() {
    return App.get('auth');
  }.property('App.auth'),

  configs: function() {
    return App.get('configs');
  }.property('App.configs'),

  showOauthLogin: function() {
    if(App.get('auth.isConsumer') && !App.get('auth.devLogin')) {
      return true;
    }
    return false;
  }.property('App.auth.isConsumer'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser'),

  isAuthenticated: function(){
    if(App.auth.get('isAuthenticated') ) {
      return true;
    }else{
      return false;
    }
  }.property('App.auth.isAuthenticated'),

  init: function() {
    this._super();
    this.setConnectionStatus();
  },

  setConnectionStatus: function() {
    var self = this;
    if(window.io.socket.socket && window.io.socket.socket.connected){
      self.setProperties({
        isConnected: true,
        status: we.i18n('connected')
      });
    }
    we.events.on('socketIoConnect',function(){
      self.setProperties({
        isConnected: true,
        status: we.i18n('connected')
      });
    });
    we.events.on('socketIoDisconnect',function(){
      self.setProperties({
        isConnected: false,
        status: we.i18n('disconnected')
      });
    });
    we.events.on('socketIoReconnect',function(){
      self.setProperties({
        isConnected: true,
        status: we.i18n('connected')
      });
    });
    we.events.on('socketIoReconnecting',function(){
      self.setProperties({
        isConnected: false,
        status: we.i18n('reconnecting')
      });
    });
  }

});
