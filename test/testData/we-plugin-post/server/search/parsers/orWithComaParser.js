module.exports = function orWithComaParser(searchName, field, value, w) {
  // = [] is same of or in sequelize
  return w[field] = { $or: value.split(',') }
}