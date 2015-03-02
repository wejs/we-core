
App.WeTootipComponent = Ember.Component.extend({
  tagName: 'span',

  layout: Ember.Handlebars.compile('{{text}}'),

  didInsertElement: function() {
    this._super();
    this.$().tooltip({
      placement: 'right'
    });
  }
});
