/**
 * Widget to show user logo and displayName
 *
 * this widget only works in user-* contexts
 */
module.exports = function (projectPath, Widget) {
  var widget = new Widget('user-logo-and-displayname', __dirname);

  // custom widget method
  widget.checkIfIsValidContext = function checkIfIsValidContext(context) {
    if (!context || context.indexOf('user-') !== 0) {
      return false;
    } else {
      return true
    }
  }

  widget.isAvaibleForSelection = function isAvaibleForSelection(req) {
    if (!req.header) return false;

    var reqContext = req.header('wejs-context');

    if (widget.checkIfIsValidContext(reqContext)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Override default widget class functions before save to check if can save
   */
  widget.beforeSave = function widgetBeforeSave(req, res, next) {
    // check context in create
    if (res.locals.id || widget.checkIfIsValidContext(req.body.context)) {
      next();
    } else {
      next(new Error(res.locals.__('widget.invalid.context')));
    }
  };

  widget.renderVisibilityField = function renderVisibilityField(widget, context, req, res) {
    var field = '';

    // visibility field
    field += '<div class="form-group"><div class="row">' +
      '<label class="col-sm-4 control-label">'+
      res.locals.__('widget.visibility') + '</label>'+
    '<div class="col-sm-8"><select name="visibility" class="form-control">';

    field +=
    '<option value="in-context" selected >'+
      res.locals.__('widget.in-context')+
    '</option>'+
    '</select></div></div>'+
    '</div><hr>';

    return field;
  }

  return widget;
};