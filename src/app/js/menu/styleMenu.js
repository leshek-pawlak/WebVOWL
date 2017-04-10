/**
 * Contains the logic for connecting the changing style with the website.
 *
 * @param graph required for calling a refresh after a style change
 * @returns {{}}
 */
module.exports = function (graph) {

    var styleMenu = {},
      allStyles,
      minHeight = graph.options().umlBoxMinHeight(),
      minWidth = graph.options().umlBoxMinWidth();

    styleMenu.style = graph.options().defaultGraphStyle();
    /**
     * Connects the website with graph styles.
     * @param choosedView save as style
     */
    styleMenu.setup = function () {
      allStyles = d3.selectAll('#styleRadios input');

      allStyles.each(function () {
        var radio = d3.select(this);
        radio.on("click", function() { changeView(radio.attr('value')); });
      });

      d3.select('#styleRadios input[value="'+ styleMenu.style +'"]').property('checked', true).on("click")();

      if (d3.selectAll('circle')[0].length > 0) {
        prepareCircles();
      } else {
        var waitForD3 = setTimeout(function() {
          prepareCircles();
          clearTimeout(waitForD3);
        }, 100);
      }
    };

    /**
     * Resets the style (and also styleed elements) to their default.
     */
    styleMenu.reset = function () {
      clear();

      styleMenu.setup();
    };

    /**
     * Setup and render the current style. It's useful for graph.update
     */
    styleMenu.render = function() {
      styleMenu.setup();
      render();
    };

    function changeView(choosedView) {
      if (choosedView === styleMenu.style) return;
      styleMenu.style = choosedView;

      allStyles.each(function () {
        var radio = d3.select(this);
        radio.property('checked', radio.property('value') === choosedView);
      });

      render();
      graph.update();
      graph.options().searchMenu().requestDictionaryUpdate();
    }

    function clear() {
      changeView(graph.options().defaultGraphStyle());
    }

    function render() {
      d3.selectAll('.elements-to-change').each(function () {
        var element = d3.select(this);
        var textElement = d3.select(getClosestTextElement(element));
        if (styleMenu.style === 'rect') {
          // change circle to rect
          element.property('outerHTML', element.property('outerHTML').replace(/circle/g, 'rect'));
          if (textElement.node()) {
            // save old 'y' value as 'data-y'
            if (!textElement.attr('data-y')) {
              textElement.attr('data-y', textElement.attr('y'));
            }
            // move text to the top of rect. like in UML style.
            textElement.attr('y', -(parseInt(element.attr('height')) / 2) + 5 + 'px');
          }
        } else {
          if (textElement.node() && textElement.attr('data-y')) {
            // restore old 'y' value from 'data-y'
            textElement.attr('y', textElement.attr('data-y'));
          }
          // change rect into circle back again
          element.property('outerHTML', element.property('outerHTML').replace(/rect/g, 'circle'));
        }
      });
    }

    function getClosestTextElement(element) {
      var node = element.node();
      while (node && node.nodeName !== 'text') {
        node = node.nextElementSibling;
      }

      return node;
    }

    function prepareCircles() {
      d3.selectAll('circle:not(.pin):not(.symbol):not(.nofill)').each(function(){
        var circle = d3.select(this);
        var r = circle.property('r').baseVal.value;
        var textElement = getClosestTextElement(circle);
        circle.classed("elements-to-change", true);
        if (!circle.attr('height')) {
          var newHeight = textElement ? textElement.getBoundingClientRect().height + 8 : 26;
          circle.attr('height', newHeight > 40 ? newHeight : 40);
        }
        if (!circle.attr('width')) {
          circle.attr('width', r * 2);
        }
        if (!circle.attr('x')) {
          circle.attr('x', -(parseInt(circle.attr('width')) / 2));
        }
        if (!circle.attr('y')) {
          circle.attr('y',  -(parseInt(circle.attr('height')) / 2));
          if (!circle.attr('height')) {
            var tmpHeight = textElement.getBoundingClientRect().height + 8;
            var newHeight = tmpHeight > minHeight ? tmpHeight : minHeight;
            circle.attr('height', newHeight);
          }
          if (!circle.attr('width')) {
            var newWidth = r * 2;
            circle.attr('width', newWidth > minWidth ? newWidth : minWidth);
          }
        }
      });
    }

    return styleMenu;
};
