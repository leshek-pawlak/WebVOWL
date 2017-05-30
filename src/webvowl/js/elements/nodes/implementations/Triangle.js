var TriangleNode = require("../TriangleNode");

module.exports = (function () {

	var o = function (graph) {
		TriangleNode.apply(this, arguments);

		this.attributes(["triangle"])
			.type("Triangle");
	};
	o.prototype = Object.create(TriangleNode.prototype);
	o.prototype.constructor = o;

	return o;
}());
