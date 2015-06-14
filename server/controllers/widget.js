module.exports = {
  create: function create(req, res) {
    var we = req.getWe();

    res.locals.layout = false;
    req.body.creatorId = req.user.id;

    return res.locals.Model.create(req.body)
    .then(function (record) {

      res.locals.template = record.type + '/wiew';
      res.status(201);

      record.dataValues.html = we.view.widgets[record.type].render(record, res.locals.theme);

      if (res.locals.responseType == 'html') {
        return res.send(record.dataValues.html);
      } else {
        res.locals.record = record;
        return res.created();
      }

    });
  },

  findOne: function findOne(req, res, next) {
    var we = req.getWe();
    var id = req.params.id;

    res.locals.layout = false;

    res.locals.Model.find({
      where: { id: id}
    }).then(function (record) {
      if (!record) return next();

      res.locals.template = record.type + '/wiew';
      res.status(200);

      record.dataValues.html = we.view.widgets[record.type].render(record, res.locals.theme);

      if (res.locals.responseType == 'html') {
        return res.send(record.dataValues.html);
      } else {
        res.locals.record = record;
        return res.ok();
      }
    });
  },

  find: function findAll(req, res, next) {
    var we = req.getWe();

    return res.locals.Model.findAndCountAll(res.locals.query, res.locals.queryOptions)
    .then(function (result) {
      if (!result) return next();

      if (result.rows)  {
        result.rows.forEach(function (record) {
          record.dataValues.html =  we.view.widgets[record.type].render(record, res.locals.theme);
        });
      }

      res.locals.metadata.count = result.count;
      res.locals.record = result.rows;

      return res.ok();
    });
  },

  update: function update(req, res) {
    var we = req.getWe();

    var id = req.params.id;

    res.locals.layout = false;

    res.locals.Model.findById(id)
    .then(function (record) {
      if (!record) return res.notFound();

      record.updateAttributes(req.body)
      .then(function() {
        res.locals.template = record.type + '/wiew';
        res.status(200);

        record.dataValues.html = we.view.widgets[record.type].render(record, res.locals.theme);

        if (res.locals.responseType == 'html') {
          return res.send(record.dataValues.html);
        } else {
          res.locals.record = record;
          return res.ok();
        }
      });
    });
  },

  destroy: function destroy(req, res) {
    var id = req.params.id;

    res.locals.Model.findById(id)
    .then(function (record) {
      if (!record) return res.notFound();
      record.destroy(req.body)
      .then(function() {
        return res.status(204).send();
      });
    });
  }
};