App.AuthForgotPasswordController = Ember.ObjectController.extend({
  requestSend: false,
  messages: [],

  actions: {
    //Submit the modal
    requestPasswordChange: function() {
      var self = this;
      NProgress.start();
      NProgress.set(0.5);

      var email = this.get('email');
      jQuery.post('/auth/forgot-password',{
        email: email
      })
      .done(function(data) {
        console.log(data);
        if (data.messages) {
          self.set('messages', data.messages);
          self.set('requestSend', true);
        } else {
          console.warn('requestPasswordChange: Unknow success message');
        }
      })
      .fail(function(data) {
        if (data.responseJSON.messages) {
          self.set('messages', data.responseJSON.messages);
        } else {
          Ember.Logger.error( 'Unknow error on request password: ', data.responseJSON);
        }
      }).always(function() {
        NProgress.done(true);
        $('html, body').animate({ scrollTop: 0 });
      });
    }
  }
});

