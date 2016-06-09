module.exports = function inTitleAndText(searchName, field, value, query, req) {
  req.we.router.search.parsers[field.parser](searchName, 'title', value, query.where, req);
  req.we.router.search.parsers[field.parser](searchName, 'text', value, query.where, req);
}