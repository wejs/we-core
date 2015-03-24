
App.inject( 'component:we-tag-field', 'store', 'store:main' );

App.WeTagFieldComponent = Ember.Component.extend({
  tagName: 'input',
  type: 'text',
  classNames: ['select2-element','form-control','input-md','tm-input','tm-input-success'],

  // value array
  value: null,

  // select 2 configs
  minimumInputLength: 3,
  maximumInputLength: 100,
  maximumSelectionSize: 15,
  multiple: true,
  
  placeholder: 'Selecione um ou mais termos ...',
  formatSearching: function() {
    return 'Buscando ...';
  },
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
        this.get('delegate').set(this.get('property') || 'WeTagField', this);
     }
  },

  // component events
  didInsertElement:function(){
    var element = this.$();
    var self = this;
    var store = self.get('store');
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
        return {
          id: $.trim(term).toLowerCase(),
          text: $.trim(term).toLowerCase(),
          isNew: true
        };
      },
      //data: this.get('shareWithOptions'),
      formatResult: function(item){
        return item.text;
      },
      formatSelection: function(item) {
        if (item.text) {
          return item.text;
        } else {
          return item.get('text');
        }
      },
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
      //escapeMarkup: function (m) { return m; }
    };

    configs.ajax = { // instead of writing the function to execute the request we use Select2's convenient helper
      url: '/tag',
      dataType: 'json',
      data: function (tag, page) {
        var query = {
          where: JSON.stringify({
            text: {
              contains: tag
            }
          }),
          limit: 50
        };

        return query;
      },
      results: function (data, page) { // parse the results into the format expected by Select2.
        // since we are using custom formatting functions we do not need to alter remote JSON data
        return {
          results: data.tag
        };
      }

    },
    configs.initSelection = function(element, callback) {
      // the input tag has a value attribute preloaded that points to a preselected movie's id
      // this function resolves that id attribute to an object that select2 can render
      // using its formatResult renderer - that way the movie name is shown preselected
      var id= $(element).val();
      // if (id!=='') {
      //   $.ajax('http://api.rottentomatoes.com/api/public/v1.0/movies/'+id+'.json', {
      //       data: {
      //           apikey: 'ju6z9mjyajq2djue3gbvv26t'
      //       },
      //       dataType: 'jsonp'
      //   }).done(function(data) { callback(data); });
      // }
      callback();
    };

    element.select2(configs);

    element.on('change', function(e) {
      if(!self.get('value')) self.set('value', []);
      var value = self.get('value');
      if (e.added) {
        value.pushObject( store.push('tag', e.added) );
      } else if(e.removed) {
        value.removeObject( store.getById('tag', e.removed.id));
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
