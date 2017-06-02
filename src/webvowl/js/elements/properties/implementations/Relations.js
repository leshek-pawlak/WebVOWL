var BaseProperty = require("../BaseProperty");

module.exports = (function () {

	var o = function (graph) {
		BaseProperty.apply(this, arguments);

		var element;

		this.attributes(["relations"])
			.styleClass("relations")
			.type("relations");

		this.element = function (p) {
			if (!arguments.length) return element;
			element = p;
			return this;
		};

	};
	o.prototype = Object.create(BaseProperty.prototype);
	o.prototype.constructor = o;

	return o;
}());
