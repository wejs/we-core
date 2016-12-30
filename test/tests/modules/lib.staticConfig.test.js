var assert = require('assert')
var helpers = require('we-test-tools').helpers
var fs = require('fs')
var path = require('path')
var staticConfig, we

describe('lib.staticConfig', function () {
  before(function (done) {
    staticConfig = require('../../../src/staticConfig')
    we = helpers.getWe()
    done()
  });

  it('static configs should throw error if run without project path', function (done) {
    try {
     staticConfig()
    } catch (e) {

      assert.equal(e.message, 'project path is required for load static configs')

      return done()
    }

    assert(false, 'should throw error')
  })

  it('staticConfig should return we.config (cache) if staticConfigsIsLoad is true', function (done) {
    var w = {
      staticConfigsIsLoad: true,
      config: {
        isMee: true
      }
    }

    var wr = staticConfig(process.cwd(), w)

    assert.equal(wr.isMee, true)

    done()
  })

  it('loadPluginConfigs should return we.config (cache) if pluginConfigsIsLoad is true', function (done) {
    var w = {
      pluginConfigsIsLoad: true,
      config: {
        isMe: true
      }
    }

    var wr = staticConfig.loadPluginConfigs(w)

    assert.equal(wr.isMe, true)

    done()
  })

  it ('readJsonConfiguration should create the configuration.json file if not exists', function (done) {
    this.slow(250)
    var projectConfigFolder = path.resolve(process.cwd(), 'config')
    var cfgFilePath = path.join(we.projectConfigFolder, 'configuration.json')

    fs.unlink(cfgFilePath, function (err) {
      if (err) return done(err)

      var cfg = staticConfig.readJsonConfiguration(projectConfigFolder)

      fs.readFile(cfgFilePath, function (err, result) {
        if (err) return done(err)

        assert(typeof cfg == 'object')
        assert.equal(result.toString(), '{}')

        done()
      })

    })
  })
});