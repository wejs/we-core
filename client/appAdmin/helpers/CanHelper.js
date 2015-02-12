/**
 * can helper
 *
 * Usage:
 *  {{#can 'pemissionName' modelName='modelname' modelId='modelId'}}
 *    content to show if user can
 *  {{/can}}
 */
window.Handlebars.registerHelper('can', function(permissionName, modelName, model, options) {
  if (arguments.length === 2) {
    options = modelName;
    modelName = null;
  } else {
    model = Ember.get(this, model);
    // TODO handle promisse record
    if (!model.id) {
      model = model.content;
    }
  }

  var canAttName = Permissions.makeCanName(permissionName, modelName, model);
  // set can value
  this.set(canAttName, Permissions.can(permissionName, modelName, model));
  return Ember.Handlebars.helpers.unboundIf.call(this, canAttName, options);
});