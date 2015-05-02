$(function() {
  App.Group.reopen({
    membership: function() {
      return this.get('data.meta.membership');
    }.property('data.meta.membership.id'),

    isCreator: function() {
      var id;
      if (typeof this.get('creator') == 'object') {
        id = this.get('creator.id');
      } else {
        id = this.get('creator');
      }

      if (App.get('currentUser.id') == id) {
        return true;
      } else {
        return false;
      }
    }.property('creator')
  });
});