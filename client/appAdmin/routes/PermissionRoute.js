App.Router.map(function(match) {
  // post route map
  this.resource('permissions',{path: '/permissions'}, function(){
    this.route('create',{path: '/add'});

    this.resource('roles',{path: '/roles'}, function() {
      this.route('create',{path: '/add'});

      this.resource('role',{path: '/role/:id'}, function(){
        this.route('edit',{path: '/edit'});
      });
    });

  });

});

App.PermissionsRoute = Ember.Route.extend({
  model: function () {
    return {
      attributes: Ember.get('App.Permission.attributes').keys.list,
      records: this.get('store').find('permission'),
      roles: this.get('store').find('role')
    };
  },

  afterModel: function(model) {
    // remove administrator role
    model.roles.then(function() {
      var administrator = model.roles.filterProperty('name', 'administrator');
      if (administrator)
        model.roles.removeObject(administrator[0]);
    })
  }
});


// App.VocabularyRoute = Ember.Route.extend({
//   model: function (params) {
//     if(params.vid === 'null' || params.vid == 0) {
//       return {}
//     }

//     return this.get('store').find('vocabulary', params.vid);
//   }
// });

// App.VocabularyIndexRoute = Ember.Route.extend({
//   model: function (params) {
//     var vocabulary = this.modelFor('vocabulary');

//     var vid;
//     if (vocabulary.id) {
//       vid = vocabulary.id;
//     } else {
//       vid = null;
//     }

//     this.loadRecords(vid);

//     return {
//       vocabulary: vocabulary,
//       termAttr: Ember.get('App.Term.attributes').keys.list,
//       terms: this.get('store').filter('term', function(record) {
//         // if are loaded in store
//         if (record.get) {
//           if (record.get('vocabulary.id') == vid) {
//             return true;
//           }
//         } else {
//           // else if will be load in store
//           if (record.vocabulary == vid) {
//             return true;
//           }
//         }
//         return false;
//       }),
//       newTerm: {}
//     };
//   },

//   loadRecords: function(vid) {
//     return this.get('store').find('term',{
//       vocabulary: vid
//     });
//   }

// });

// App.VocabularyCreateRoute = Ember.Route.extend({
//   model: function () {
//     return {
//       vocabulary: {}
//     }
//   }
// });