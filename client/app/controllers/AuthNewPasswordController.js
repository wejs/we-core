App.AuthNewPasswordController = Ember.ObjectController.extend({
  messages: null,

  newPasswordURL: Ember.computed.alias('App.auth.loginUrl'),

  actions: {
    // alias for submit
    setNewPassword: function () {
      this.send('submit');
    },

    submit: function() {
      NProgress.start();
      NProgress.set(0.5);

      var self = this;
      var newPassword = self.get('user.password');
      var rNewPassword = self.get('user.repeatpassword');

      $.post(we.configs.server.providers.accounts + '/change-password', {
        newPassword: this.get('newPassword'),
        rNewPassword: this.get('rNewPassword')
      })
      .done(function(data) {
        alert(data.messages[0].message);
        NProgress.done(true);
        self.transitionToRoute('home');
      })
      .fail(function(data) {
        NProgress.done(true);        
        if (data.responseJSON.messages) {
          self.set('messages', data.responseJSON.messages);  
        } else {
          Ember.Logger.error('Unknow error on change password:', data.responseJSON);
        }        
      });
    }
  }
});
