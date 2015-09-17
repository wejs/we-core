/**
 * We.js paginate helper to build pagination for lists
 *
 * {{paginate count=metadata.count limit=query.limit currentPage=query.page req=req}}
 */

module.exports = function(we) {
  return function paginateHelper() {
    var options = arguments[arguments.length-1];
    var theme = options.hash.theme || options.data.root.theme;
    var reqQuery, params;
    // old params
    if (options.hash.req) {
      reqQuery = we.utils._.clone(options.hash.req.query);
      delete reqQuery.page;
      var pt = [];
      for (var param in reqQuery) {
        pt.push(param+'='+reqQuery[param]);
      }
      params = pt.join('&');
      if (params) params = '&'+params;
    } else {
      params = '';
    }
    // pagger var, used in paggination template
    var pagger = {
      haveMoreBefore: false,
      previus: false,
      links: [],
      last: {},
      next: false,
      haveMoreAfter: false,
      hideSumary: options.hash.hideSumary,
      count: Number(options.hash.count) || 0,
      limit: Number(options.hash.limit) || 0,
      maxLinks: Number(options.hash.maxLinks) || 2,
      currentPage: Number(options.hash.currentPage) || 0,
      locals: options.hash.req.res.locals
    };

    if (options.hash.req.res.locals.record)
      pagger.recordsLength = options.hash.req.res.locals.record.length;

    var pageCount = Math.ceil(pagger.count/pagger.limit);
    if (!pageCount || pageCount == 1) return '';

    var startInPage = 1;
    var endInPage = pageCount;
    var totalLinks = (pagger.maxLinks*2) +1;

    if ( totalLinks < pageCount ) {
      // check if have more before
      if ((pagger.maxLinks+2) < pagger.currentPage) {
        startInPage = pagger.currentPage - pagger.maxLinks;
        pagger.first = {
          p: '?page='+1+params,
          n: 1
        }
        pagger.haveMoreBefore = true;
      }

      if ( (pagger.maxLinks+pagger.currentPage+1) < pageCount ) {
        endInPage = pagger.maxLinks+pagger.currentPage;
        pagger.last = {
          p: '?page='+pageCount+params,
          n: pageCount
        }
        pagger.haveMoreAfter = true;
      }
    }

    // each link
    for (var i = startInPage; i <= endInPage; i++) {
      pagger.links.push({
        p: '?page='+i+params,
        n: i,
        active: ( i == pagger.currentPage )
      });
    }

    if (pagger.currentPage > 1) {
      pagger.previus = {
        p: '?page='+(pagger.currentPage-1)+params,
        n: (pagger.currentPage-1),
      }
    }

    if (pagger.currentPage < pageCount) {
      pagger.next = {
        p: '?page='+(pagger.currentPage+1)+params,
        n: (pagger.currentPage+1),
      }
    }

    return new we.hbs.SafeString(
      we.view.renderTemplate('paginate', theme, pagger)
    );
  };
}