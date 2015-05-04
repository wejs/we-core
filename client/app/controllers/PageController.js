
App.PageController = Ember.ObjectController.extend({
  headerImage: function() {
    if (this.get('selectedPreviewImage')) {
      return this.bgStyle(this.get('selectedPreviewImage'));
    }
    var image = this.get('record.featuredImage');
    if(image && image.get('urls')) {
      return this.bgStyle( image.get('urls').original );
    }
    return this.bgStyle();
  }.property('record.featuredImage.urls', 'selectedPreviewImage'),

  bgStyle: function(url) {
    if(!url) url = this.get('defaultHeaderImage');
    return 'background-image: url("'+ url +'");';
  },

  defaultHeaderImage: function() {
    if (App.get('configs.client.publicVars.showDefaultArticleImage')) {
      return App.get('configs.client.publicVars.blogArticlesBg');
    } else {
      return '';
    }
  }.property('App.configs.client.publicVars.blogArticlesBg'),

});
