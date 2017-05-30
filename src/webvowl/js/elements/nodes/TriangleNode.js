var BaseNode = require("./BaseNode");
var CenteringTextElement = require("../../util/CenteringTextElement");
var drawTools = require("../drawTools")();

module.exports = (function () {

	var o = function (graph) {
		BaseNode.apply(this, arguments);

		var that = this,
			width = 60,
			height = width * Math.sqrt(3) / 2,
			pinGroupElement,
			haloGroupElement,
			radius = width * Math.sqrt(3) / 3;

		// Properties
		this.width = function (p) {
			if (!arguments.length) return width;
			width = p;
			return this;
		};

		this.height = function (p) {
			if (!arguments.length) return height;
			height = p;
			return this;
		};

		this.getHalos = function () {
			return haloGroupElement;
		};

		this.radius = function (p) {
			if (!arguments.length) return radius;
			radius = p;
			return this;
		};

		// Functions
		this.actualRadius = function () {
			if (!graph.options().scaleNodesByIndividuals() || that.individuals().length <= 0) {
				return that.radius();
			} else {
				// we could "listen" for radius and maxIndividualCount changes, but this is easier
				var MULTIPLIER = 8,
					additionalRadius = Math.log(that.individuals().length + 1) * MULTIPLIER + 5;

				return that.radius() + additionalRadius;
			}
		};

		this.distanceToBorder = function (dx, dy) {
			return that.actualRadius();
		};

		this.setHoverHighlighting = function (enable) {
			that.nodeElement().selectAll("path.triangle").classed("hovered", enable);

			var haloGroup=that.getHalos();
			if (haloGroup){
				var test=haloGroup.selectAll(".searchResultA");
				test.classed("searchResultA", false);
				test.classed("searchResultB", true);
			}

		};

		this.textWidth = function () {
			return this.width();
		};

		this.toggleFocus = function () {
			that.focused(!that.focused());
			that.nodeElement().select("path.triangle").classed("focused", that.focused());
			graph.resetSearchHighlight();
			graph.options().searchMenu().clearText();
		};

		/**
		 * Draws the triangle node.
		 * @param parentElement the element to which this node will be appended
		 * @param [additionalCssClasses] additional css classes
		 */
		this.draw = function (parentElement, additionalCssClasses) {
			var textBlock,
				cssClasses = that.collectCssClasses();

			that.nodeElement(parentElement);

			if (additionalCssClasses instanceof Array) {
				cssClasses = cssClasses.concat(additionalCssClasses);
			}
			drawTools.appendTriangleClass(parentElement, that.width(), that.height(), cssClasses, that.labelForCurrentLanguage(), that.backgroundColor());

			textBlock = new CenteringTextElement(parentElement, that.backgroundColor());
			textBlock.addText(that.labelForCurrentLanguage());

			that.addMouseListeners();

			if (that.pinned()) {
				that.drawPin();
			}
			if (that.halo()) {
				that.drawHalo();
			}
		};

		this.drawPin = function () {
			that.pinned(true);

			var dx = 0.25 * width,
				dy = -0.5 * height;

			pinGroupElement = drawTools.drawPin(that.nodeElement(), dx, dy, this.removePin);
		};

		this.removePin = function () {
			that.pinned(false);
			if (pinGroupElement) {
				pinGroupElement.remove();
			}
			graph.updateStyle();
		};

		this.removeHalo = function () {
			that.halo(false);
			if (haloGroupElement) {
				haloGroupElement.remove();
				haloGroupElement=null;
			}
		};

		this.drawHalo = function () {
			that.halo(true);

			var offset = 15;
			haloGroupElement = drawTools.drawRectHalo(that, this.width(), this.height(), offset);

		};
	};
	o.prototype = Object.create(BaseNode.prototype);
	o.prototype.constructor = o;

	return o;
}());
