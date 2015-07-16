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

        record.dataValues.html = we.view.widgets[record.type].render({
          locals: res.locals,
          widget: record
        }, res.locals.theme);
        if (res.locals.responseType == 'html') {
          return res.send(record.dataValues.html.string);
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

      record.dataValues.html = we.view.widgets[record.type].render({
        locals: res.locals,
        widget: record
      }, res.locals.theme);

      if (res.locals.responseType == 'html') {
        return res.send(record.dataValues.html.string);
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
          record.dataValues.html =  we.view.widgets[record.type].render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);
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

    we.view.widgets[req.params.type].formMiddleware(req, res, function (err) {
      if (err) return res.serverError(err);

      res.locals.title = null;

      res.locals.type = req.params.type;
      res.locals.layout = req.params.layout;
      res.locals.theme = req.params.theme;
      res.locals.regions = {};
      // optional params
      res.locals.context = req.query.context;
      res.locals.selectedRegion = req.query.regionName;

      res.locals.controllFields = '';

      setFormControllerAndModelVars(res, we);

      if (res.locals.type)
      res.locals.controllFields += '<input type="hidden" name="type" value="'+res.locals.type+'">';
      if (res.locals.layout)
        res.locals.controllFields += '<input type="hidden" name="layout" value="'+res.locals.layout+'">';
      if (res.locals.theme)
        res.locals.controllFields += '<input type="hidden" name="theme" value="'+res.locals.theme+'">';
      if (res.locals.context)
        res.locals.controllFields += '<input type="hidden" name="context" value="'+res.locals.context+'">';
      if (res.locals.selectedRegion)
        res.locals.controllFields += '<input type="hidden" name="regionName" value="'+res.locals.selectedRegion+'">';

      var html = we.view.widgets[req.params.type].renderForm(res.locals, res.locals.theme);
      res.status(200);
      return res.send(html);
    });
  },

  getForm: function getForm(req, res, next) {
    var we = req.getWe();
    var id = req.params.id;

    res.locals.Model.find({
      where: {id: id}
    }).then(function (record) {
      if (!record) return next();

      res.status(200);

      we.view.widgets[record.type].formMiddleware(req, res, function (err) {
        if (err) return res.serverError(err);

        var widget = record.toJSON();

        widget.regions = {};

        res.locals.selectedRegion = widget.regionName;

        _.merge(res.locals, widget);

        res.locals.controllFields = '';

        setFormControllerAndModelVars(res, we);

        if (record.type)
          res.locals.controllFields += '<input type="hidden" name="type" value="'+record.type+'">';
        if (record.layout)
          res.locals.controllFields += '<input type="hidden" name="layout" value="'+record.layout+'">';
        if (record.theme)
          res.locals.controllFields += '<input type="hidden" name="theme" value="'+record.theme+'">';
        if (record.context)
          res.locals.controllFields += '<input type="hidden" name="context" value="'+record.context+'">';
        if (record.regionName)
          res.locals.controllFields += '<input type="hidden" name="regionName" value="'+record.regionName+'">';

        record.dataValues.html = we.view.widgets[record.type].renderForm(res.locals, res.locals.theme);

        if (res.locals.responseType == 'html') {
          return res.send(record.dataValues.html);
        } else {
          res.locals.record = record;
          return res.ok();
        }
      });
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

          record.dataValues.html = we.view.widgets[record.type].render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);

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

  /**
   * Update theme layout page
   */
  updateThemeLayout: function updateThemeLayout(req, res) {
    var we = req.getWe();

    if (!we.view.themes[req.params.name]) return res.notFound();

    var layoutToUpdate = we.view.themes[req.params.name].layouts[req.params.layout];
    if (!layoutToUpdate)  return res.notFound();

    if (!res.locals.data) res.locals.data = {};

    we.db.models.widget.findAll({
      where: {
        theme: req.params.name,
        layout: req.params.layout,
        context: null
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

function setFormControllerAndModelVars(res, we) {
  res.locals.controllFields += '<div>';
  // controller area
  res.locals.controllFields += '<div class="form-group">';
  res.locals.controllFields += '<label class="col-sm-4 control-label">Controller</label>';
  res.locals.controllFields += '<div class="col-sm-8"><select name="controller" class="form-control"><option></option>';
  for (var controllerName in we.controllers) {
    res.locals.controllFields += '<option value="'+controllerName+'">'+controllerName+'</option>';
  }
  res.locals.controllFields += '</select></div></div>';
  // model area
  res.locals.controllFields += '<div class="form-group">';
  res.locals.controllFields += '<label class="col-sm-4 control-label">Model</label>';
  res.locals.controllFields += '<div class="col-sm-8"><select name="model" class="form-control"><option></option>';
  for (var modelName in we.db.models) {
    res.locals.controllFields += '<option value="'+modelName+'">'+modelName+'</option>';
  }
  res.locals.controllFields += '</select></div></div>';
  res.locals.controllFields += '</div>';
}