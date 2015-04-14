$(function() {
  App.Membership.reopen({
    // related record loader
    relatedUserLoader: function() {
      if (this.get('relatedRecord')) return;
      if (!this.get('memberName') || !this.get('memberId')) return;
      var self = this;
      this.get('store').find(this.get('memberName'), this.get('memberId'))
      .then(function (r) {
        self.set('relatedRecord', r);
      });
    }.observes('memberName', 'memberId').on('init'),

    relatedRecord: null,

    // self remove it if related record is deleted
    onDeleteRelatedRecord: function() {
      if (this.get('relatedRecord.isDeleted') )
        this.deleteRecord();
    }.observes('relatedRecord.isDeleted'),


    relatedGroupLoader: function() {
      if (this.get('group')) return;
      if (!this.get('modelName') || !this.get('modelId')) return;
      var self = this;
      this.get('store').find(this.get('modelName'), this.get('modelId'))
      .then(function (r) {
        self.set('group', r);
      });
    }.observes('modelName', 'modelId').on('init'),

    group: null,

    onDeleteGroup: function() {
      if (this.get('group.isDeleted') )
        this.deleteRecord();
    }.observes('group.isDeleted')
  });
});