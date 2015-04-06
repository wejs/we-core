App.inject( 'component:we-category-field', 'store', 'store:main' );

App.WeCategoryFieldComponent = Ember.Component.extend(App.WeTermFieldMixin, {

  // select 2 configs
  minimumInputLength: 0,
  maximumSelectionSize: 7,

  placeholder: 'Selecione uma ou mais categorias ...',

  // Expose component to delegate's controller
  init: function() {
    this._super();

    if ( !this.get('vocabulary') ) {

      if (this.get('modelName') && this.get('field')) {

        this.set('vocabulary',
          Ember.get('App.'+ this.get('modelName') + '.attributes')
          .get(this.get('field')).options.vocabularyId
        );

      } else if ( App.get('configs.vocabularyId') ) {
        this.set('vocabulary', App.get('config.vocabularyId'));
      } else {
        return console.error('vocabulary is required for category term');
      }
    }
  },

  // component events
  didInsertElement: function () {
    var element = this.$();
    var self = this;

    if ( !element.select2 ) {
      return console.error('jquery.select2 Not found on element', element);
    }

    var configs = {

      placeholder: this.get('placeholder'),
      minimumInputLength: this.get('minimumInputLength'),
      multiple: this.get('multiple'),
      maximumInputLength: this.get('maximumInputLength'),
      maximumSelectionSize: this.get('maximumSelectionSize'),

      formatSearching: this.get('formatSearching'),
      formatNoMatches: this.get('formatNoMatches'),
      formatInputTooShort: this.get('formatInputTooShort'),
      formatInputTooLong: this.get('formatInputTooLong'),
      formatSelectionTooBig: this.get('formatSelectionTooBig'),
      formatLoadMore: this.get('formatLoadMore'),

      formatResult: function(item) {
        return item;
      },
      formatSelection: this.get('formatSelection'),
      formatSelectionCssClass: function (item) {
        switch ( item.model ) {
          case 'user':
            return 'model-user';
          case 'group':
            return 'model-group';
        }
        return '';
      },
      dropdownCssClass: 'sharebox-dropdown',
      id: function(item) {
        return item;
      }
      //escapeMarkup: function (m) { return m; }
    };

    configs.ajax = {
      url: '/api/v1/term-texts',
      dataType: 'json',
      data: function (term) {
        var where = {};

        if (term) {
          where.text = { like: '%'+term+'%' };
        }

        if (self.get('vocabulary')) {
          where.vocabularyId = self.get('vocabulary');
        } else {
          where.vocabularyId = null;
        }

        var query = {
          where: JSON.stringify(where),
          limit: 50
        };
        return query;
      },
      results: self.get('ajaxResults')
    };

    element.select2(configs);
    element.on('change', function(e) {
      if(!self.get('value')) self.set('value', []);
      var value = self.get('value');
      if (e.added) {
        value.pushObject( e.added );
      } else if(e.removed) {
        value.removeObject( e.removed );
      }
    });

    // set selected values
    if (this.get('value')) {
      var value = this.get('value');
      if (value && value.then) {
        value.then(function(v){
          element.select2('data', v.content);
        })
      } else {
        element.select2('data', this.get('value').toArray());
      }
    } else {
      this.set('value', []);
    }
  }
});
