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

      var host = Ember.get(App, 'configs.auth.oauth.server') || '';

      $.post( host + '/change-password', {
        newPassword: this.get('newPassword'),
        rNewPassword: this.get('rNewPassword')
      })
      .done(function(data) {
        alert(data.messages[0].message);
        self.transitionToRoute('home');
      })
      .fail(function (data) {
        if (data.responseJSON.messages) {
          self.set('messages', data.responseJSON.messages);
        } else {
          Ember.Logger.error('Unknow error on change password:', data.responseJSON);
        }
      })
      .always(function(){
        NProgress.done(true);
      });
    }
  }
});
