module.exports = {
  create: function create(req, res) {
    res.locals.layout = false;
    if (req.user) req.body.creatorId = req.user.id;

    var type = req.body.type;
    req.we.view.widgets[type].afterSave(req, res, function() {
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
            context: res.locals.widgetContext || null,
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

    we.db.models.widget.findAll({
      where: {
        theme: req.params.theme,
        regionName: req.params.regionName,
        layout: req.params.layout,
        context: res.locals.widgetContext || null,
      }, order: [ ['weight', 'ASC'], ['createdAt', 'DESC']]
    }).then(function (widgets) {
      if (req.method == 'POST') {
        res.send({ widget: widgets });
      } else {
        res.locals.data = widgets;
        res.ok();
      }
    }).catch(res.queryError);
  },

  findOne: function findOne(req, res) {
    var we = req.getWe();

    res.locals.layout = false;
    res.locals.regionName = req.params.regionName;

    if (!res.locals.data) return res.notFound();
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
      res.locals.data = result.rows;

      return res.ok();
    });
  },

  getSelectWidgetTypes: function getSelectWidgetTypes(req, res) {
    var we = req.getWe();
    res.locals.layout = null;
    res.locals.widgetContext = req.query.widgetContext;

    res.locals.widgetTypes = Object.keys(we.view.widgets);

    // var html = we.view.renderTemplate('widget/selectWidgetTypeForm', res.locals.theme, res.locals);
    return res.send({ widget: res.locals.widgetTypes});
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

        we.utils._.merge(res.locals, widget);

        res.locals.controllFields = '';

        setFormControllerAndModelVars(res, we, record);

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
          res.locals.data = record;
          return res.ok();
        }
      });
    });
  },

  /**
   * Update one widget action
   */
  edit: function update(req, res) {
    var we = req.getWe();

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
      we.view.widgets[type].afterSave(req, res, function() {
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

function setFormControllerAndModelVars(res, we, widget) {
  var context = false;

  if (widget) {
    context = widget.context;
  } else if(res.locals.widgetContext) {
    context = res.locals.widgetContext;
  } else if (res.req.query.context){
    context = res.req.query.context;
  }

  // context field
  if (context) {
    res.locals.controllFields += '<hr><div class="form-group">' +
      '<strong>'+res.locals.__('widget.context')+':</strong> '+
      context+
    '</div>';
  }

  // set selected attr
  var vrq = {
    'in-portal': '',
    'in-context': '',
    'in-session': '',
    'in-session-record': '',
    'in-page': '',
  };

  if (widget && widget.visibility) {
    vrq[widget.visibility] = ' selected="selected" ';
  }

  // visibility field
  res.locals.controllFields += '<div class="form-group"><div class="row">' +
    '<label class="col-sm-4 control-label">'+
    res.locals.__('widget.visibility') + '</label>'+
  '<div class="col-sm-8"><select name="visibility" class="form-control">';

  if (context) {
    res.locals.controllFields +=
    '<option value="in-context"'+vrq['in-context']+'>'+
      res.locals.__('widget.in-context')+
    '</option>';
  } else {
    res.locals.controllFields +=
    '<option value="in-portal"'+vrq['in-portal']+'>'+
      res.locals.__('widget.in-portal')+
    '</option>';
  }

  res.locals.controllFields +=
    '<option value="in-session"'+vrq['in-session']+'>'
      +res.locals.__('widget.in-session')+
    '</option>'+
    // - in-session-record
    '<option value="in-session-record"'+vrq['in-session-record']+'>'+
      res.locals.__('widget.in-session-record')+
    '</option>'+
    // - in-page
    '<option value="in-page"'+vrq['in-page']+'>'+
      res.locals.__('widget.in-page')+
    '</option>'+

  '</select></div></div>'+
  '</div><hr>';
}