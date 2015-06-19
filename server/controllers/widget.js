var _ = require('lodash');
var async = require('async');

module.exports = {
  create: function create(req, res) {
    var we = req.getWe();

    res.locals.layout = false;
    req.body.creatorId = req.user.id;

    var type = req.body.type;
    we.view.widgets[type].afterSave(req, res, function() {
      res.locals.Model.create(req.body)
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
    });
  },

  /**
   * Update multiple widgets weight attribute
   *
   * @param  {object}   req  express.js request
   * @param  {object}   res  express.js response
   * @param  {Function} next callback
   */
  sortWidgets: function sortWidgets(req, res) {
    var we = req.getWe();

    if (!req.body.widgets)
      return res.badRequest('widgets body params is required');

    async.each(req.body.widgets, function (w, next) {
      // only update weight field
      we.db.models.widget.update(w, {
        where: { id: w.id }, fields: ['weight']})
      .then(function () {
        next();
      }).catch(next);
    }, function (err) {
      if (err) return res.serverError(err);
      res.send();
    })
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

  getCreateForm: function getCreateForm(req, res) {
    var we = req.getWe();

    if (!we.view.widgets[req.params.type]) return res.notFound();
    if (!we.view.themes[req.params.theme]) return res.notFound();

    var layoutToUpdate = we.view.themes[req.params.theme].layouts[req.params.layout];
    if (!layoutToUpdate) return res.notFound();

    var data = {
      type: req.params.type,
      layout: req.params.layout,
      theme: req.params.theme,
      regions: {}
    };

    var regions = _.cloneDeep(layoutToUpdate.regions);
    for (var r in regions) {
      if (r == req.query.regionName) regions[r].selected = true;
      data.regions[r] = regions[r];
    }

    var html = we.view.widgets[req.params.type].renderForm(data);

    res.status(200);
    return res.send(html);
  },

  getForm: function getForm(req, res, next) {
    var we = req.getWe();
    var id = req.params.id;

    res.locals.Model.find({
      where: {id: id}
    }).then(function (record) {
      if (!record) return next();

      res.status(200);

      var widget = record.toJSON();

      widget.regions = {};

      var regions = _.cloneDeep(we.view.themes[widget.theme].layouts[record.layout].regions);
      for (var r in regions) {
        if (r == widget.regionName) regions[r].selected = true;
        widget.regions[r] = regions[r];
      }

      record.dataValues.html = we.view.widgets[record.type].renderForm(widget, res.locals.theme);

      if (res.locals.responseType == 'html') {
        return res.send(record.dataValues.html);
      } else {
        res.locals.record = record;
        return res.ok();
      }
    });
  },

  update: function update(req, res) {
    var we = req.getWe();

    var id = req.params.id;

    res.locals.layout = false;

    res.locals.Model.findById(id)
    .then(function (record) {
      if (!record) return res.notFound();

      var type = record.type;
      we.view.widgets[type].afterSave(req, res, function() {

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
  },

  updateThemeLayout: function updateThemeLayout(req, res) {
    var we = req.getWe();

    if (!we.view.themes[req.params.name]) return res.notFound();

    var layoutToUpdate = we.view.themes[req.params.name].layouts[req.params.layout];
    if (!layoutToUpdate)  return res.notFound();

    if (!res.locals.data) res.locals.data = {};

    we.db.models.widget.findAll({
      where: {
        theme: req.params.name,
        layout: req.params.layout
      },
      order: 'weight ASC'
    }).then(function (widgets) {

      res.locals.data.regions = _.cloneDeep(layoutToUpdate.regions);

      res.locals.data.widgets = we.view.widgets;

      widgets.forEach(function (w) {
        var regionName = w.regionName;
        if (!regionName) regionName = 'No region';

        if (!res.locals.data.regions[regionName]) res.locals.data.regions[regionName] = {
          name: regionName,
          widgets: []
        };
        if (!res.locals.data.regions[regionName].widgets)
          res.locals.data.regions[regionName].widgets = [];

        res.locals.data.regions[regionName].widgets.push(w);
      });

      res.locals.data.layout = req.params.layout;
      res.locals.data.currentTheme = we.view.themes[req.params.name];
      res.locals.data.themeName = req.params.name;

      //res.locals.template = 'structure/theme/layout';
      res.view();
    });
  }
};