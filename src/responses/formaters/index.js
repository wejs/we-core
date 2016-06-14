
/**
 * We.js core response formats
 */


import { jsonAPIFormater } from '../JSONApi'
import { jsonFormater } from '../JSONF'

module.exports = {
  json: jsonFormater,
  'application/json': jsonFormater,
  'application/vnd.api+json': jsonAPIFormater
}