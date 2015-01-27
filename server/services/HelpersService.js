exports.getModelsAttributes = function(){
  var models = {};
  _.forEach(sails.models, function(model, i){
    if(!model.emberJsExcludeFromClient && i != 'permissions'){
      models[i] = model._attributes;
    }
  });
  return models;
};

/**
 * Get requireJs script tag
 * @return {string} script tag with requirejs configs
 *
 * DEPRECATED! use HelpersService.getJsScriptTag();
 */
// exports.getRequireJsScriptTag = function() {
//   return HelpersService.getJsScriptTag();
// };
