
App.HomeRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('home');
  },
  model: function() {
    // authenticated model
    // if (App.get('currentUser.id')) {
    //   return Ember.RSVP.hash({
    //     posts: this.store.find('post'),
    //     postNew: App.postClean()
    //   });
    // }
    // default unautenticated
    return {};
  }
});
