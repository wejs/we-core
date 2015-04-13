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

  actions: {
    /**
     * search for member by username
     */
    findOneUserByUsername: function findOneUserByUsername() {
      var self = this;
      var username = this.get('username');

      // /user/:username

      return Ember.$.ajax({
        url: '/user/' + username
      }).then(function(data) {
        // console.log(self.store.all('user').content);
        // console.log(self.get('members'));
        self.setProperties({
          'user': data.user,
          'notFound': false
        });
      }).fail(function( jqXHR, textStatus, errorThrown) {
        self.setProperties({
          'user': null,
          'notFound': true
        });
        Ember.Logger.error('Error on findOneUserByUsername',textStatus, errorThrown);
        return []
      });
    },

    /**
     * Invitar user para o grupo
     */
    inviteUser: function() {
      var self = this;
      var userId = this.get('user.id');
      Ember.$('.addMember').button('loading');      
      return Ember.$.ajax({
        url: '/api/v1/group/' + this.get('group.id') + '/invite',
        type: 'POST',
        dataType: 'json',
        data: {
         id: userId         
        }        
      }).then(function(data) {
        Ember.$('.addMember').button('reset');
        self.setProperties({
          'success': true,
          'user': null
        });
        setTimeout(function (){
          self.set('success', false);
        }, 3000)
      }).fail(function( jqXHR, textStatus, errorThrown) {      
        Ember.$('.addMember').button('reset');        
        return Ember.Logger.error('Error on inviteUser',textStatus, errorThrown);        
      });      
    }
  }
});
