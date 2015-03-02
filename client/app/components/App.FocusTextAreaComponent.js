(function($, we, Ember, App){

  App.FocusTextareaComponent = Ember.TextArea.extend({
    didInsertElement: function() {
      this.$().focus();
    }
  });

})(jQuery, we, Ember, App);