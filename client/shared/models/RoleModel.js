$(function() {
  App.Role.reopen({
    permissions: DS.attr('array')
  })
});