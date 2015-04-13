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
    changeMembership: function changeMembership() {
      if (this.get('group.isCreator')) {
        // TODO group creator cant leave the group
        return;
      }

      var membership = this.get('membership.status');
      switch(membership){
        case 'invited':
          return this.send('acceptGroup');
        case 'active':
          return this.send('leaveGroup');
        case 'blocked':
            break;
        // case 'requested':
        //     break;
        default:
          return this.send('joinGroup');
      }
    },

    joinGroup: function joinGroup() {
      var self = this;
      var store = this.get('store');
      var group = this.get('group');
      var userId = App.get('currentUser.id');
      if(!userId) return Ember.Logger.error('App.currentUser.id not found in joinGroup');

      $.post('/api/v1/group/' + group.id + '/join')
      .done(function (response) {
        console.log(response);
        self.set('membership', store.push('membership', response.membership[0]));
        group.set('_data.meta.membership', response.membership[0]);
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function(e){
        console.error('Error on join group' , e);
      });
    },

    leaveGroup: function leaveGroup() {
      var self = this;
      var group = this.get('group');
      var userId = App.get('currentUser.id');
      var membership = this.get('membership');

      if(!userId) return Ember.Logger.error('App.currentUser.id not found in leaveGroup');

      return $.post('/api/v1/group/' + group.id + '/leave')
      .done(function () {
        // remove membership status from group and model
        self.set('membership', null);
        group.set('_data.meta.membership', null);
        // unload record from store
        membership.unloadRecord();
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function(e){
        Ember.Logger.error('Error on leave group' , e);
      });
    },

    acceptGroup: function acceptGroup() {
      var self = this;
      var store = this.get('store');
      var group = this.get('group');
      var userId = App.get('currentUser.id');
      var membership = this.get('membership');

      if(!userId) return Ember.Logger.error('App.currentUser.id not found in leaveGroup');

      $.get('/comunidade/' + group.id + '/invite/' + membership.id)
      .done(function (membership) {
        self.set('membership', store.push('membership', membership));
        group.set('_data.meta.membership', membership);
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function(e){
        console.error('Error on join group' , e);
      });

    },

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
          })
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
