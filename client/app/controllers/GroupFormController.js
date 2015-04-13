App.GroupFormController = Ember.ObjectController.extend( App.ImageSelectorMixin, {
  vocabularyId: function() {
    return App.get('vocabularyId');
  }.property('App.vocabularyId'),

  categories: null,
  tags: null,

  isSaving: false,

  url: '/api/v1/images/',
  file: null,
  files: {},

  privacityList: [],

  init: function() {
    this._super();
    this.set('privacityList',[
      {
        label: Ember.I18n.t('Public'),
        value:'public'
      },
      {
        label: Ember.I18n.t('Restrict'),
        value:'restrict'
      },
      {
        label: Ember.I18n.t('Hidden'),
        value:'hidden'
      }
    ]);
  },
  filesDidChange: function() {
    this.set('file',this.get('files')[0]);
  }.observes('files'),
  actions:{
    saveRecord: function() {
      var self = this;
      var data = this.get('record');
      var record;

      if (!data.id) {
        record = this.get('store').createRecord('group', data);
      } else {
        record = data;
      }

      var featuredImage = this.get('imageToSave');

      this.set('isSaving', true);

      this.send('saveImage', featuredImage, function(err, salvedImage) {
        if (featuredImage && salvedImage) {
          record.set('featuredImage', salvedImage);
        }

        record.save().then(function(r) {
          self.set('isSaving', false);
          self.transitionToRoute('group', r.id);
        })
      });
    },

    cancel: function() {
      var record = this.get('record');

      if (record.id) {
        record.rollback();
        this.transitionToRoute('group', record.id);
      } else {
        this.transitionToRoute('groups');
      }
    }

    // selectFile: function(){

    //   var self = this;
    //   var uploadUrl = this.get('url');
    //   var file = this.get('file');

    //   var uploader = Ember.Uploader.create({
    //     url: uploadUrl,
    //     type: 'POST',
    //     paramName: 'images'
    //   });

    //   if (!Ember.isEmpty(file)) {
    //     self.set('isLoading',true);
    //     var promisseUpload = uploader.upload(file);

    //     promisseUpload.then(function(data) {

    //       self.set('salvedImage',data.images[0]);
    //       self.set('imageSelected', true);
    //       self.set('isLoading',false);

    //     }, function(error) {
    //       // Handle failure
    //       console.error('error on upload avatar', error);
    //     });
    //   }
    // },
    // cropAndSave: function(){
    //   var self = this;
    //   var cords = this.get('cropImageData');
    //   var imageId = this.get('salvedImage.id');

    //   // make image upload on create group opcional
    //   if(self.get('imageSelected')){
    //     // cortando a imagem
    //     Ember.$.ajax({
    //       type: 'get',
    //       url: '/api/v1/images-crop/'+ imageId,
    //       data: cords,
    //       contentType: 'application/json'
    //     }).done(function(newImage){
    //       self.get('store').push('image', newImage.image);
    //       self.send('createGroup');
    //     }).fail(function(e){
    //       console.error('Error on image crop',e);
    //     });

    //   }else{
    //     self.send('createGroup');
    //   }
    // },
    // createGroup: function(){
    //   var self = this;
    //   var group = this.get('group');

    //   self.set('isSaving', true);
    //   // get group creator
    //   group.set('creator', this.get('store').getById('user', App.currentUser.get('id')) );

    //   // only add one image if has one umage selected
    //   if (this.get('salvedImage.id')) {
    //     group.set('logo', this.get('salvedImage.id')) ;
    //   }

    //   group.save().then(function(g){
    //     self.transitionToRoute('group',g.id);
    //   });
    // }
  }
});
