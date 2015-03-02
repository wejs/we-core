/**
 * Modal para ações do sistema que necessitam que o usuário esteja autenticado 
 */

App.WeAuthModalNeedLoginComponent = Ember.Component.extend({
  loginUrl: function() {
    return App.get('auth.loginUrl') + '?service=' + App.get('auth.serviceName');
  }.property('App.auth'),

  registerUrl: function() {
    return App.get('auth.register') + '?service=' + App.get('auth.serviceName');
  }.property('App.auth')

});
