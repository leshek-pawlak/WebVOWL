module.exports = function () {
	var options = {},
		data,
		graphContainerSelector,
		classDistance = 200,
		datatypeDistance = 120,
		loopDistance = 100,
		charge = -500,
		gravity = 0.025,
		linkStrength = 1,
		height = 600,
		width = 800,
		selectionModules = [],
		filterModules = [],
		segmentsModule,
		pickAndPinModule,
		minMagnification = 0.95,
		maxMagnification = 4,
		compactNotation = false,
		// some filters
		literalFilter,
		// menus
		gravityMenu,
		filterMenu,
		modeMenu,
		pausedMenu,
		resetMenu,
		searchMenu,
		ontologyMenu,
		sidebar,
		styleMenu,
		navigationMenu,
		scaleNodesByIndividuals = false,
		paused = false,
		datatypeFilterEnabled = false,
		objectPropertyFilterEnabled = false,
		forceFullLabels = false,
		labelMaxTextLineLength = 45,
		cardinalityVisible = true,
		cardinalityPlacement = "CLASS",
		hideTextInsideBoxes = true,
		umlBoxMinHeight = 30,
		umlBoxMinWidth = 100,
		defaultGraphStyle = "rect",
		centerOnLoad = true,
		centerOnFoundElement = true;

	options.sidebar= function(s){
		if (!arguments.length) return sidebar;
		sidebar = s;
		return options;
	};

	options.navigationMenu= function (m){
		if (!arguments.length) return navigationMenu;
		navigationMenu = m;
		return options;

	};
	options.ontologyMenu = function (m){
		if (!arguments.length) return ontologyMenu;
		ontologyMenu = m;
		return options;
	};

	options.searchMenu = function (m) {
		if (!arguments.length) return searchMenu;
		searchMenu = m;
		return options;
	};


	options.resetMenu = function (m) {
		if (!arguments.length) return resetMenu;
		resetMenu = m;
		return options;
	};

	options.pausedMenu = function (m) {
		if (!arguments.length) return pausedMenu;
		pausedMenu = m;
		return options;

	};

	options.pickAndPinModule = function (m) {
		if (!arguments.length) return pickAndPinModule;
		pickAndPinModule = m;
		return options;
	};

	options.gravityMenu = function (m) {
		if (!arguments.length) return gravityMenu;
		gravityMenu = m;
		return options;

	};

	options.filterMenu = function (m) {
		if (!arguments.length) return filterMenu;
		filterMenu = m;
		return options;
	};

	options.modeMenu = function (m) {
		if (!arguments.length) return modeMenu;
		modeMenu = m;
		return options;
	};

	options.charge = function (p) {
		if (!arguments.length) return charge;
		charge = +p;
		return options;
	};

	options.classDistance = function (p) {
		if (!arguments.length) return classDistance;
		classDistance = +p;
		return options;
	};

	options.compactNotation = function (p) {
		if (!arguments.length) return compactNotation;
		compactNotation = p;
		return options;
	};

	options.data = function (p) {
		if (!arguments.length) return data;
		data = p;
		return options;
	};

	options.datatypeDistance = function (p) {
		if (!arguments.length) return datatypeDistance;
		datatypeDistance = +p;
		return options;
	};

	options.filterModules = function (p) {
		if (!arguments.length) return filterModules;
		filterModules = p;
		return options;
	};

	options.segmentsModule = function (p) {
		if (!arguments.length) return segmentsModule;
		segmentsModule = p;
		return options;
	};

	options.graphContainerSelector = function (p) {
		if (!arguments.length) return graphContainerSelector;
		graphContainerSelector = p;
		return options;
	};

	options.gravity = function (p) {
		if (!arguments.length) return gravity;
		gravity = +p;
		return options;
	};

	options.height = function (p) {
		if (!arguments.length) return height;
		height = +p;
		return options;
	};

	options.linkStrength = function (p) {
		if (!arguments.length) return linkStrength;
		linkStrength = +p;
		return options;
	};

	options.loopDistance = function (p) {
		if (!arguments.length) return loopDistance;
		loopDistance = p;
		return options;
	};

	options.minMagnification = function (p) {
		if (!arguments.length) return minMagnification;
		minMagnification = +p;
		return options;
	};

	options.maxMagnification = function (p) {
		if (!arguments.length) return maxMagnification;
		maxMagnification = +p;
		return options;
	};

	options.scaleNodesByIndividuals = function (p) {
		if (!arguments.length) return scaleNodesByIndividuals;
		scaleNodesByIndividuals = p;
		return options;
	};

	options.selectionModules = function (p) {
		if (!arguments.length) return selectionModules;
		selectionModules = p;
		return options;
	};

	options.width = function (p) {
		if (!arguments.length) return width;
		width = +p;
		return options;
	};

	options.literalFilter=function (p) {
		if (!arguments.length) return literalFilter;
		literalFilter=p;
		return options;
	};

	options.paused = function (p) {
		if (!arguments.length) return paused;
		paused = p;
		return options;
	};


	options.styleMenu = function (p) {
		if (!arguments.length) return styleMenu;
		styleMenu = p;
		return options;
	};

	options.datatypeFilterEnabled = function (p) {
		if (!arguments.length) return datatypeFilterEnabled;
		datatypeFilterEnabled = p;
		return options;
	};

	options.objectPropertyFilterEnabled = function (p) {
		if (!arguments.length) return objectPropertyFilterEnabled;
		objectPropertyFilterEnabled = p;
		return options;
	};

	options.forceFullLabels = function (p) {
		if (!arguments.length) return forceFullLabels;
		forceFullLabels = p;
		return options;
	};

	options.labelMaxTextLineLength = function (p) {
		if (!arguments.length) return labelMaxTextLineLength;
		labelMaxTextLineLength = p;
		return options;
	};

	options.cardinalityVisible = function (p) {
		if (!arguments.length) return cardinalityVisible;
		cardinalityVisible = p;
		return options;
	};

	options.cardinalityPlacement = function (p) {
		if (!arguments.length) return cardinalityPlacement;
		cardinalityPlacement = p;
		return options;
	};

	options.rewriteFrom = function (otherOptions) {
		rewriteFrom(otherOptions, options);
	};

	options.hideTextInsideBoxes = function (p) {
		if (!arguments.length) return hideTextInsideBoxes;
		hideTextInsideBoxes = p;
		return options;
	};

	options.umlBoxMinHeight = function (p) {
		if (!arguments.length) return umlBoxMinHeight;
		umlBoxMinHeight = p;
		return options;
	};

	options.umlBoxMinWidth = function (p) {
		if (!arguments.length) return umlBoxMinWidth;
		umlBoxMinWidth = p;
		return options;
	};

	options.defaultGraphStyle = function (p) {
		if (!arguments.length) return defaultGraphStyle;
		defaultGraphStyle = p;
		return options;
	};

	options.centerOnLoad = function (p) {
		if (!arguments.length) return centerOnLoad;
		centerOnLoad = p;
		return options;
	};

	options.centerOnFoundElement = function (p) {
		if (!arguments.length) return centerOnFoundElement;
		centerOnFoundElement = p;
		return options;
	};

	function rewriteFrom(srcOptions, destOptions) {
		var srcKeys = Object.keys(srcOptions);
		var i;
		var optionKey;

		for(i = 0; i < srcKeys.length; i++) {
			optionKey = srcKeys[i];

			if(typeof destOptions[optionKey] === 'function') {
				destOptions[optionKey](srcOptions[optionKey]);
			}
		}
	}

	return options;
};
