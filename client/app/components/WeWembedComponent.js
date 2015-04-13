
App.WeWembedComponent = Ember.Component.extend({
  isLoading: false,
  isVideo: false,
  isPage: false,

  // if is editing show delete button
  // and disable links
  isEditing: false,

  // video flags
  isPlaying: false,
  videoEmbedSrc: null,

  imageIndex: 0,

  wembedApiUrl: function(){
    return App.get('wembedApiUrl');
  }.property('App.wembedApiUrl'),

  // events
  deleteWembedEvent: 'onDeleteWembed',

  init: function(){
    this._super();
    if (!this.get('url')) {
      console.error('Wembed url not found');
      return;
    } else {
      this.send('getWembedData');
    }
  },
  onChangeUrl: function onChangeUrl() {
    this.send('getWembedData');
  }.observes('url'),

  image: function imageComputedProperty(){
    var images = this.get('wembed.images');
    if (!images) {
      return null;
    }

    if (images[this.get('imageIndex')]) {
      return images[this.get('imageIndex')];
    }

    return images[0];
  }.property('imageIndex', 'wembed.images'),

  wembedImageActionClass: function () {
    return 'wembed-images-action total-'+this.get('wembed.images.length');
  }.property('wembed.images.length'),

  showImageSelector: function(){
    if(
      this.get('wembed.images.length') &&
      this.get('wembed.images.length') -1
    ) {
      return this.get('wembed.images.length');
    }

    return false;
  }.property('wembed.images.length'),

  actions: {
    changeWembedImage: function(index){
      this.set('imageIndex',index);
    },

    getWembedData: function() {
      var self = this;

      if (!this.get('url')) return;

      this.set('isLoading', true);

      var wembedUrl = this.get('wembedApiUrl') + this.get('url');
      Ember.$.getJSON(wembedUrl)
      .done(function (data) {
        if(self.isDestroyed) return;
        if(data.page){
          self.set('wembed', data.page);
          // set page type
          self.send('setType');
        }
      })
      .fail(function() {
        console.error('Error on get Wembed JSON! for link', wembedUrl);
      }).always(function() {
        if(self.isDestroyed) return;
        self.set('isLoading', false);
      });
    },
    setType: function(){
      this.send('resetType');
      if(this.get('isEditing')){
        return;
      }

      switch( this.get('wembed.pageType') ){
        case 'video':
          this.set('isVideo',true);
          break;
        default:
          this.set('isPage',true);
      }
    },

    resetType: function(){
      this.set('isVideo',false);
      this.set('isVideo',false);
    },

    playVideo: function(){
      var videoId = this.get('wembed.pageId');

      this.set('videoEmbedSrc', '//www.youtube.com/embed/' + videoId + '?autoplay=1');
      this.set('isPlaying', true);

    },

    deleteWembed: function(){
      console.warn('delete wembed');
      this.sendAction('deleteWembedEvent');
    }
  }
});
