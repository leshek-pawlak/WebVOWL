var HexagonNode = require("../HexagonNode");

module.exports = (function () {

	var o = function (graph) {
		HexagonNode.apply(this, arguments);

		this.type("Rule");
	};
	o.prototype = Object.create(HexagonNode.prototype);
	o.prototype.constructor = o;

	return o;
}());
