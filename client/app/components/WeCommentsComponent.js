
App.inject( 'component:we-comments', 'store', 'store:main' );

App.WeCommentsComponent = Ember.Component.extend({
  isLoading: true,

  commentedModelName: null,
  commentedModelId: null,

  commentsPerLoad: 1000,
  startsWith: 4,

  comments: [],

  meta: null,

  hasMoreComments: function(){
    if (this.get('meta.count') > this.get('comments.length')) {
      return true;
    } else {
      return false;
    }
  }.property('meta.count', 'comments'),

  setCommentFilterList: function setCommentFilterList() {
    var modelName  = this.get('commentedModelName');
    var modelId  = this.get('commentedModelId');

    if (!modelName || ! modelId) {
      //commentedModelName and commentedModelId is required for use we-comments
      this.set('comments', null);
    } else {
      this.set('comments', this.store.filter('comment', function(resource) {
        if (
          Ember.get(resource, 'modelName') == modelName &&
          Ember.get(resource, 'modelId') == modelId
        ) {
          return true;
        }
        return false;
      }))
    }

  }.observes('commentedModelName', 'commentedModelId').on('init'),

  didInsertElement: function didInsertElement() {
    this._super();
    this.send('loadComments', this.get('startsWith') );
  },

  actions: {
    loadAllComments: function() {
      this.send('loadComments', 1000);
    },
    loadComments: function(limit) {
      var self = this;
      this.set('isLoading', true);

      var modelName  = this.get('commentedModelName');
      var modelId  = this.get('commentedModelId');

      if (!limit) limit = self.get('commentsPerLoad');

      this.store.find('comment', {
        modelName: modelName,
        modelId: modelId,
        limit: limit,
        sort: 'createdAt DESC'
      }).then(function(res) {
        self.set('meta', res.meta);
        self.set('isLoading', false);
      }).catch(function (res) {
        Ember.Logger.error('Error on get comments from server', res);
      });
    }
  }
});

