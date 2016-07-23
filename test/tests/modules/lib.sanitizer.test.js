var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we, sanitizer;

describe('lib.sanitizer', function () {

  before(function (done) {
    we = helpers.getWe();
    sanitizer = we.sanitizer;
    done();
  });


  describe('sanitizeAllAttr', function(){
    it ('should remove uneed tags and attributes from html', function (done){

      var dirtyObj = {
        title: '<div onClick="alert(\'Oi\');">Hello!<script>console.log("hi");</script></div><p>'
      }


      var safeObject = sanitizer.sanitizeAllAttr(dirtyObj)

      assert.equal(safeObject.title, '<div>Hello!</div><p></p>')

      done()
    })
  })
})