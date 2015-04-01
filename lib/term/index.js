var hooks = require('../hooks');
var db = require('../database');
var async = require('async');
var _ = require('lodash');
var log = require('../log')();

var term = {};

term.getModelTagFields = function(Model) {
  if (!Model || !Model.options) return null;
  return Model.options.tagFields;
}

term.getModelTermFields = function(Model) {
  if (!Model || !Model.options) return null;
  return Model.options.termFields;
}

term.saveModelTerms = function saveModelTerms(modelName, modelId, req, fieldName, isTags, cb) {
  return db.models.modelsterms.create({
    modelName: modelName,
    modelId: modelId,
    field: fieldName,
    isTags: true
  }).done(function(err, terms) {
    return cb(err, terms);
  });
}
term.updateModelTerms = function updateModelTerms(terms, modelName, modelId, fieldName, fieldConfig, done) {
  var salvedTerms = [];

  async.eachSeries(terms, function(term, nextTerm){
    var query;

    if (fieldConfig.canCreate) {
      query = db.models.term.findOrCreate({
        where: {
          text: term,
          vocabularyId: fieldConfig.vocabularyId
        },
        defaults: {
          text: term,
          vocabularyId: fieldConfig.vocabularyId
        }
      });
    } else {
     query = db.models.term.find({
        where: {
          text: term,
          vocabularyId: fieldConfig.vocabularyId
        }
      });
    }

    query.done(function (err, result) {
      if (err) return nextTerm(err);

      if ( _.isEmpty(result) ) {
        log.warn('term.on:createdResponse: Cant create the term:', term);
        return nextTerm();
      }

      var termObj;
      if (_.isArray(result)) {
        termObj= result[0];
      } else {
        termObj= result;
      }

      return db.models.modelsterms.create({
        modelName: modelName,
        modelId: modelId,
        field: fieldName,
        isTag: fieldConfig.canCreate,
        termId: termObj.id
      }).done(function (err, modelterm) {
        if (err) return nextTerm(err);

        salvedTerms.push(termObj.text);
        return nextTerm();
      });
    });
  }, function(err) {
    if (err) return done(err);
    return done(null, salvedTerms);
  });
}

term.createdResponse = function ( data, done ) {
  var res = data.res;
  var req = data.req;
  var functions = [];

  var termFields = term.getModelTermFields(data.res.locals.Model);

  if (!termFields) return done();

  var fieldNames = Object.keys(termFields);
  fieldNames.forEach(function(fieldName) {
    if ( _.isEmpty(req.body[fieldName]) ) return;
    functions.push(function (next) {
      if (!res.locals.record.dataValues[fieldName])
        res.locals.record.dataValues[fieldName] = [];

      term.updateModelTerms(
        req.body[fieldName],
        res.locals.model,
        res.locals.record.id,
        fieldName,
        termFields[fieldName],
      function afterSaveModelTerms(err, terms) {
        if(err) return next(err);
        res.locals.record.dataValues[fieldName] = terms;
        return next();
      });
    });
  });

  async.series(functions, function(err) {
    if (err) return res.serverError(err);
    return done();
  });
}

term.loadModelTerms =  function loadModelTerms(record, fieldName, modelName, next) {
  if (!record.dataValues[fieldName])
  record.dataValues[fieldName] = [];

  return db.models.modelsterms.findAll({
    where: {
      modelName: modelName,
      modelId: record.id,
      field: fieldName
    },
    include: [{ all: true,  attributes: ['text'] }]
  }).done(function (err, modelterms) {
    if (err) return next(err);
    if (_.isEmpty(modelterms)) return next();

    var terms = modelterms.map(function(modelterm) {
      return modelterm.get().term.get().text;
    });

    record.dataValues[fieldName] = terms;
    return next();
  });
}

term.findResponse = function findResponse( data, done ) {
  var res = data.res;
  var functions = [];

  var termFields = term.getModelTermFields(data.res.locals.Model);

  if (!termFields) return done();

  var fieldNames = Object.keys(termFields);
  fieldNames.forEach(function (fieldName) {
    functions.push(function (next) {
      if (_.isArray(data.res.locals.record)) {
        return async.each(data.res.locals.record, function (record, next) {
          return term.loadModelTerms(record, fieldName, res.locals.model, next);
        }, next);
      } else {
        return term.loadModelTerms(res.locals.record, fieldName, res.locals.model, next);
      }
    });
  });

  async.series(functions, function(err) {
    if (err) return res.serverError(err);
    return done();
  });
}

