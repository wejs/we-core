var cwd = process.cwd();

module.exports = function(sails) {
  var hook =  {
    // Implicit default configuration
    // (mixed in to `sails.config`)
    defaults: {
      acl: {
        disabled: true
      },
      defaultUserAvatar: cwd + '/assets/core/images/avatars/user-avatar.png',
      site: {
        logo: '/core/images/we-logo-branco-small.png'
      },
      hostname: 'http://localhost:1337',
      clientside: {
        enableClientTranslations: true,
        enableEmberTemplates: true,
        enableClientAdminTranslations: true,
        enableEmberAdminTemplates: true
      },
      models: {
        migrate: 'alter',
        connection: 'dev'
      },
      connections: {
        dev: {
          adapter: 'sails-mysql'
        },
        test: {
          adapter: 'sails-memory'
        }
      },
      upload: {
        wembedImageFolder: 'files/uploads/wembeds',
        image: {
          avaibleStyles: [
            'mini',
            'thumbnail',
            'medium',
            'large'
          ],

          styles: {
            mini: {
              width: '24',
              heigth: '24'
            },
            thumbnail: {
              width: '75',
              heigth: '75'
            },
            medium: {
              width: '250',
              heigth: '250'
            },
            large: {
              width: '640',
              heigth: '640'
            }
          }
        },
      }
    },
    initialize: function(cb) {
      sails.on('hook:orm:loaded', function() {
        sails.acl = require('./acl.js');
        sails.acl.init(sails, function(){});
      });

      cb();
    }
  }
  return hook;
}