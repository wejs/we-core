App.AuthLoginController = Ember.ObjectController.extend({
  messages: [],
  loginUrl: Ember.computed.alias('App.auth.loginUrl'),

  actions: {
    //Submit the modal
    login: function() {
      NProgress.start();
      NProgress.set(0.5);
      var self = this;
      
      $.post( this.get('loginUrl') ,{
        email: this.get('email'),
        password: this.get('password')
      })
      .done(function(data) {
        // if sucessfull login reload the page
        location.reload();
      })
      .fail(function(data) {
        if (data.responseText) {
          var responseJSON = jQuery.parseJSON(data.responseText);
          // console.log('responseJSON', responseJSON);
          self.set('messages', [{
            status: 'danger',
            message: responseJSON.messages[0].message
          }]);
        } else {
          Ember.Logger.error( 'Error on login',data);
        }
      }).always(function() {
        NProgress.done(true);
      });
    },
    goToForgotPaswordPage: function(){
      this.get('router').transitionTo('authForgotPassword');
    },

    goToRegisterPage: function(){
      this.get('router').transitionTo('authRegister');
    }
  }
});
