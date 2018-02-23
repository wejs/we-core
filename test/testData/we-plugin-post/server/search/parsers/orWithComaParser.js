module.exports = function orWithComaParser(searchName, field, value, w) {
  // = [] is same of or in sequelize
  return w[field] = {
    [this.we.db.Sequelize.Op.or]: value.split(',')
  };
};