/**
 * We.js paginate helper to build pagination for lists
 */

module.exports = function(we) {
  return function() {
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
      haveMoreAfter: false
    };
    var count = Number(options.hash.count) || 0;
    var limit = Number(options.hash.limit) || 0;
    var maxLinks = Number(options.hash.maxLinks) || 2;
    var currentPage = Number(options.hash.currentPage) || 0;

    var pageCount = Math.ceil(count/limit);
    if (!pageCount || pageCount == 1) return '';

    var startInPage = 1;
    var endInPage = pageCount;
    var totalLinks = (maxLinks*2) +1;

    if ( totalLinks < pageCount ) {
      // check if have more before
      if ((maxLinks+2) < currentPage) {
        startInPage = currentPage - maxLinks;
        pagger.first = {
          p: '?page='+1+params,
          n: 1
        }
        pagger.haveMoreBefore = true;
      }

      if ( (maxLinks+currentPage+1) < pageCount ) {
        endInPage = maxLinks+currentPage;
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
        active: ( i == currentPage )
      });
    }

    if (currentPage > 1) {
      pagger.previus = {
        p: '?page='+(currentPage-1)+params,
        n: (currentPage-1),
      }
    }

    if (currentPage < pageCount) {
      pagger.next = {
        p: '?page='+(currentPage+1)+params,
        n: (currentPage+1),
      }
    }

    return new we.hbs.SafeString(
      we.view.renderTemplate('paginate', theme, pagger)
    );
  };
}