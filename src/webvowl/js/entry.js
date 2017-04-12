require("../css/vowl.css");

var nodeMap = require("./elements/nodes/nodeMap")();
var propertyMap = require("./elements/properties/propertyMap")();


var webvowl = {};
webvowl.graph = require("./graph");
webvowl.options = require("./options");
webvowl.version = "@@WEBVOWL_VERSION";

webvowl.util = {};
webvowl.util.constants = require("./util/constants");
webvowl.util.languageTools = require("./util/languageTools");
webvowl.util.elementTools = require("./util/elementTools");

webvowl.modules = {};
webvowl.modules.colorExternalsSwitch = require("./modules/colorExternalsSwitch");
webvowl.modules.compactNotationSwitch = require("./modules/compactNotationSwitch");
webvowl.modules.datatypeFilter = require("./modules/datatypeFilter");
webvowl.modules.disjointFilter = require("./modules/disjointFilter");
webvowl.modules.focuser = require("./modules/focuser");
webvowl.modules.emptyLiteralFilter = require("./modules/emptyLiteralFilter");
webvowl.modules.nodeDegreeFilter = require("./modules/nodeDegreeFilter");
webvowl.modules.nodeScalingSwitch = require("./modules/nodeScalingSwitch");
webvowl.modules.objectPropertyFilter = require("./modules/objectPropertyFilter");
webvowl.modules.pickAndPin = require("./modules/pickAndPin");
webvowl.modules.selectionDetailsDisplayer = require("./modules/selectionDetailsDisplayer");
webvowl.modules.setOperatorFilter = require("./modules/setOperatorFilter");
webvowl.modules.statistics = require("./modules/statistics");
webvowl.modules.subclassFilter = require("./modules/subclassFilter");
webvowl.modules.tagFilter = require("./modules/tagFilter");


webvowl.nodes = {};
webvowl.findGetParameter = findGetParameter;
webvowl.updateParam = updateParam;

nodeMap.entries().forEach(function (entry) {
	mapEntryToIdentifier(webvowl.nodes, entry);
});

webvowl.properties = {};
propertyMap.entries().forEach(function (entry) {
	mapEntryToIdentifier(webvowl.properties, entry);
});

function mapEntryToIdentifier(map, entry) {
	var identifier = entry.key.replace(":", "").toLowerCase();
	map[identifier] = entry.value;
}

// get parameter from URL
function findGetParameter(parameterName) {
	var result = null,
			tmp = [];
	location.search
		.substr(1)
		.split("&")
		.forEach(function (item) {
			tmp = item.split("=");
			if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
	});
	return result;
}

// set, overwrite or delete parameter in URL
function updateParam(key, value) {
	var kvp = location.search.substr(1).split('&');
	var path = '/';
	key = encodeURI(key);
	if (value) {
		value = encodeURI(value);
		if (kvp[0] === "") {
			kvp = [];
		}
		var i = kvp.length;
		var x;
		while(i--) {
			x = kvp[i].split('=');
			if (x[0] === key) {
				if (!value) {}
				x[1] = value;
				kvp[i] = x.join('=');
				break;
			}
		}
		if (i < 0) {
			kvp[kvp.length] = [key,value].join('=');
		}
		path += '?' + kvp[0];
		if (kvp.length > 1) {
			path += kvp.join('&');
		}
	} else {
		for (var i = 0; i < kvp.length; i++) {
			if (kvp[i].indexOf(key) === -1) {
				path += kvp[i];
			}
		}
	}
	path += location.hash;
	// change url without reload the page
	history.pushState(null, null, path);
}

module.exports = webvowl;
