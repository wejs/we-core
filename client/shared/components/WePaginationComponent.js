
App.WePaginationComponent = Ember.Component.extend({
  currentPage: null,
  totalPages: null,
  maxPagesToDisplay: 9,

  // default actions
  onPageClicked: 'pagerChangePage',
  onStepForward: 'pagerStepForward',
  onStepBackward: 'pagerStepBackward',

  pageItems: (function() {
    var currentPage, idx, maxDistance, maxPages, overspill, pageNumber, pages, positionOfCurrent, toRemove, totalPages;
    currentPage = Number(this.get('currentPage'));
    totalPages = Number(this.get('totalPages'));
    maxPages = Number(this.get('maxPagesToDisplay'));
    maxPages += 1 - maxPages % 2;
    pages = (function() {
      var _i, _results;
      _results = [];
      for (pageNumber = _i = 1; 1 <= totalPages ? _i <= totalPages : _i >= totalPages; pageNumber = 1 <= totalPages ? ++_i : --_i) {
        _results.push({
          ellipses: false,
          page: pageNumber,
          current: currentPage === pageNumber
        });
      }
      return _results;
    })();
    if (pages.length > maxPages) {
      positionOfCurrent = ((maxPages - 1) / 2) + 1;
      if (positionOfCurrent > currentPage) {
        positionOfCurrent = currentPage;
      }
      if ((totalPages - currentPage) < (maxPages - positionOfCurrent)) {
        positionOfCurrent = maxPages - (totalPages - currentPage);
      }
      if ((totalPages - currentPage) > (maxPages - positionOfCurrent)) {
        maxDistance = maxPages - positionOfCurrent;
        overspill = totalPages - currentPage - maxDistance;
        toRemove = overspill + 1;
        idx = totalPages - 1 - toRemove;
        pages.replace(idx, toRemove, [
          {
            ellipses: true
          }
        ]);
      }
      if (currentPage > positionOfCurrent) {
        maxDistance = positionOfCurrent;
        overspill = currentPage - positionOfCurrent;
        toRemove = overspill + 1;
        idx = 1;
        pages.replace(idx, toRemove, [
          {
            ellipses: true
          }
        ]);
      }
    }
    return pages;
  }).property('currentPage', 'totalPages', 'maxPagesToDisplay'),
  canStepForward: (function() {
    var page, totalPages;
    page = Number(this.get('currentPage'));
    totalPages = Number(this.get('totalPages'));
    return page < totalPages;
  }).property('currentPage', 'totalPages'),
  canStepBackward: (function() {
    var page;
    page = Number(this.get('currentPage'));
    return page > 1;
  }).property('currentPage'),
  actions: {
    pageClicked: function(number) {
      return this.sendAction('onPageClicked', number);
    },
    stepForward: function() {
      return this.sendAction('onStepForward');
    },
    stepBackward: function() {
      return this.sendAction('onStepBackward');
    }
  }
});
