
App.inject( 'component:we-tag-field', 'store', 'store:main' );

App.WeTagFieldComponent = Ember.Component.extend(App.WeTermFieldMixin, {

  // select 2 configs
  minimumInputLength: 3,
  maximumSelectionSize: 15,

  placeholder: 'Selecione um ou mais termos ...',

  init: function() {
    this._super();

    if (this.get('modelName') && this.get('field')) {
      this.set('vocabulary',
        Ember.get('App.'+ this.get('modelName') + '.attributes')
        .get(this.get('field')).options.vocabularyId
      );
    }
  },

  // component events
  didInsertElement:function(){
    var element = this.$();
    var self = this;

    if(!element.select2){
      return console.error('jquery.select2 Not found on element', element);
    }

    var configs = {
      tags: true,
      tokenSeparators: [',', ';'],
      placeholder: this.get('placeholder'),

      formatSearching: this.get('formatSearching'),
      formatInputTooShort: this.get('formatInputTooShort'),
      formatInputTooLong: this.get('formatInputTooLong'),
      formatSelectionTooBig: this.get('formatSelectionTooBig'),
      formatLoadMore: this.get('formatLoadMore'),

      formatNoMatches: this.get('formatNoMatches'),
      minimumInputLength: this.get('minimumInputLength'),
      multiple: this.get('multiple'),
      maximumInputLength: this.get('maximumInputLength'),
      maximumSelectionSize: this.get('maximumSelectionSize'),

      createSearchChoice: function (term) {
        return term;
      },
      //data: this.get('shareWithOptions'),
      formatResult: function(item) {
        return item;
      },
      formatSelection: this.get('formatSelection'),
      formatSelectionCssClass: function (item) {
        switch(item.model) {
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

    configs.initSelection = function initSelection(element, callback) {
      callback();
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
        });
      } else {
        element.select2('data', this.get('value').toArray());
      }
    } else {
      this.set('value', []);
    }
  }
});
