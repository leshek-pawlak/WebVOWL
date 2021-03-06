var textTools = require("./textTools")();
var AbstractTextElement = require("./AbstractTextElement");

module.exports = CenteringTextElement;
function CenteringTextElement(container, backgroundColor) {
	AbstractTextElement.apply(this, arguments);
}

CenteringTextElement.prototype = Object.create(AbstractTextElement.prototype);
CenteringTextElement.prototype.constructor = CenteringTextElement;

CenteringTextElement.prototype.addText = function (text, prefix, suffix, isForcedFullLabels, maxTextLineLength) {
	if (text) {
		this.addTextline(text, this.CSS_CLASSES.default, prefix, suffix, isForcedFullLabels, maxTextLineLength);
	}
};

CenteringTextElement.prototype.addSubText = function (text) {
	if (text) {
		this.addTextline(text, this.CSS_CLASSES.subtext, "(", ")");
	}
};

CenteringTextElement.prototype.addEquivalents = function (text) {
	if (text) {
		this.addTextline(text, this.CSS_CLASSES.default);
	}
};

CenteringTextElement.prototype.addInstanceCount = function (instanceCount) {
	if (instanceCount) {
		this.addTextline(instanceCount.toString(), this.CSS_CLASSES.instanceCount);
	}
};


CenteringTextElement.prototype.addTextline = function (text, style, prefix, postfix, isForcedFullLabels, maxTextLineLength) {
	var textLine = isForcedFullLabels? text : textTools.truncate(text, this._textBlock().datum().textWidth(), style);
	textLine = this._applyPreAndPostFix(textLine, prefix, postfix);

	var lines = isForcedFullLabels? textTools.splitToLines(textLine, maxTextLineLength) : [textLine];
	var that = this;

	lines.forEach(function (line) {
		var tspan = that._textBlock().append("tspan")
			.classed(that.CSS_CLASSES.default, true)
			.classed(style, true)
			.text(line)
			.attr("x", 0);
		that._repositionTextLine(tspan);
	});

	this._repositionTextBlock();
};

CenteringTextElement.prototype._repositionTextLine = function (tspan) {
	var fontSizeProperty = window.getComputedStyle(tspan.node()).getPropertyValue("font-size");
	var fontSize = parseFloat(fontSizeProperty);

	var siblingCount = this._lineCount() - 1;
	var lineDistance = siblingCount > 0 ? this.LINE_DISTANCE : 0;

	tspan.attr("dy", fontSize + lineDistance + "px");
};

CenteringTextElement.prototype._repositionTextBlock = function () {
	// Nothing to do if no child elements exist
	var lineCount = this._lineCount();
	if (lineCount < 1) {
		this._textBlock().attr("y", 0);
		return;
	}

	var textBlockHeight = this._textBlock().node().getBBox().height;
	this._textBlock().attr("y", -textBlockHeight * 0.5 + "px");
};

CenteringTextElement.prototype._lineCount = function () {
	return this._textBlock().property("childElementCount");
};
