
/**
 * Add this on one route to scroll to top every time enter in the route
 */
App.ResetScrollMixin = Ember.Mixin.create({
  activate: function() {
    this._super();
    window.scrollTo(0,0);
  }
});