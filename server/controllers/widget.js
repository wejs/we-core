module.exports = {
  create: function create(req, res) {
    res.locals.layout = false;
    if (req.user) req.body.creatorId = req.user.id;

    var type = req.body.type;
    req.we.view.widgets[type].beforeSave(req, res, function (err) {
      if (err) return res.queryError(err);

      res.locals.Model.create(req.body)
      .then(function (record) {
        res.locals.template = record.type + '/wiew';
        // run view middleware for load widget view data
        record.viewMiddleware(req, res, function() {
          record.dataValues.html = req.we.view.widgets[record.type].render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);
          if (res.locals.responseType == 'html') {
            return res.status(201).send(record.dataValues.html);
          } else {
            res.locals.data = record;
            return res.created();
          }
        });
      }).catch(res.queryError)
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
    var we = req.we;

    res.locals.regionName = req.params.regionName;
    res.locals.layoutName = req.params.layout;

    if (req.method == 'POST') {
      if (!req.body.widgets)
        return res.badRequest('widgets body params is required');

      we.utils.async.each(req.body.widgets, function (w, next) {
        // start in 1 for sorted widgets
        w.weight = w.weight+1;
        // only update weight field
        we.db.models.widget.update(w, {
          where: {
            theme: req.params.theme,
            regionName: req.params.regionName,
            layout: req.params.layout,
            context: (res.locals.widgetContext || req.query.context || null),
            id: w.id
          }, fields: ['weight']})
        .then(function () {
          next();
        }).catch(next);
      }, function (err) {
        if (err) return res.serverError(err);
        we.controllers.widget.sortWidgetsList(req, res);
      });
    } else {
      we.controllers.widget.sortWidgetsList(req, res);
    }
  },
  sortWidgetsList: function sortWidgetsList(req, res) {
    var we = req.we;

    var where =  {
      theme: { $or: [ req.params.theme, null, ''] },
      layout: req.params.layout,
      regionName: req.params.regionName,
      context: ( req.query.context || res.locals.widgetContext ||  null),

      $or: {
        // url: { $or: [req.params.url, null, '']},
        modelName: { $or: [res.locals.model , null, '']},
        modelId: res.locals.id || null
      }
    };

    we.db.models.widget.findAll({
      where: where,
      order: [ ['weight', 'ASC'], ['createdAt', 'DESC']]
    }).then(function (widgets) {
      if (req.method == 'POST') {
        res.send({ widget: widgets });
      } else {
        res.locals.data = widgets;
        res.ok();
      }
    }).catch(res.queryError);
  },

  findOne: function findOne(req, res, next) {
    var we = req.we;

    res.locals.layout = false;
    res.locals.regionName = req.params.regionName;

    if (!res.locals.data) return next();
    var record = res.locals.data;

    record.viewMiddleware(req, res, function() {
      res.locals.template = record.type + '/wiew';
      res.status(200);

      record.dataValues.html = we.view.widgets[record.type]
      .render({
        locals: res.locals,
        widget: record
      }, res.locals.theme);
      if (res.locals.responseType == 'html') {
        return res.send(record.dataValues.html);
      } else {
        res.locals.data = record;
        return res.ok();
      }
    });
  },

  find: function findAll(req, res) {
    return res.locals.Model.findAndCountAll(res.locals.query, res.locals.queryOptions)
    .then(function (result) {

      if (result && result.rows)  {
        result.rows.forEach(function (record) {
          record.dataValues.html =  req.we.view.widgets[record.type].render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);
        });

        res.locals.metadata.count = result.count;
        res.locals.data = result.rows;
      }

      return res.ok();
    });
  },

  /**
   * action to return widget options avaible for selection
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  getSelectWidgetTypes: function getSelectWidgetTypes(req, res) {
    var we = req.we;

    res.locals.widgetContext = req.query.widgetContext;
    res.locals.widgetTypes = [];

    for (var type in we.view.widgets) {
      if (we.view.widgets[type].isAvaibleForSelection(req, res)) {
        res.locals.widgetTypes.push({
          type: type,
          label: req.__('widget.'+type+'.label')
        })
      }
    }

    // var html = we.view.renderTemplate('widget/selectWidgetTypeForm', res.locals.theme, res.locals);
    return res.send({ widget: res.locals.widgetTypes});
  },

  getCreateForm: function getCreateForm(req, res, next) {
    var we = req.we;

    if (
      !we.view.widgets[req.params.type] ||
      !we.view.themes[req.params.theme]
    ) return next();

    var layoutToUpdate = we.view.themes[req.params.theme].layouts[req.params.layout];
    if (!layoutToUpdate) return next();

    we.view.widgets[req.params.type].formMiddleware(req, res, function (err) {
      if (err) return res.serverError(err);

      res.locals.title = null;

      var context = false;

      if(res.locals.widgetContext) {
        context = res.locals.widgetContext;
      } else if (req.query.context) {
        context = req.query.context;
      }

      var widgetType = we.view.widgets[req.params.type];

      res.locals.type = req.params.type;
      res.locals.layout = req.params.layout;
      res.locals.theme = req.params.theme;
      res.locals.regions = {};
      // optional params
      res.locals.context = req.query.context;
      res.locals.selectedRegion = req.query.regionName;

      res.locals.controllFields = '';

      res.locals.controllFields += widgetType.rederContextField(null, context, req, res);
      res.locals.controllFields += widgetType.renderVisibilityField(null, context, req, res);
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
    var we = req.we;
    var id = req.params.id;

    res.locals.Model.findOne({
      where: { id: id }
    }).then(function (record) {
      if (!record) return next();

      res.status(200);

      var context = record.context || false;

      var widgetType = we.view.widgets[record.type];

      widgetType.formMiddleware(req, res, function (err) {
        if (err) return res.serverError(err);

        var widget = record.toJSON();

        widget.regions = {};

        res.locals.selectedRegion = widget.regionName;

        we.utils._.merge(res.locals, widget);

        res.locals.controllFields = '';

        res.locals.controllFields += widgetType.rederContextField(record, context, req, res);
        res.locals.controllFields += widgetType.renderVisibilityField(record, context, req, res);

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
          res.send(record.dataValues.html);
        } else {
          res.locals.data = record;
          res.ok();
        }
      });
    }).catch(res.queryError);
  },

  /**
   * Update one widget action
   */
  edit: function update(req, res) {
    var we = req.we;

    var id = res.locals.id;
    // never update widget context in update action
    delete req.body.context;
    // remove layout for this response
    res.locals.layout = false;
    // check if the widget exists
    res.locals.Model.findById(id)
    .then(function (record) {
      if (!record) return res.notFound();
      var type = record.type;
      we.view.widgets[type].beforeSave(req, res, function (err) {
        if (err) return res.queryError(err);
        // update in db
        record.updateAttributes(req.body)
        .then(function() {
          res.locals.template = record.type + '/wiew';
          res.status(200);
          // run view middleware for load widget view data
          record.viewMiddleware(req, res, function() {
            record.dataValues.html = we.view.widgets[record.type].render({
              locals: res.locals,
              widget: record
            }, res.locals.theme);

            if (res.locals.responseType == 'html') {
              return res.send(record.dataValues.html);
            } else {
              res.locals.data = record;
              return res.ok();
            }
          });
        });
      });
    });
  }
};