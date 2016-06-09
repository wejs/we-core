module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  plugin.setResource({
    name: 'post',
    findAll: {
      search: {
        title:  {
          parser: 'equal',
          target: {
            type: 'field',
            field: 'title'
          }
        },
        text:  {
          parser: 'contains',
          target: {
            type: 'field',
            field: 'text'
          }
        },
        q: {
          parser: 'orWithComaParser',
          target: {
            type: 'inTitleAndText'
          }
        }
      }
    }
  });

  return plugin;
};