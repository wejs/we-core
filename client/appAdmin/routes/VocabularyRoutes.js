App.Router.map(function(match) {
  // post route map
  this.resource('vocabularies',{path: '/vocabularies'}, function(){

  });

  this.route('vocabulary.create',{path: '/add/vocabulary'});

  this.resource('vocabulary',{path: '/vocabulary/:vid'}, function(){
    this.resource('terms',{path: '/terms'}, function(){

    });
  });


  this.resource('categories',{path: '/categories'}, function(){

  });

  this.resource('tags',{path: '/tags'}, function(){

  });
});

App.VocabulariesRoute = Ember.Route.extend({
  model: function () {
    return {
      attributes: Ember.get('App.Vocabulary.attributes').keys.list,
      vocabularies: this.get('store').find('vocabulary')
    };
  }
});


App.VocabularyRoute = Ember.Route.extend({
  model: function (params) {
    if(params.vid === 'null' || params.vid == 0) {
      return {}
    }

    return this.get('store').find('vocabulary', params.vid);
  }
});

App.VocabularyIndexRoute = Ember.Route.extend({
  model: function (params) {
    var vocabulary = this.modelFor('vocabulary');

    var vid;
    if (vocabulary.id) {
      vid = vocabulary.id;
    } else {
      vid = null;
    }

    this.loadRecords(vid);

    return {
      vocabulary: vocabulary,
      termAttr: Ember.get('App.Term.attributes').keys.list,
      terms: this.get('store').filter('term', function(record) {
        // if are loaded in store
        if (record.get) {
          if (record.get('vocabulary.id') == vid) {
            return true;
          }
        } else {
          // else if will be load in store
          if (record.vocabulary == vid) {
            return true;
          }
        }
        return false;
      }),
      newTerm: {}
    };
  },

  loadRecords: function(vid) {
    return this.get('store').find('term',{
      vocabulary: vid
    });
  }

});

App.VocabularyCreateRoute = Ember.Route.extend({
  model: function () {
    return {
      vocabulary: {}
    }
  }
});