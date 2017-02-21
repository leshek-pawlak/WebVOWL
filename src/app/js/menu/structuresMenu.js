/**
 * Contains the logic for connecting the changing structure with the website.
 *
 * @param graph required for calling a refresh after a structure change
 * @returns {{}}
 */
module.exports = function (graph) {

    var structuresMenu = {},
        DEFAULT_VIEW = 'circle',
        allStructures,
        structure = DEFAULT_VIEW;

    /**
     * Connects the website with graph structures.
     * @param choosedView save as structure
     */
    structuresMenu.setup = function () {
      allStructures = d3.selectAll('#structuresRadios input');

      allStructures.each(function () {
        var radio = d3.select(this);
        radio.on("click", function() { changeView(radio.attr('value')); });
      });

      d3.select('#structuresRadios input[value="'+ structure +'"]').property('checked', true).on("click")();

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
     * Resets the structure (and also structureed elements) to their default.
     */
    structuresMenu.reset = function () {
      clear();

      structuresMenu.setup();
    };

    /**
     * Setup and render the current structure. It's useful for graph.update
     */
    structuresMenu.render = function() {
      structuresMenu.setup();
      render();
    };

    function changeView(choosedView) {
      if (choosedView === structure) return;
      structure = choosedView;

      allStructures.each(function () {
        var radio = d3.select(this);
        radio.property('checked', radio.property('value') === choosedView);
      });

      render();
    }

    function clear() {
      changeView(DEFAULT_VIEW);
    }

    function render() {
      d3.selectAll('.elements-to-change').each(function () {
        var element = d3.select(this);
        var textElement = d3.select(getClosestTextElement(element));
        if (structure === 'rect') {
          // change circle to rect
          element.property('outerHTML', element.property('outerHTML').replace(/circle/g, 'rect'));
          // save old 'y' value as 'data-y'
          if (!textElement.attr('data-y')) {
            textElement.attr('data-y', textElement.attr('y'));
          }
          // move text to the top of rect. like in UML structure.
          textElement.attr('y', -1 * parseInt(element.attr('r')) + 5 + 'px');
        } else {
          if (textElement.attr('data-y')) {
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
      while (typeof node === 'object' && node.nodeName !== 'text') {
        node = node.nextElementSibling;
      }

      return node;
    }

    function prepareCircles() {
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
    }

    return structuresMenu;
};
