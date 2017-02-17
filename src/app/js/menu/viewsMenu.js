/**
 * Contains the logic for connecting the changing view with the website.
 *
 * @param graph required for calling a refresh after a view change
 * @returns {{}}
 */
module.exports = function (graph) {

    var viewsMenu = {},
        DEFAULT_VIEW = 'circle',
        allViews,
        view = DEFAULT_VIEW;

    /**
     * Connects the website with graph views.
     * @param choosedView save as view
     */
    viewsMenu.setup = function () {
      allViews = d3.selectAll('#viewsRadios input');

      allViews.each(function () {
        var radio = d3.select(this);
        radio.on("click", function() { changeView(radio.attr('value')); });
      });

      d3.select('#viewsRadios input[value="'+ view +'"]').property('checked', true).on("click")();
      
      var waitForD3 = setTimeout(function() {
        d3.selectAll('circle').each(function(){
          var circle = d3.select(this);
          var r = circle.property('r').baseVal.value;
          var size = r * 2;
          circle.classed("elements-to-change", true);
          circle.attr('height', size);
          circle.attr('width', size);
          circle.attr('x', r * -1);
          circle.attr('y', r * -1);
        });
				clearTimeout(waitForD3);
			}, 100);
    };

    /**
     * Resets the view (and also viewed elements) to their default.
     */
    viewsMenu.reset = function () {
      clear();

      viewsMenu.setup();
    };

    function changeView(choosedView) {
      if (choosedView === view) return;
      view = choosedView;

      allViews.each(function () {
        var radio = d3.select(this);
        radio.property('checked', radio.property('value') === choosedView);
      });

      changeElements();
    }

    function clear() {
      changeView(DEFAULT_VIEW);
    }

    function changeElements() {
      d3.selectAll('.elements-to-change').each(function () {
        var element = d3.select(this);
        if (view === 'rect') {
          element.property('outerHTML', element.property('outerHTML').replace(/circle/g, 'rect'));
        } else {
          element.property('outerHTML', element.property('outerHTML').replace(/rect/g, 'circle'));
        }
      });
    }

    return viewsMenu;
};
