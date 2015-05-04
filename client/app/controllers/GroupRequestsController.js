App.GroupRequestsController = Ember.ObjectController.extend(App.GroupSaveAttributeMixin, {
  actions:{
    acceptRequest: function(member) {
      var self = this;
      var group = self.get('group');

      return Ember.$.ajax({
        url: '/api/v1/group/' + group.id + '/member/' + member.id,
        method: 'PUT',
        dataType: 'json',
        data: {
          status: 'active'
        }
      }).then(function(data) {
        self.set('memberships', self.get('memberships').filter(function (member){
          if (member.user === data.membership.user) return false;
          return true;
        }));
      }).fail(function( jqXHR, textStatus, errorThrown) {
        Ember.Logger.error('Error on acceptRequest',textStatus, errorThrown);
      });
    },
    denyRequest: function(member) {
      var self = this;
      var group = self.get('group');

      return Ember.$.ajax({
        url: '/api/v1/group/' + group.id + '/member/' + member.id,
        method: 'DELETE'
      }).then(function(response) {
        self.set('memberships', self.get('memberships').filter(function (member){
          if (member.user === response.members[0].user) return false;
          return true;
        }));
        self.groupController.pendingRequests--;
      }).fail(function( jqXHR, textStatus, errorThrown) {
        Ember.Logger.error('Error on denyRequest',textStatus, errorThrown);
      });
    }
  }
});