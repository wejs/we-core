App.Router.map(function() {
  // auth
  this.route('authForgotPassword',{path: '/auth/forgot-password'});
  this.route('authNewPassword',{path: '/auth/:id/new-password'});
  this.route('authChangePassword',{path: '/change-password'});

  this.route('authLogin',{path: '/login'});
});

App.AuthLoginRoute = Ember.Route.extend(App.UnAuthenticatedRouteMixin, {
  renderTemplate: function (){
    this.render('auth/Login');
  },
  model: function() {
    return {
      email: '',
      password: '',
      messages: [],

      auth: App.auth
    };
  },

  actions: {
    //Submit the modal
    login: function() {
      var self = this;

      $.post('/auth/login',{
        email: this.get('currentModel.email'),
        password: this.get('currentModel.password')
      })
      .done(function(data) {
        if (data.id || data.user) {
          location.reload();
        } else {
          if (data.messages) {
            self.set('currentModel.messages', data.messages);
          }
        }
      })
      .fail(function(data) {
        if (data.responseJSON) {
          self.set('currentModel.messages', data.responseJSON.messages);
        }else{
          Ember.Logger.error( 'Error on login', data);
        }
      });
    },
  }
});

App.AuthNewPasswordRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('auth/NewPassword');
  },
  beforeModel: function(transition) {
    var self = this;
    return new Ember.RSVP.Promise(function(resolve) {
      $.ajax({
        url: '/api/v1/auth/check-if-can-reset-password'
      }).done(function(){
        return resolve();
      }).fail(function() {
        transition.abort();
        self.transitionTo('authForgotPassword');
      })
    });
  },
  model: function(params) {
    return {
      currentUser: App.currentUser,
      userId: params['id'],
      requestSend: false
    };
  },
  afterModel: function (model) {
    // user cant update password from others users un server api
    if (model.currentUser.get('id') != model.userId) this.transitionTo('home');
  }
});

App.AuthChangePasswordRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('auth/ChangePassword');
  },
  model: function() {
    return {
      user: { 'password':'', 'oldpassword':'', 'repeatpassword':'' }
    };
  }
});

App.AuthForgotPasswordRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('auth/ForgotPassword');
  },
  model: function() {
    return {
      email: '',
      messages: [],
    };
  }
});
