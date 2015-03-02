
App.AutoExpandingTextareaComponent = Ember.TextArea.extend({
  didInsertElement: function() {
    Ember.run.next(function() {
      this.$().focus(this.expandTextarea);

      this.$().on('keypress', this.expandTextarea)

      this.$().focus();

    }.bind(this));
  },

  willDestroyElement: function() {
    this.$().off('keypress');
  },

  expandTextarea: function expandTextarea() {
    var textArea = $(this);
    var newHeight = this.scrollHeight +
      parseFloat(textArea.css('borderTopWidth')) +
      parseFloat(textArea.css('borderBottomWidth'));

    while(textArea.outerHeight() < newHeight) {
      textArea.height(newHeight + 1);
    }
  }
});