const assert = require('assert'),
      request = require('supertest'),
      helpers = require('we-test-tools').helpers,
      Chance = require('chance'),
      chance = new Chance();

let _, http, we;

function dogStub() {
  return {
    name: chance.name(),
  };
}

describe('plugin.fastload.requests', function() {

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    _ = we.utils._;
    return done();
  });

  afterEach(function(done) {
    // delete old dogs
    we.db.models.dog.truncate()
    .then( ()=> {
      done();
      return null;
    })
    .catch(done);
  });

  describe('json', function() {
    describe('GET /dog', function(){
      it ('should return 3 dogs', function (done) {
        const data = [
          dogStub(),
          dogStub(),
          dogStub()
        ];

        we.db.models.dog
        .bulkCreate(data)
        .spread( ()=> {
          request(http)
          .get('/dog')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.error('res.text>',res.text);
              throw err;
            }

            for (var i = 0; i < data.length; i++) {
              assert(res.body.dog[i].id);
            }

            assert.equal(res.body.meta.count, data.length, `Should return 3 dogs`);

            done();
          });
        })
        .catch(done);
      });
    });

    it ('/dog/count should get dogs count', function (done) {
      const data = [
        dogStub(),
        dogStub(),
        dogStub()
      ];

      we.db.models.dog
      .bulkCreate(data)
      .spread( ()=> {
        request(http)
        .get('/dog/count')
        .set('Accept', 'application/json')
        .expect(200)
        .end( (err, res)=> {
          if (err) {
            console.error('res.text>',res.text);
            throw err;
          }

          assert(res.body.count, `Count should be present in response`);
          assert.equal(res.body.count, 3, `Count should be 3`);

          done();
        });
      })
      .catch(done);
    });

  });

  describe('GET /dog/:id', function(){
    it ('Should get one dog', function (done) {
      we.db.models.dog
      .create(dogStub())
      .then( (p)=> {
        request(http)
        .get('/dog/'+p.id)
        .set('Accept', 'application/json')
        .expect(200)
        .end( (err, res)=> {
          if (err) throw err;

          assert(res.body.dog.id);
          assert.equal(res.body.dog.id, p.id);
          assert.equal(res.body.dog.name, p.name);

          done();
        });
      }).catch(done);
    });
  });


  describe('POST /dog/:id/bark', function(){
    it ('Should return dog bark', function (done) {
      we.db.models.dog
      .create(dogStub())
      .then( (p)=> {

        request(http)
        .post('/dog/'+p.id+'/bark')
        .set('Accept', 'application/json')
        .expect(200)
        .end( (err, res)=> {
          if (err) throw err;

          assert(res.body.result);
          assert.equal(res.body.result, 'AuAU');

          done();
        });

      })
      .catch(done);
    });
  });

});
