App.WeTermFieldMixin = Ember.Mixin.create({
  tagName: 'input',
  type: 'text',
  classNames: ['select2-element','form-control','input-md','tm-input','tm-input-success'],

  multiple: true,
  vocabulary: null,
  maximumInputLength: 100,


  // value array
  value: null,


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

  formatSelection: function(item) {
    if (typeof item === 'string') {
      return item;
    } else if( item.text ) {
      return item.text;
    } else {
      return item.get('text');
    }
  },

  formatNoMatches: function () { return "Nenhum termo encontrado"; },

  ajaxResults: function (data) {
    return {
      results: data.term
    };
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
