App.WeAccountModalComponent = Ember.Component.extend({
  classNames: ['modal', 'fade'],
  attributeBindings: ['id'], 
  id: 'we-account-modal',
  toogle: true,
  user: null,

  invalidPassword: function (){
    if (!this.get('newPassword') || !this.get('confirmNewPassword')) return true;
    if (this.get('newPassword') !== this.get('confirmNewPassword')) return true;
    return false;
  }.property('newPassword', 'confirmNewPassword'),

  hidden: function() { 
    jQuery('#' + this.get('id')).on('hidden.bs.modal', function() {
      this.resetModelState();
    }.bind(this));
  }.on('didInsertElement'),

  resetModelState: function(){
    this.set('newPassword', null);
    this.set('confirmNewPassword', null);
    this.set('linkToReset', null);
  },

  actions: {
    tabLink: function () {
      // body...
      this.set('toogle', true);
    },

    tabPassword: function(){
      this.set('toogle', false);
    },

    generateResetLink: function (){
      var self = this;
      var accounts = we.configs.server.providers.accounts;
      var url = accounts + '/auth/auth-token';

      Ember.$('.generate-reset-link').button('loading');

      return Ember.$.ajax({
        url: url,
        dataType: 'json',
        type: 'POST',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        data: {
          email: self.get('user.email')
        }
      }).then(function (response){
        self.set('linkToReset', response);
        Ember.$('.generate-reset-link').button('reset');
      }, function (error){
        console.log(error);
        Ember.$('.generate-reset-link').button('reset');
        Ember.$('.we-account-modal-error').text(error.message);
        self.set('error', true);
        setTimeout(function (){
          self.set('error', false);
        }, 2000);        
      });
    },

    setNewPassword: function(){
      var self = this;
      var accounts = we.configs.server.providers.accounts;
      var url = '';
      var user = {};
      user.newPassword = this.get('newPassword');
      if (!user.username) user.username = this.get('user.username');

      Ember.$('.set-new-password-button').button('loading');

      if (this.get('user.idInProvider')){
        url = accounts + '/user/' + this.get('user.idInProvider');

        return Ember.$.ajax({
          url: url,
          dataType: 'json',
          type: 'PUT',
          crossDomain: true,
          xhrFields: {
            withCredentials: true
          },
          data: user
        }).then(function(response){
          console.debug('sucesso:', response);
          Ember.$('.set-new-password-button').button('reset');
          self.set('success', true);
          setTimeout(function (){
            self.set('success', false);
          }, 2000);
        }, function (error){
          console.debug('error: ', error);
          Ember.$('.set-new-password-button').button('reset');
          Ember.$('.we-account-modal-error').text(error.message);
            self.set('error', true);
            setTimeout(function (){
              self.set('error', false);
          }, 2000);          
        });

      } else {
        url = accounts + '/user?email=' +  this.get('user.email');

        return Ember.$.ajax({
          url: url,
          dataType: 'json',
          type: 'GET',
          crossDomain: true,
          xhrFields: {
            withCredentials: true
          }
        }).then(function (response){
          if (!response.user[0]) throw 'No user found with this email on provider';

          url = accounts + '/user/' + response.user[0].id;

          return Ember.$.ajax({
            url: url,
            dataType: 'json',
            type: 'PUT',
            crossDomain: true,
            xhrFields: {
              withCredentials: true
            },
            data: user
          }).then(function(response){
            console.debug('sucesso:', response);
            Ember.$('.set-new-password-button').button('reset');
            self.set('success', true);
            setTimeout(function (){
              self.set('success', false);
            }, 2000);
          }, function(error){
            console.debug('error: ', error);
            Ember.$('.set-new-password-button').button('reset');
            Ember.$('.we-account-modal-error').text(error.message);
            self.set('error', true);
            setTimeout(function (){
              self.set('error', false);
            }, 2000);
          });

        });     
      }
    }
  }
});

