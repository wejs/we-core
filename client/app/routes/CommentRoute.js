App.CommentItemRoute = Ember.Route.extend({
	actions: {
		commentDeleted: function(comment){
		  this.currentModel.comments.removeObject(post);
		}
	}
});
