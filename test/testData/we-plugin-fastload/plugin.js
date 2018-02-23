module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  plugin.fastLoader = function fastLoader(we, done) {
  const Op = we.db.Sequelize.Op;

    // search parsers:
    we.router.search.parsers.orWithMinusParser = function orWithMinusParser(searchName, field, value, w) {
      // = [] is same of or in sequelize
      return w[field] = { [Op.or]: value.split(',') };
    };

    // search targets:
    we.router.search.targets.inNameAndDescription =
    function inNameAndDescription(searchName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](searchName, 'title', value, query.where, req);
      req.we.router.search.parsers[field.parser](searchName, 'text', value, query.where, req);
    };

    // controllers:
    we.controllers.dog = new we.class.Controller({
      bark(req, res) {
        req.we.db.models.dog
        .findById(req.params.id)
        .then( (d)=> {
          if (!d) return res.notFound('dog.not.found');

          res.send({ result: d.bark() });
          return null;
        })
        .catch(res.queryError);
      }
    });

    // model hooks
    we.db.modelHooks.giveVaccine = function giveVaccine(record) {
      if (record.age > 1) {
        record.vaccine = record.vaccine+1;
      }
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
        vaccine: {
          type: 'INTEGER',
          dafaultValue: 0
        },
        age: {
          type: 'INTEGER',
          dafaultValue: 1
        }
      },
      options: {
        tableName: 'hotdog'
      },
      hooks: {
        beforeUpdate: [ 'giveVaccine' ]
      },
      instanceMethods: {
        bark: 'bark'
      },
      classMethods: {
        jump: 'jump'
      }
    }, we);

    done();
  };

  plugin.setResource({
    name: 'dog'
  });

  plugin.setRoutes({
    'post /dog/:id/bark': {
      controller: 'dog',
      model: 'dog',
      action: 'bark'
    }
  });

  return plugin;
};