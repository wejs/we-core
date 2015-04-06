App.Router.map(function(match) {
  // post route map
  this.resource('vocabularies',{path: '/vocabularies'}, function(){

  });

  this.route('vocabulary.create',{path: '/add/vocabulary'});


  this.resource('vocabulary',{path: '/vocabulary/:vid'}, function() {
    this.route('createTerm',{path: '/add/term'});

    this.resource('terms',{path: '/terms'}, function(){

    });
  });


  this.resource('categories',{path: '/categories'}, function(){

  });

  this.resource('tags',{path: '/tags'}, function(){

  });
});

App.VocabulariesRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function () {
    return Ember.RSVP.hash({
      attributes: Ember.get('App.Vocabulary.attributes').keys.list,
      vocabularies: this.get('store').find('vocabulary')
    });
  }
});

App.VocabularyRoute = Ember.Route.extend(App.ResetScrollMixin, {

  model: function (params) {
    var vocabulary = {};

    var vid = null;
    if (Number(params.vid)) {
      vid = params.vid;
      vocabulary = this.get('store').find('vocabulary', vid);
    }

    this.loadRecords(vid);

    return Ember.RSVP.hash({
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
    });
  },
  loadRecords: function(vid) {
    return this.get('store').find('term',{
      where: JSON.stringify({
        vocabularyId: vid
      })
    });
  }
});

App.VocabularyIndexRoute = Ember.Route.extend(App.ResetScrollMixin);

App.VocabularyCreateTermRoute = Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      vocabulary: this.modelFor('vocabulary').vocabulary,
      record: {}
    });
  },
  afterModel: function(model){
    if (!model.vocabulary || !model.vocabulary.id) {
      model.vocabulary = { id: 0 };
    }
  }
});


App.VocabularyCreateRoute = Ember.Route.extend({
  model: function () {
    return {
      vocabulary: {}
    }
  }
});