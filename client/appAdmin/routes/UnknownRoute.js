App.UnknownRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('404');
  }
});