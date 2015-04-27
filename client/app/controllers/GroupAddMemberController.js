/**
 *
 */
App.GroupAddMemberController = Ember.ObjectController.extend({
  breadCrumb: function(){
    return this.get('name');
  }.property('name'),

  user: null,
  success: false,
  notFound: false,

  isLoading: false,

  actions: {
    /**
     * Invitar user para o grupo
     */
    invite: function() {
      var self = this;
      this.set('isLoading', true);

      return Ember.$.ajax({
        url: '/group/' + this.get('group.id') + '/member',
        type: 'POST',
        dataType: 'json',
        data: {
         name: self.get('newInvite.name'),
         text: self.get('newInvite.text'),
         email: self.get('newInvite.email')
        }
      }).then(function(data) {
        alert(Ember.I18n.t('group.invite.form.success'));
      }).fail(function( jqXHR, textStatus, errorThrown) {
        return Ember.Logger.error('Error on inviteUser',textStatus, errorThrown);
      }).always(function(){
        self.set('isLoading', false);
      });
    }

    // /**
    //  * search for member by username
    //  */
    // findOneUserByUsername: function findOneUserByUsername() {
    //   var self = this;
    //   var username = this.get('username');

    //   // /user/:username

    //   return Ember.$.ajax({
    //     url: '/user/' + username
    //   }).then(function(data) {
    //     // console.log(self.store.all('user').content);
    //     // console.log(self.get('members'));
    //     self.setProperties({
    //       'user': data.user,
    //       'notFound': false
    //     });
    //   }).fail(function( jqXHR, textStatus, errorThrown) {
    //     self.setProperties({
    //       'user': null,
    //       'notFound': true
    //     });
    //     Ember.Logger.error('Error on findOneUserByUsername',textStatus, errorThrown);
    //     return []
    //   });
    // },
  }
});
