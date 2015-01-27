
App.LoggedInMixin = Ember.Mixin.create({
  isVisible: function(){
    if( App.get('auth.isAuthenticated') ){
      return true;
    }else{
      return false;
    }
  }.property('App.auth.isAuthenticated')
});
