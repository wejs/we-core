module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  plugin.fastLoader = function fastLoader(we, done) {
    // search parsers:
    we.router.search.parsers.orWithMinusParser = function orWithMinusParser(searchName, field, value, w) {
      // = [] is same of or in sequelize
      return w[field] = { $or: value.split(',') };
    }.bind({ we:we});

    // search targets:
    we.router.search.targets.inNameAndDescription =
    function inNameAndDescription(searchName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](searchName, 'title', value, query.where, req);
      req.we.router.search.parsers[field.parser](searchName, 'text', value, query.where, req);
    }.bind({ we: we });

    // controllers:
    we.controllers.dog = new we.class.Controller({
      findOne(req, res, next) {
        // do something in the findOne action...
      },
      cutDogTail(req, res, next) {
        // TODO!
      }
    });

    // model hooks
    we.db.modelHooks.cutDogTail = function cutDogTail(record, options, done) {
      record.tail = null;
      done();
    };

    // model instance methods
    we.db.modelInstanceMethods.bark = function bark() {
      return 'AuAU';
    };

    // model class methods
    we.db.modelClassMethods.jump = function bark(dog) {
      return `${dog.id} jumped!`;
    };

    // JSON model
    we.db.modelsConfigs.dog = we.db.defineModelFromJson( {
      attributes: {
        name: {
          type: 'STRING'
        },
        tail: {
          type: 'STRING',
          defaultValue: 'default'
        }
      },
      options: {
        tableName: 'hotdog'
      }
    }, we);

    done();
  };

  plugin.setResource({
    name: 'dog'
  });

  plugin.setRoutes({
    'post /cut-dog-tail': {
      controller: 'dog',
      model: 'dog',
      action: 'cutDogTail'
    }
  });

  return plugin;
};