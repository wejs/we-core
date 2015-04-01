var registerUrl = '/signup';

App.AuthRegisterController = Ember.ObjectController.extend({
  messages: [],

  isVisible: true,
  attributeBindings: ['isVisible'],

  defaultlanguages: ['pt-br', 'en-us'],

  init: function(){
    this._super();
    var self = this;

    if( App.get('currentUser.id') ) {
      this.set('isVisible', false);
    }

    we.hooks.on('user-authenticated',function(user, done){
      self.set('isVisible', false);
      done();
    });

    we.hooks.on('user-unauthenticated',function(user, done){
      self.set('isVisible', true);
      done();
    });
  },
  actions: {
    showRequireActivationMessage: function() {
      this.set('model.showRequireActivation', true);
    },
    submit: function() {
      var self = this;
      var user = this.get('user');
      self.set('messages',[]);
      $.post(registerUrl,user)
      .done(function(data) {
        if (data && data.messages) {
          if (
            data.messages[0].extraData &&
            data.messages[0].extraData.requireActivation
          ) {
            self.send('showRequireActivationMessage');
          }

          self.set('messages', data.messages);
        } else if (data.user || (data.active && data.id) ) {
          location.href = '/';
        } else if (data.success) {
          self.set('messages', data.success);
        } else {
          console.warn('A unknow message in user register', data);
        }
      })
      .fail(function(data) {
        if (data.responseJSON.messages) {
          self.set('messages', data.responseJSON.messages);
        } else {
          Ember.Logger.error( 'Unknow error on register: ', data );
        }
      });

    }
  }
});
