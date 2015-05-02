/**
 * @file Manages modal Avatar change feature, has upload, crop and setNew avatar
 * @author Alberto Souza
 */
// inject store
App.inject( 'component:we-avatar-modal', 'store', 'store:main' );

App.WeAvatarModalComponent = Ember.Component.extend({
  url: '/api/v1/image',
  attributeBindings: ['user'],
  file: null,
  files: {},
  salvedImage: {},
  imageSelected: false,
  cropImageData: {},
  isLoading: false,
  init: function(){
    this._super();
    we.events.on('showAvatarChangeModal',this.onShowAvatarChangeModal.bind(this));
  },
  filesDidChange: function() {
    if (Ember.isEmpty(this.get('files'))) return;
    this.set('file',this.get('files').item(0));
  }.observes('files'),
  onShowAvatarChangeModal: function(data){
    this.set('user', data.user);
    $('#avatarChangeModal').modal('show');
  },
  willDestroyElement: function(){
    we.events.off('showAvatarChangeModal',this.onShowAvatarChangeModal);
  },

  hideAction: function (){
    var file = this.get('file');
    return Ember.isNone(file);
  }.property('file'),

  actions: {
    show: function(){
      $('#avatarChangeModal').modal('show');
    },
    close: function(){
      $('#avatarChangeModal').modal('hide');
      this.send('clean');
    },
    clean: function(){
      this.setProperties({
        cropImageData: null,
        salvedImage: null,
        file: null,
        imageSelected: false
      });
    },
    selectFile: function(){
      var self = this;
      var file = this.get('file');

      var uploader = Ember.Uploader.create({
        url: this.get('url'),
        type: 'POST',
        paramName: 'image'
      });

      if (!Ember.isEmpty(file)) {

        self.set('isLoading',true);

        var promisseUpload = uploader.upload(file);
        promisseUpload.then(function(data) {
          self.set('salvedImage',data.image[0]);
          self.set('imageSelected', true);

          self.set('isLoading',false);
        }, function(error) {
          // Handle failure
          self.set('isLoading',false);
          console.error('error on upload avatar', error);
        });
      }
    },
    cropAndSave: function(){
      var self = this;
      var cords = this.get('cropImageData');
      var imageId = this.get('salvedImage.id');

      self.set('isLoading',true);

      $.ajax({
        type: 'post',
        url: '/api/v1/image-crop/' + imageId,
        data:  JSON.stringify(cords),
        contentType: 'application/json'
      }).done(function(newImage) {
        self.get('store').push('image', newImage.image);
        self.send('saveAvatar');
      }).fail(function(e){
        console.error('Error on image crop',e);
      });
    },

    saveAvatar: function() {
      var self = this;
      var image = this.get('salvedImage');
      var userId = App.currentUser.get('id');

      $.ajax({
        type: 'post',
        url: '/api/v1/user/'+ userId +'/avatar',
        data: JSON.stringify({
          image: image.id
        }),
        contentType: 'application/json'
      }).done(function (data) {
        // set current user avatar
        App.currentUser.set('avatar', self.get('store').find('image', image.id));
        // close modal
        self.send('close');
        // triger event change modal
        we.events.trigger('userAvatarChange', data);
      }).fail(function(e){
        /* @TODO handle set avatar errors */
        console.error('Error on image crop',e);
      }).always(function() {
        self.set('isLoading',false);
      });
    }
  }
});
