var BaseProperty = require("../BaseProperty");

module.exports = (function () {

	var o = function (graph) {
		BaseProperty.apply(this, arguments);

		this.attributes(["relations"])
			.styleClass("relations")
			.type("relations");
	};
	o.prototype = Object.create(BaseProperty.prototype);
	o.prototype.constructor = o;

	return o;
}());
