/**
 * Group item controller /group/:id
 * @author Alberto Souza
 * @author Thalles
 */
App.GroupController = Ember.ObjectController.extend(App.GroupSaveAttributeMixin, {
  breadCrumb: function(){
    return this.get('name');
  }.property('name'),

  isLoading: false,

  imageUploadUrl: '/api/v1/images',
  changeAvatar: false,

  /**
   * Roda se um usuário selecionar uma nova imagem para logo
   *
   */
  onNewAvatarSelected: function() {
    var files = this.get('group.avatarSelected');
    if (files && files[0]) {
      this.set('group.newAvatar', files[0]);

      var self = this;
      var reader = new FileReader();

      reader.onload = function (e) {
        // get local file src
        self.set('group.newAvatarSRC', e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }.observes('group.avatarSelected'),

  // onChangeDisableRelatoFeature: function() {
  //   this.send('saveAttribute', 'disableRelatoFeature');
  // }.observes('group.disableRelatoFeature'),

  actions: {
    /**
     * Delete the current grupo
     */
    deleteItem: function deleteItem(){
      var self = this;
      // get user confirmation
      var userConfirmation = confirm( we.i18n('Are you sure you want to delete the group?') );
      // if user confirm this action
      if (userConfirmation === true) {
        // delete and remove from store
        this.get('model').destroyRecord().then(function() {
          // and after destroy redirect to groups
          self.transitionToRoute('groups');
        });
      }
    },

    showChangeAvatar: function () {
      this.set('changeAvatar', true);
      Ember.run.later(function(){
       $('input[name="chaneGroupAvatar"]').trigger('click');
      }, 200);

    },

    cancelChangeAvatar: function () {
      this.setProperties({
        'changeAvatar': false,
        'group.avatarSelected': null,
        'group.newAvatar': null,
        'group.newAvatarSRC': null
      });
    },
    saveAvatar: function() {
      var self = this;
      var file = self.get('group.newAvatar');

      if (Ember.isEmpty(file)) {
        return this.send('cancelChangeAvatar');
      }

      self.set('isLoading', true);

      var uploader = Ember.Uploader.create({
        url: this.get('imageUploadUrl'),
        type: 'POST',
        paramName: 'images'
      });

      var promisseUpload = uploader.upload(file);
      promisseUpload.then(function uploadFilesSuccess(data) {
        // Handle success
        if (data.images && data.images[0]) {
          // sabe image in store
          var image = self.get('store').push('image', data.images[0]);
          self.get('group').set('logo', image);

          var logo = self.get('group.logo');

          logo.then(function(){
            self.send('cancelChangeAvatar');
            self.send('saveAttribute', 'logo');
          });
        } else {
          self.send('cancelChangeAvatar');
        }
        self.set('isLoading', false);
      }, function uploadFilesError (error) {
        Ember.Logger.error('Erro ao salvar a imagem de destaque do relato', error);
        self.set('isLoading', false);
      });

    }
  }
});
