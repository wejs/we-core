$(function() {
  App.Activity.reopen({
    activityActionName: function() {
      return 'we-activity-' + this.get('modelName') + '-' + this.get('action');
    }.property('modelName', 'modelId'),

    activityName: function() {
      return 'we-activity-' + this.get('modelName');
    }.property('modelName'),

    // related record loader
    relatedRecordLoader: function() {
      if (this.get('relatedRecord')) return;
      if (!this.get('modelName') || !this.get('modelId')) return;
      var self = this;
      this.get('store').find(this.get('modelName'), this.get('modelId'))
      .then(function (r) {
        self.set('relatedRecord', r);
      });
    }.observes('modelName', 'modelId').on('init'),
    relatedRecord: null,
    // self remove it if related record is deleted
    onDeleteRelatedRecord: function() {
      if (this.get('relatedRecord.isDeleted') )
        this.deleteRecord();
    }.observes('relatedRecord.isDeleted'),


    relatedActorLoader: function() {
      if (this.get('relatedActor')) return;
      if (!this.get('actor')) return;
      var self = this;
      this.get('store').find('user', this.get('actor'))
      .then(function (r) {
        self.set('relatedActor', r);
      });
    }.observes('actor').on('init'),
    relatedActor: null
  });
});