
  App.UserMenuController = Ember.Controller.extend({
    isVisible: false,

    currentUser: function () {
      return App.get('currentUser');
    }.property('App.currentUser'),

    adminMenu: function (){
      if (this.get('currentUser.isAdmin') || this.get('currentUser.isModerator')) return true;
      return false;
    }.property('currentUser'),

    init: function() {
      var self = this;
      if(App.currentUser.id){
        self.set('isVisible', true);
      }
      we.hooks.on("user-authenticated",function(user, done){
        self.set('isVisible', true);
        done();
      });
      we.hooks.on("user-unauthenticated",function(user, done){
        self.set('isVisible', false);
        done();
      });
    },
    actions: {
      showAvatarChangeModal: function(){
        we.events.trigger('showAvatarChangeModal', {
          user: this.get('model')
        });
      }
    }
  });

