var BaseNode = require("./BaseNode");
var CenteringTextElement = require("../../util/CenteringTextElement");
var drawTools = require("../drawTools")();

module.exports = (function () {

	var o = function (graph) {
		BaseNode.apply(this, arguments);

		var that = this,
			pinGroupElement,
			haloGroupElement,
			mostPopularCornerPoint = 0,
			middleSidePoints = [],
			radius = 15,
			height = Math.sqrt(3) / 2,
	    hexagonData = [];

		function getMostPopularCornerPoint(cornerPoints) {
			cornerPoints.sort();
			var max=0,result,freq = 0;
			for(var i=0; i < cornerPoints.length; i++){
					if(cornerPoints[i]===cornerPoints[i+1]){
							freq++;
					}
					else {
							freq=0;
					}
					if(freq>max){
							result = cornerPoints[i];
							max = freq;
					}
			}
			return result;
		}
		// Properties
		this.radius = function (p) {
			if (!arguments.length) return radius;
			radius = p;
			return this;
		};

		this.height = function (p) {
			if (!arguments.length) return height;
			height = p;
			return this;
		};

		this.hexagonData = function (p) {
			if (!arguments.length) return hexagonData;
			hexagonData = p;
			var cornerPoints = [];
			for (var i = 0; i <= hexagonData.length; i++) {
				var p = i - 1;
				if (i < hexagonData.length) {
					middleSidePoints[i] = Math.abs(hexagonData[i].y / hexagonData[i].x);
				}
				if (p > -1) {
					if (middleSidePoints[i]) {
						cornerPoints.push((middleSidePoints[p] + middleSidePoints[i]) / 3);
					} else {
						cornerPoints.push((middleSidePoints[p] + middleSidePoints[0]) / 3);
					}
				}
				mostPopularCornerPoint = getMostPopularCornerPoint(cornerPoints);
			}

			return this;
		};

		this.getHalos = function () {
			return haloGroupElement;
		};

		this.actualRadius = function () {
			return radius;
		};

		// set hexagonData
		this.hexagonData([
			{ "x": radius, "y": 0 },
			{ "x": radius / 2,  "y": radius * height },
			{ "x": -radius / 2,  "y": radius * height },
			{ "x": -radius, "y": 0 },
			{ "x": -radius / 2,  "y": -radius * height },
			{ "x": radius / 2, "y": -radius * height }
		]);

		this.distanceToBorder = function (dx, dy) {
			var abs = Math.abs(dy / dx);
			var partOfRadius = radius / 6;
			// maximum is sixth part of radius. It's always a top corner.
			var m_link = abs > partOfRadius ? partOfRadius : abs;

			return radius + m_link;
		};

		this.setHoverHighlighting = function (enable) {
			that.nodeElement().selectAll("path.hexagon").classed("hovered", enable);

			var haloGroup=that.getHalos();
			if (haloGroup){
				var test=haloGroup.selectAll(".searchResultA");
				test.classed("searchResultA", false);
				test.classed("searchResultB", true);
			}

		};

		this.textWidth = function () {
			return this.radius() * 2;
		};

		this.toggleFocus = function () {
			that.focused(!that.focused());
			that.nodeElement().select("path.hexagon").classed("focused", that.focused());
			graph.resetSearchHighlight();
			graph.options().searchMenu().clearText();
		};

		/**
		 * Draws the hexagon node.
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
			drawTools.appendHexagonClass(parentElement, that.radius(), that.height(), that.hexagonData(), cssClasses, that.labelForCurrentLanguage(), that.backgroundColor());

			// textBlock = new CenteringTextElement(parentElement, that.backgroundColor());
			// textBlock.addText(that.labelForCurrentLanguage());

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

			var dx = 0.25 * radius,
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
			haloGroupElement = drawTools.drawRectHalo(that, this.radius(), this.height(), offset);

		};
	};
	o.prototype = Object.create(BaseNode.prototype);
	o.prototype.constructor = o;

	return o;
}());
