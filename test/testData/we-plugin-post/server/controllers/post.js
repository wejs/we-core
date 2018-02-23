module.exports = {
  find(req, res) {

    res.locals.query.include.push({
      model: req.we.db.models.tag,
      as: 'tags'
    });

    return res.locals.Model
    .findAll(res.locals.query)
    .then(function count(rows) {

      delete res.locals.query.include;

      return res.locals.Model
      .count(res.locals.query)
      .then(function afterCount(count) {
        return {
          count: count,
          rows: rows
        };
      });
    })
    .then(function afterFindAndCount (result) {
      res.locals.metadata.count = result.count;
      res.locals.data = result.rows;
      res.ok();
      return null;
    })
    .catch(res.queryError);
  }
};