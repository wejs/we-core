$(function() {
  App.Membership.reopen({
    // // related record loader
    // relatedUserLoader: function() {
    //   if (this.get('relatedRecord')) return;
    //   if (!this.get('memberId')) return;
    //   var self = this;
    //   this.get('store').find('user', this.get('memberId'))
    //   .then(function (r) {
    //     self.set('relatedRecord', r);
    //   });
    // }.observes('memberId').on('init'),

    // relatedRecord: null,

    // self remove it if related record is deleted
    onDeleteRelatedRecord: function() {
      if (this.get('member.isDeleted') )
        this.deleteRecord();
    }.observes('member.isDeleted'),


    // relatedGroupLoader: function() {
    //   if (this.get('group')) return;
    //   if (!this.get('modelId')) return;
    //   var self = this;
    //   this.get('store').find('group', this.get('modelId'))
    //   .then(function (r) {
    //     self.set('group', r);
    //   });
    // }.observes('modelId').on('init'),

    // group: null,

    onDeleteGroup: function() {
      if (this.get('model.isDeleted') )
        this.deleteRecord();
    }.observes('model.isDeleted')
  });
});