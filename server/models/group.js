/**
 * Group.js
 *
 * @description :: We.js group model
 */
var S = require('string');
var async = require('async');
var _ = require('lodash');

module.exports = function Model(we) {
  var model = {
    definition: {
      name: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      description: {
        type: we.db.Sequelize.TEXT,
      },

      descriptionClean: { type: we.db.Sequelize.TEXT },
      descriptionTeaser: { type: we.db.Sequelize.TEXT },

      // group | cource
      type: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'group'
      },

      // public | restrict | hidden
      privacity: {
        type: we.db.Sequelize.ENUM('public', 'restrict', 'hidden'),
        defaultValue: 'public'
      },

      active: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      }
    },

    associations: {
      logo: {
        type: 'belongsTo',
        model: 'image',
        via: 'inGroupLogo'
      },

      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'groups'
      },

      memberships: {
        type: 'hasMany',
        model: 'membership',
        inverse: 'model',
        constraints: false,
        foreignKey: 'modelId',

      }


      // members: {
      //   type: 'belongsToMany',
      //   model: 'user',
      //   through: {
      //     model: 'membership',
      //     scope: {
      //       modelName: 'group'
      //     }
      //   },
      //   //constraints: false,
      //   foreignKey: 'id',
      //   otherKey: 'modelId'
      // }
    },

    options: {
      termFields: {
        tags: {
          vocabularyId: null,
          canCreate: true
        },
        categories: {
          vocabularyId: 1,
          canCreate: false
        }
      },

      classMethods: {
        createDefaultRoles: function createDefaultRoles(groupId, cb) {
          async.series([
            function memberRole(done) {
              we.db.models.group.createRole(groupId, 'member', done);
            },
            function moderatorRole(done) {
              we.db.models.group.createRole(groupId, 'moderator', done);
            },
            function administratorRole(done) {
              we.db.models.group.createRole(groupId, 'administrator', done);
            }
          ], function(err, results) {
            return cb(err, results.map(function(result){
              return result[0];
            }))
          });
        },
        createDefaultPermissions: function(groupId, cb) {
          // TODO
          cb();
        },
        createRole: function createRole(groupId, roleName, cb) {
          we.db.models.membershiprole.findOrCreate({
            where: { name: roleName, modelId: groupId, modelName: 'group'},
            defaults: { name: roleName, modelId: groupId, modelName: 'group'}
          }).done(cb);
        },
        findAllGroupRoles: function findAllGroupRoles(groupId, cb) {
          we.db.models.membershiprole.findAll({
            where: { modelId: groupId, modelName: 'group'}
          }).done(cb);
        },

        findAllMembers: function findAllMembers(modelId, cb) {
          we.db.models.membership.findAll({
            where: { memberName: 'user', modelName: 'group', modelId: modelId}
          }).done(cb);
        },

        findOneMember: function findOneMember(modelId, userId, cb) {
          we.db.models.membership.find({
            where: {
              memberName: 'user', memberId: userId,
              modelName: 'group', modelId: modelId
            }
          }).done(cb);
        }
      },
      instanceMethods: {
        createRole: function createRole(roleName, cb) {
          we.db.models.group.createRole(this.id, roleName, cb);
        },
        addMember: function addMemberWithRole(userId, roleName, cb) {
          if (!roleName) roleName = 'member';
          var group = this;

          we.db.models.membership.findOrCreate({
            where: {
              memberName: 'user',
              memberId: userId,
              modelName: 'group',
              modelId: this.id
            },
            defaults: {
              memberName: 'user',
              memberId: userId,
              modelName: 'group',
              modelId: this.id
            }
          }).spread(function(membership) {
            group.findAllRoles(function(err, roles) {
              if (err) return cb(err);

              var role;
              for (var i = roles.length - 1; i >= 0; i--) {
                if (roles[i].name == roleName) {
                  role = roles[i];
                  break;
                }
              }

              membership.addRole(role).done(function(err) {
                if (err) return cb(err);
                return cb(null, membership);
              })
            });
          }).catch(cb);
        },

        removeMember: function removeMember(userId, cb) {
          var groupId = this.id;
          we.db.models.membership.find({
            where: {
              memberName: 'user',
              memberId: userId,
              modelName: 'group',
              modelId: groupId
            }
          }).then(function(membership) {
            membership.destroy().then(function() {
              we.db.models.follow.unFollow('group', groupId, userId, cb);
            }).catch(cb);
          }).catch(cb);
        },

        userJoin: function userJoin(userId, cb) {
          this.addMember(userId, 'member', cb);
        },

        userLeave: function userLeave(userId, cb) {
          this.removeMember(userId, cb);
        },

        findAllRoles: function(cb) {
          // cache
          if (this.dataValues.roles) return cb(null, this.dataValues.roles);

          we.db.models.group.findAllGroupRoles(this.id, cb);
        },

        findAllMembers: function(cb) {
          we.db.models.group.findAllMembers(this.id, function(err, memberships){
            if (err) return cb(err);
            return cb(null, memberships);
          });
        },

        findOneMember: function(userId, cb) {
          we.db.models.group.findOneMember(this.id, userId, function(err, membership) {
            if (err) return cb(err);
            return cb(null, membership);
          });
        },

        addContent: function addContent(contentModelName, contentId, cb) {
          we.db.models.groupcontent.findOrCreate({
            where: {
              groupName: 'group',
              groupId: this.id,
              contentModelName: contentModelName,
              contentId: contentId
            },
            defaults: {
              groupName: 'group',
              groupId: this.id,
              contentModelName: contentModelName,
              contentId: contentId
            }
          }).spread(function(groupcontent){
            cb(null, groupcontent);
          }).catch(cb);
        },

        removeContent: function removeContent(contentModelName, contentId, cb) {
          we.db.models.groupcontent.find({
            where: {
              groupName: 'group',
              groupId: this.id,
              contentModelName: contentModelName,
              contentId: contentId
            }
          }).then(function (groupcontent) {
            groupcontent.destroy().then(function(){
              cb();
            }).catch(cb);
          }).catch(cb);
        },

        findContent: function findContent(contentModelName, contentId, cb) {
          we.db.models.groupcontent.find({
            where: {
              groupName: 'group',
              groupId: this.id,
              contentModelName: contentModelName,
              contentId: contentId
            }
          }).done(cb);
        },

        loadMembersCount: function loadMembersCount(cb) {
          we.db.models.membership.count({
            where: {
              memberName: 'user',
              modelName: 'group',
              modelId: this.id
            }
          }).done(cb);
        },

        loadContentCount: function loadContentCount(cb) {
          we.db.models.groupcontent.count({
            where: {
              groupName: 'group',
              groupId: this.id
            }
          }).done(cb);
        },

        loadCounts: function loadCounts(cb) {
          var group = this;
          if (!group.dataValues.meta) group.dataValues.meta = {};

          async.parallel([
            function loadMembers(done) {
              group.loadMembersCount(function(err, count) {
                if (err) return done(err);
                group.dataValues.meta.membersCount = count;
                done();
              });
            },
            function loadContentCount(done) {
              group.loadContentCount(function(err, count) {
                if(err) return done(err);
                group.dataValues.meta.contentsCount = count;
                done();
              })
            }
          ], cb);
        }
      },
      hooks: {
        beforeCreate: function(record, options, next) {
          var originalDescription = record.description;
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);

          if (originalDescription) {
            // save a boy version without all tags
            record.descriptionClean = S(originalDescription).stripTags().s;
            // small teaser text
            record.descriptionTeaser = record.descriptionClean.substr(0, 100);
          } else {
            record.descriptionClean = null;
            record.descriptionTeaser = null;
          }

          next(null, record);
        },
        beforeUpdate: function(record, options, next) {
          var originalDescription = record.description;
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);

          if (originalDescription) {
            // save a boy version without all tags
            record.descriptionClean = S(originalDescription).stripTags().s;
            // small teaser text
            record.descriptionTeaser = record.descriptionClean.substr(0, 100);
          } else {
            record.descriptionClean = null;
            record.descriptionTeaser = null;
          }

          next(null, record);
        },
        // After create default roles and register admin member
        afterCreate: function(record, options, next) {
          we.db.models.group.createDefaultRoles(record.id, function (err, roles) {
            if (err) return next(err);
            record.dataValues.roles = roles;
            record.addMember(record.creatorId, 'administrator', next);
          });
        }
      }
    }
  }

  we.hooks.on('we:before:send:okResponse',  function(data, done) {
    if (data.res.locals.model != 'group') return done();

    if (data.res.locals.record) {
      if (_.isArray(data.res.locals.record)) {
        return async.each(data.res.locals.record, function(record, next) {
          record.loadCounts(function(err) {
            if (err) return data.res.serverError(err);
            if (!data.req.user.id) return next();

            we.db.models.membership.find({where: {
              modelName: 'group',
              modelId: record.id,
              memberName: 'user',
              memberId: data.req.user.id
            }}).done(function(err, result){
              if (err) return data.res.serverError(err);
              // save current user group membership in metadata
              if (result) record.dataValues.meta.membership = result;
              next();
            });
          });
        }, done);
      } else {
        return data.res.locals.record.loadCounts(function(err) {
          if (err) return data.res.serverError(err);
            if (!data.req.user.id) return done();
            we.db.models.membership.find({where: {
              modelName: 'group',
              modelId: data.res.locals.record.id,
              memberName: 'user',
              memberId: data.req.user.id
            }}).done(function(err, result){
              if (err) return data.res.serverError(err);
              // save current user group membership in metadata
              if (result) data.res.locals.record.dataValues.meta.membership = result;
              done();
            });
        });
      }
    }
  });

  return model;
}
