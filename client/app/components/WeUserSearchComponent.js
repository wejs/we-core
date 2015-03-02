App.WeUserSearchComponent = Ember.Component.extend({
    tagName: 'input',
    classNames: ['we-user-search'],
    classNameBindings: ['weUserSearchClass', 'multiple:we-user-search-multiple:we-user-search-single'],
    attributeStyling: ['style'],
    style: 'display:hidden',

    inputSize: 'input-md',
    placeholder: 'Nome de usuário...',
    minimumInputLength: 0,

    weSearchField: 'username',
    url: '/user',
    multiple: false,
    addEmail: false,

    // Expose component to delegate's controller
    init: function() {
       this._super.apply(this, arguments);

       if (this.get('delegate')) {
          this.get('delegate').set(this.get('property') || 'WeUserSearch', this);
       }
    },    

    didInsertElement: function() {
        var self = this;
        var options = {};
        self._select = self.$();

        options.multiple = self.get('multiple');
        options.placeholder = self.get('placeholder');
        // options.placeholder = self.get('placeholder').replace('%s', self.get('weSearchField'));
        options.tokenSeparators = [','];
        options.minimumInputLength = self.get('minimumInputLength');

        options.escapeMarkup = function (m) { return m; }

        options.formatSelection = function(item) {
            return self.formatUserSelection(item);
        };

        options.formatResult = function(item) {
            return self.formatUserResult(item);
        };

        options.ajax = {
            url: self.get('url'),
            dataType: 'json',
            quietMillis: 250,
            data: function (term, page) {
              var limit = 30;
              var skip = ( page - 1 ) * limit;
              var helper = {};
              helper[self.get('weSearchField')] = {}
              helper[self.get('weSearchField')].contains = term;

              var query = {
                where: JSON.stringify(helper),
                limit: limit,
                skip: skip
              };          

              return query;
            },
            results: function (data, page) { // parse the results into the format expected by Select2.
              // since we are using custom formatting functions we do not need to alter remote JSON data
              var more = data.user.length > 0;

              return {
                results: data.user,
                more: more
              };
            }
        }

        Ember.assert("select2 has to exist", Ember.$.fn.select2);
        // Ember.assert("select2 needs a content array", self.get('content'));
        // Ember.assert("select2 needs a selected array", self.get('selected'));

        self._select.select2(options);
        self._select.on('select2-selecting', function(selection){
            self.sendAction('weUserSearchSelected', selection.object);
        });
    },

    willDestroyElement: function (){
        this._select.select2('destroy');
    },

    formatUserResult: function(user) {
      var size = '44px';
      if(this.get('addEmail')) size = '60px';
      
      var markup = '<div class="container-fluid">' +
           '<div class="row">' +
           '<div class="col-sm-3 text-center"><img style="width: ' + size + '; height: ' + size + '" src="/avatar/' + user.avatar + '" /></div>' +           
           '<div class="col-sm-9">' + 
              '<div>@' + user.username + '</div>' +
              '<div>' + user.displayName + '</div>';

      if (this.get('addEmail')) markup += '<div>' + user.email + '</div>'

      markup += '</div></div></div>';

      return markup;
    },

    formatUserSelection: function(user) {
        return '@' + user.username;
    },

    open: function (){
      this._select.select2('open');
    },

    clear: function (){
      this._select.select2('val', '');
    }
});
