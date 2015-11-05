/**
 * Breadcrumb handlers
 */

module.exports = {
  /**
   * Default create breadcrumb function
   * @return {Array} Links array with href and text
   */
  create: function createBreadcrumb() {
    return [{
      href: '/',
      text: this.__('Home')
    }, {
      href: this.req.we.router.urlTo(this.resourceName + '.find', this.req.paramsArray) ,
      text: this.__(this.resourceName + '.find')
    }, {
      href: this.req.urlBeforeAlias,
      text: this.__(this.resourceName + '.create')
    }]
  },

  /**
   * Default find breadcrumb function
   * @return {Array} Links array with href and text
   */
  find: function findBreadcrumb() {
    return [{
      href: '/',
      text: this.__('Home')
    }, {
      href: this.req.urlBeforeAlias,
      text: this.__(this.resourceName + '.find')
    }]
  },

  /**
   * Default findOne breadcrumb function
   * @return {Array} Links array with href and text
   */
  findOne: function findOneBreadcrumb() {
    return [{
      href: '/',
      text: this.__('Home')
    }, {
      href: this.req.we.router.urlTo(this.resourceName + '.find', this.req.paramsArray) ,
      text: this.__(this.resourceName + '.find')
    }, {
      href: this.req.urlBeforeAlias,
      text: this.req.we.utils.string(this.title).truncate(25).s
    }]
  },

  /**
   * Default edit / update breadcrumb function
   * @return {Array} Links array with href and text
   */
  edit: function editBreadcrumb() {
    return [{
      href: '/',
      text: this.__('Home')
    }, {
      href: this.req.we.router.urlTo(this.resourceName + '.find', this.req.paramsArray) ,
      text: this.__(this.resourceName + '.find')
    },{
      href: this.data.getUrlPathAlias(),
      text: this.req.we.utils.string(this.title).truncate(25).s
    },{
      href: this.req.urlBeforeAlias,
      text: this.__('edit')
    }]
  },

  /**
   * Default delete breadcrumb function
   * @return {Array} Links array with href and text
   */
  delete: function breadcrumb() {
    return [{
      href: '/',
      text: this.__('Home')
    }, {
      href: this.req.we.router.urlTo(this.resourceName + '.find', this.req.paramsArray) ,
      text: this.__(this.resourceName + '.find')
    },{
      href: this.data.getUrlPathAlias(),
      text: this.req.we.utils.string(this.title).truncate(25).s
    },{
      href: this.req.urlBeforeAlias,
      text: this.__('delete')
    }]
  }
}