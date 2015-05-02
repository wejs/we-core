App.WeCarouselComponent = Ember.Component.extend({
  didInsertElement: function() {
    this.$('#home-carousel').carousel();
  }
});