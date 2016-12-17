const fs = require('fs'),
      path = require('path');

module.exports = {
  requirements(we, done) {
    done();
  },
  /**
   * Install function run in we.js install.
   *
   * @param  {Object}   we    we.js object
   * @param  {Function} done  callback
   */
  install(we, done) {
    done();
  },

  /**
   * Return a list of updates
   *
   * @param  {Object} we we.js object
   * @return {Array}    a list of update objects
   */
  updates() {
    return [{
      version: '0.3.69', // your plugin version
      update(we, done) {
        const sql = 'ALTER TABLE `widgets` ADD '+
          ' COLUMN `inRecord` TINYINT(1) DEFAULT NULL;';
        we.db.defaultConnection
        .query(sql)
        .then( ()=> {
          done();
          return null;
        })
        .catch(done);
      }
    } , {
      version: '0.3.120',
      update(we, done) {

        we.utils.async.series([
          function changeWidgetTableThemeField(done) {
            const sql = 'ALTER TABLE `widgets` '+
              'CHANGE COLUMN `theme` `theme` VARCHAR(255) NULL ;';
            we.db.defaultConnection
            .query(sql)
            .then( ()=> {
              done();
              return null;
            })
            .catch(done);
          },
          function addRoleIsSystemField(done) {
            const sql = 'ALTER TABLE `roles` ' +
              'ADD COLUMN `isSystemRole` TINYINT(1) NULL DEFAULT 0 AFTER `updatedAt`;';
            we.db.defaultConnection
            .query(sql)
            .then( ()=> {
              done();
              return null;
            })
            .catch( (err)=> {
              if (err != 'SequelizeDatabaseError') {
                return done(err);
              } else {
                we.log.error(err);
              }

              done();
              return null;
            });
          }
        ], done);
      }
    },
    {
      version: '1.0.2',
      update(we, done) {
        we.utils.async.series([
          function addWidgetTablURLField(done) {
            var sql = 'ALTER TABLE `widgets` '+
              ' ADD COLUMN `path` TEXT NULL; ';
            we.db.defaultConnection
            .query(sql)
            .then( ()=> {
              done();
              return null;
            })
            .catch( (err)=> {
              if (err != 'SequelizeDatabaseError') {
                return done(err);
              } else {
                we.log.error(err);
              }
              done();
              return null;
            });
          }
        ], done);
      }
    },
    {
      version: '1.1.4',
      update(we, done) {
        we.utils.async.series([
          function updateUserTable(done) {
            var sql = 'ALTER TABLE `users` '+
              ' ADD COLUMN `roles` TEXT NULL; ';
            we.db.defaultConnection
            .query(sql)
            .then( ()=> {
              done();
            })
            .catch( (err)=> {
              if (err) {
                we.log.error(err);
              }

              done();
              return null;
            });
          },

          function migrateRolesField(done) {
            var sql = ' SELECT users_roles.userId, roles.name FROM users_roles '+
            ' LEFT JOIN roles ON roles.id=users_roles.roleId;';
            we.db.defaultConnection
            .query(sql)
            .spread( (results)=> {
              var users = {};

              we.utils.async.eachSeries(results, function onEachResult(r, next){
                if (!users[r.userId]) {
                  users[r.userId] = {
                    id: r.userId,
                    roles: []
                  };
                }

                users[r.userId].roles.push(r.name);
                next();
              }, function afterEachResult(){
                we.utils.async.eachSeries(users, function onUpdateEachUser(user, next){

                  we.db.models.user
                  .update(user, {
                    where: {
                      id: user.id
                    }
                  })
                  .then(function afterUpdateAllUsers(r) {
                    we.log.info('install.js:Update user data:', r);
                    next();
                    return null;
                  })
                  .catch(next);
                }, ()=> {
                  done();
                });
              });
              // done();
            })
            .catch( (err)=> {
              if (err) {
                we.log.warn(err);
              }
              done();
              return null;
            });
          },
          function exportRoles(done) {
            fs.lstat(we.projectPath+'/config/roles.js', function afterCheckRolesFile(err) {
              if (err) {

                if (err.code == 'ENOENT') {
                  const sql = 'SELECT name, permissions FROM roles;';
                  we.db.defaultConnection.query(sql)
                  .spread( (results)=> {

                    for (let i = 0; i < results.length; i++) {
                      if (results[i].permissions) {

                        if (!we.acl.roles[results[i].name]) {
                          // add new role if not exists
                          we.acl.roles[results[i].name] = {
                            name: results[i].name,
                            permissions: []
                          };
                        }
                        // export old permissions to new permission structure
                        let permissions = results[i].permissions.split(';');
                        we.acl.roles[results[i].name].permissions = permissions;
                      }
                    }

                    we.acl.writeRolesToConfigFile(done);
                  }).catch( (err)=> {
                    if (err) {
                      we.log.error(err);
                    }
                    done();
                  });
                } else {
                  we.log.error('we-core:update:1.1.3: unknow error on find roles.js file');
                  done(err);
                }
              } else {
                we.log.info('we-core:update:1.1.3: found foles.js file in your project, skiping exportRoles');
                done();
              }
            });

          }
        ], done);
      }
    },
    {
      version: '1.2.6',
      update(we, done) {
        we.log.info(
          'instaling we-plugin-editor-summernote in this project, editor feature now are in diferent npm modules'
        );

        let exec = require('child_process').exec, child;
        child = exec('npm install --save we-plugin-editor-summernote',
        function afterInstall(error) {
          we.log.info('DONE we-plugin-editor-summernote install');
          done(error);
        });
      }
    },
    {
      version: '1.8.0',
      update(we, done) {
        we.log.info(
          'registering all installed plugins to work with new we.js plugin manager'
        );

        const pkg = require( path.resolve(we.projectPath, 'package.json') ),
              nodeModulesPath = path.resolve(we.projectPath, 'node_modules');

        if (!pkg.wejs) pkg.wejs = {};
        if (!pkg.wejs.plugins) pkg.wejs.plugins = {};

        for (let n in pkg.dependencies) {
          if (n != 'we-core' &&
            oldIsPlugin( path.resolve(nodeModulesPath,   n))
          ) {
            pkg.wejs.plugins[n] = true;
          }
        }

        fs.writeFile(
          path.resolve(we.projectPath, 'package.json'),
          JSON.stringify(pkg, null, 2),
          { flags: 'w' },
          function (err) {
            if (err) return done(err);

            let We = require('./src/index.js'),
                weUp = new We({
              bootstrapMode: 'install'
            });

            weUp.bootstrap( (err)=> {
              if (err) return done(err);
              done();
              return null;
            });
          }
        );

        // old we.js is plugin function to check is one npm module is plugin
        function oldIsPlugin (nodeModulePath) {
          // then check if the npm module is one plugin
          try {
            if (fs.statSync( path.resolve( nodeModulePath, 'plugin.js' ) )) {
              return true;
            } else {
              return false;
            }
          } catch (e) {
            return false;
          }
        }
      }
    }
    ];
  }
};