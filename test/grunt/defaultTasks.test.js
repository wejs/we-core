
var assert = require('assert');
var projectFolder = process.cwd();
var path = require('path');

var wg = require( projectFolder + '/lib/grunt/index.js' )(projectFolder);

describe('Grunt', function () {

  describe('Start', function () {

    it('should load default tasks', function(done){
      wg.loadDefaultTasks();

      // configs
      assert( wg.config , 'error', 'succes');
      assert( wg.config , 'error', 'succes');

      // registers
      assert( wg.register , 'error', 'succes');

      done();
    })
  })
})
