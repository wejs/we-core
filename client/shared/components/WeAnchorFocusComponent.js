App.WeAnchorFocusComponent = Ember.Component.extend({
  tagName: 'a',
  didInsertElement: function() {
    this._super();
    $('html,body').scrollTop( this.$().offset().top );
  }
});