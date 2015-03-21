/**
 * Default controller
 */

module.exports = {
  // default crud actions
  find: function(req, res, next) {
    res.locals.Model.findAndCountAll()
    .done(function(err, record) {
      if (err) return res.serverError(err);

      var response = {};
      response[res.locals.model] = record.rows;
      response.meta = {
        count: record.count
      };

      return res.status(200).send(response);
    });
  },
  create: function(req, res, next) {
    res.locals.Model.create(req.body)
    .done(function(err, record) {
      if (err) return res.send(err);
      return res.created(record);
    });
  },
  findOne: function(req, res, next) {
    var id = req.params.id;

    res.locals.Model.find(id)
    .done(function(err, record) {
      if (err) return res.status(500).send(err);

      var response = {};
      response[res.locals.model] = record;
      return res.status(200).send(response);
    });
  },
  update: function(req, res, next) {
    var id = req.params.id;

    res.locals.Model.find(id)
    .done(function(err, record) {
      if (err) return res.status(500).send(err);
      if (!record) return res.status(404).send();

      record.updateAttributes(req.body)
      .done(function(err) {
        if (err) return res.status(500).send(err);

        var response = {};
        response[res.locals.model] = record;
        return res.status(200).send(response);
      });
    });
  },
  destroy: function(req, res, next) {
    var id = req.params.id;

    res.locals.Model.find(id)
    .done(function(err, record) {
      if (err) return res.status(500).send(err);
      if (!record) return res.status(404).send();

      record.destroy(req.body)
      .done(function(err) {
        if (err) return res.status(500).send(err);
        return res.status(204).send();
      });
    });
  },
  // pages actions
  editPage: function(req, res, next) {
    console.log('TODO');
  },
  // atribute actions
  getAttribute: function(req, res, next) {
    console.log('TODO');
  },
  updateAttribute: function(req, res, next) {
    console.log('TODO');
  },
  deleteAttribute: function(req, res, next) {
    console.log('TODO');
  },
  // association actions
  addRecord: function(req, res, next) {
    console.log('TODO');
  },
  removeRecord: function(req, res, next) {
    console.log('TODO');
  },
  getRecord: function(req, res, next) {
    console.log('TODO');
  }
}

function parseValues(req) {
  var we =  req.getWe();

  var modelAtributes = Object.keys( we.modelsConfigs[res.locals.model].definition );
}