
/**
 * Add this on one route to scroll to top every time enter in the route
 */
App.ResetScrollMixin = Ember.Mixin.create({
  actions: {
    didTransition: function() {
      window.scrollTo(0,0);
    }
  }
});