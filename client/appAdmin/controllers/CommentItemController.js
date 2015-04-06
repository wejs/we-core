App.CommentItemController = Ember.ObjectController.extend({
  isSaving: false,

	actions: {
		edit: function() {
			this.set('isEditing', true);
		},
    sendComment: function(){
      var self = this;
      this.set('isSaving', true);
      this.get('model').save().then(function() {
        if(self.isDestroyed) return;
        self.set('isSaving', false);
      });
      this.set('isEditing', false);
    },
    closeComentTextarea: function(){
      this.set('isEditing', false);
    },
    deleteComment: function() {
      var userConfirmation = confirm(Ember.I18n.t('comment.delete.confirm'));
      if (userConfirmation === true) {
        this.get('model').destroyRecord();
      }
    }
	}
});