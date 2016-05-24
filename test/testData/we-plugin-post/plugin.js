module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  plugin.setResource({ 'name': 'post' });

  return plugin;
};