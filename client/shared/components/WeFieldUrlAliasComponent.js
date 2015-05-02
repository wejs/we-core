App.inject( 'component:we-field-url-alias', 'store', 'store:main' );

App.WeFieldUrlAliasComponent = Ember.Component.extend({
  baseUrl: location.protocol + '//' + location.host,
  modelName: null,
  modelId: null,

  isEditing: false,

  isStarting: true,

  url: {},

  didInsertElement: function() {
    this._super();

    var self = this;

    this.set('url', {})

    this.get('store').find('url', {
      where: JSON.stringify({
        modelName: this.get('modelName'),
        modelId: this.get('modelId')
      })
    }).then(function(r) {
      self.set('isStarting', false);
      self.set('url', r.content[0]);
    });
  },

  actions: {
    edit: function() {
      this.set('isEditing', true);
    },
    cancel: function() {

    },

    save: function() {
      var self = this;
      var data = this.get('url');
      var record;

      if (!data || !data.id) {
        record = this.get('store').createRecord('url');
      } else {
        record = data;
      }

      record.setProperties({
        modelName: this.get('modelName'),
        modelId: this.get('modelId'),
        url: this.get('url.url')
      });

      record.save().then(function(r) {
        self.setProperties({
          'isSaving': false,
          'isEditing': false,
          'url': record
        });
      });
    },

    remove: function() {

    }
  }
});