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
          record.set('logo', salvedImage);
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
  }
});
