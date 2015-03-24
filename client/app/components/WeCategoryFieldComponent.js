App.inject( 'component:we-category-field', 'store', 'store:main' );

App.WeCategoryFieldComponent = Ember.Component.extend({
  tagName: 'input',
  type: 'text',
  classNames: ['select2-element','form-control','input-md','tm-input','tm-input-success'],

  // select 2 configs
  minimumInputLength: 0,
  maximumInputLength: 100,
  maximumSelectionSize: 7,
  multiple: true,

  placeholder: 'Selecione uma ou mais categorias ...',

  formatSearching: function() { return 'Buscando ...'; },

  formatInputTooLong: function(term, maxLength){
    return 'O termo '+term+ ' é muito grande, o máximo de palavras é: ' + maxLength;
  },
  formatSelectionTooBig: function(maxSize){
    return 'Você só pode selecionar ' + maxSize + ' termos';
  },
  formatLoadMore: function() {
    return 'Carregando mais resultados ...' ;
  },
  formatInputTooShort: function (input, min) {
    var n = min - input.length;
    return "Por favor digite " + n + " ou mais letras";
  },

  formatNoMatches: function () { return "Nenhum termo encontrado"; },

  // Expose component to delegate's controller
  init: function() {
    this._super.apply(this, arguments);

    if (this.get('delegate')) {
      this.get('delegate').set(this.get('property') || 'WeCategoryField', this);
    }

    if ( !this.get('vocabulary') ) {
      if ( App.get('configs.vocabularyId') ) {
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
    var store = self.get('store');
    var vocabulary = this.get('vocabulary');

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
        return item.text;
      },
      formatSelection: function(item) {
        if ( item.text ) {
          return item.text;
        } else {
          return item.get('text');
        }
      },
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
      //escapeMarkup: function (m) { return m; }
    };

    configs.ajax = { // instead of writing the function to execute the request we use Select2's convenient helper
      url: '/term',
      dataType: 'json',
      data: function (term, page) {
        var query = {
          where: JSON.stringify({
            text: {
              contains: term
            },
            vocabulary: vocabulary
          }),
          limit: 50
        };
        return query;
      },
      results: function (data, page) { // parse the results into the format expected by Select2.
        // since we are using custom formatting functions we do not need to alter remote JSON data
        return {
          results: data.term
        };
      }
    },

    element.select2(configs);

    element.on('change', function(e) {
      if(!self.get('value')) self.set('value', []);
      var value = self.get('value');
      if (e.added) {
        value.pushObject( store.push('term', e.added) );
      } else if(e.removed) {
        value.removeObject( store.getById('term', e.removed.id));
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
  },
  willDestroyElement: function(){
    this.$().select2('destroy');
  },

  // TODO how to call this functions from outside?
  getSelectedItems: function(){
    return this.$().select2('data');
  },
  empty: function(){
    this.$().select2('val', '');
  }
});
