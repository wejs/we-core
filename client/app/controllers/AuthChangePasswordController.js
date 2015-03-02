App.AuthChangePasswordController = Ember.ObjectController.extend({
  messages: null,

  verificarSenha: function(){
    // verificar se a senha atual esta correta
    // salvar senha ao servidor
    // enviar mensagem ao usuário de senha alterada

  },
  actions: {
    submit: function() {
      var self = this;
      var oldPassword = self.get('user.oldpassword');
      var newPassword = self.get('user.password');
      var rNewPassword = self.get('user.repeatpassword');

      var userId = App.currentUser.get('id');

      jQuery.ajax({
        type: 'post',
        url: '/change-password',
        data: JSON.stringify({
          'password' : oldPassword,
          'newPassword' : newPassword,
          'rNewPassword' : rNewPassword
        }),
        contentType: 'application/json'
      })
      .done(function(data) {
        if (data.messages) {
          self.set('messages', data.messages);
          self.set('requestSend', true);
        }else{
          Ember.Logger.warn('requestPasswordChange: Unknow success message');
        }
      })
      .fail(function(data) {
        // TODO remove this waterline validation error message
        // handle default waterline validation error message;
        if(data.responseJSON.error === 'E_VALIDATION'){
          var messages = [];
          var invalidAttributes = data.responseJSON.invalidAttributes;

          for (var fieldName in invalidAttributes){
            // TODO add suport to multiple messages for same field
            messages.push({
              status: 'danger',
              field: fieldName,
              rule: invalidAttributes[fieldName][0].rule,
              message: we.i18n(invalidAttributes[fieldName][0].message)
            });
          }
          self.set('messages', messages);
        }else if(data.responseJSON.errors){
          self.set('messages', data.responseJSON.errors);
        }else if(data.responseJSON.messages) {
          // is we.js error
          self.set('messages', data.responseJSON.messages);
        }else{
          console.error( 'Unknow error on request password: ', data );
        }
      });
    }
  }

});

