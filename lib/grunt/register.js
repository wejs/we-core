module.exports = {

  compileAssets: [
    'clean:dev',
    'weThemeEmberHandlebars',
    'fileindex'
  ],

  build: [
    'compileAssets',
    'concat',
    'cssmin',
    'uglify',
    'clean:afterProdBuild'
  ],

  dev: [
    'compileAssets',
    'watch'
  ],

  'default': [
    'dev'
  ]
}