term.deletedResponse = function deletedResponse(data, done ) {
  var res = data.res;

  var termFields = term.getModelTermFields(data.res.locals.Model);
  if (!termFields) return done();

  var fieldNames = Object.keys(termFields);

  async.eachSeries(fieldNames, function(fieldName, next) {
    db.models.modelsterms.destroy({
      where: {
        modelName: res.locals.model,
        modelId: res.locals.id,
        field: fieldName
      }
    }).done(function(err, result) {
      if (err) return next(err);
      log.debug('Deleted ' + result + ' terms from record with id: ' + res.locals.id);
      return next();
    })
  }, function(err) {
    if (err) return res.serverError(err);
    return done();
  });
};

term.updatedResponse = function updatedResponse(data, done ) {
  var res = data.res;

  var termFields = term.getModelTermFields(data.res.locals.Model);
  if (!termFields) return done();

  var record;
  if (_.isArray(res.locals.record)) {
    record = res.locals.record[0];
  } else {
    record = res.locals.record;
  }

  var fieldNames = Object.keys(termFields);
  async.eachSeries(fieldNames, function(fieldName, nextField) {
    var salvedmodelterms;
    var salvedTerms = [];
    var termsToDelete = [];
    var termsToSave = _.clone(data.req.body[fieldName]);

    async.series([
      // find all model terms for this field
      function(done) {
        return db.models.modelsterms.findAll({
          where: {
            modelName: res.locals.model,
            modelId: record.id,
            field: fieldName
          },
          include: [{ all: true,  attributes: ['text'] }]
        }).done(function (err, modelterms) {
          if (err) return done(err);
          if (_.isEmpty(modelterms)) return done();

          var terms = modelterms.map(function(modelterm) {
            return modelterm.get().term.get().text;
          });

          salvedmodelterms = modelterms;
          salvedTerms = terms;
          return done();
        });
      },
      // check if one of the new terms is salved
      function(done) {
        for (var i = salvedTerms.length - 1; i >= 0; i--) {
          if (data.req.body[fieldName].indexOf(salvedTerms[i]) == -1) {
            // delete
            // mode term to delete array
            termsToDelete.push(salvedTerms[i]);
            salvedTerms.splice(salvedTerms.indexOf(salvedTerms[i]), 1);
          } else {
            termsToSave.splice(termsToSave.indexOf(termsToSave[i]), 1);
          }
        }

        done();
      },
      // delete removed terms
      function deleteTerms(done) {
        if (_.isEmpty(termsToDelete)) return done();

        async.each(termsToDelete, function(termToDelete, next){
          var objToDelete;
          for (var i = salvedmodelterms.length - 1; i >= 0; i--) {
            if( salvedmodelterms[i].get().term.get().text ==  termToDelete) {
              objToDelete = salvedmodelterms[i];
              break;
            }
          }

          if (!objToDelete) {
            log.warn('Associated term not found', termToDelete);
            return next();
          }

          objToDelete.destroy()
          .done( function(err){
            if (err) return next(err);
            salvedmodelterms.splice(i, 1);
            next();
          });
        }, done);
      },
      // save new terms
      function saveTerms(done) {
        if (_.isEmpty(termsToSave)) return done();

        term.updateModelTerms(
          termsToSave,
          res.locals.model,
          res.locals.record.id,
          fieldName,
          termFields[fieldName],
        function afterSaveModelTerms(err, terms) {
          if(err) return done(err);
          salvedTerms = salvedTerms.concat(terms);
          return done();
        });
      },
      function setRecordTerms(done) {
        record.dataValues[fieldName] = salvedTerms;
        done();
      }
    ], nextField);
  }, function(err) {
    if (err) return res.serverError(err);
    return done();
  });
}

// hooks
hooks.on('we:before:send:createdResponse', term.createdResponse);

hooks.on('we:before:send:okResponse',  function (data, done) {
  if (data.res.locals.action == 'update') {
    return term.updatedResponse(data, done);
  } else {
    return term.findResponse(data, done);
  }
  return done();
});

hooks.on('we:before:send:deletedResponse',  term.deletedResponse);

module.exports = term;