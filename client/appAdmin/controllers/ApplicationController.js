
App.ApplicationController = Ember.Controller.extend({
  breadCrumb: 'Inicio',
  isAuthenticated: function(){
    if(App.auth.get('isAuthenticated') ) {
      return true;
    }else{
      return false;
    }
  }.property('App.auth.isAuthenticated')
});
