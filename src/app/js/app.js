module.exports = function () {
	// remove undefined values from array
  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] === deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

	var app = {},
		N3 = require('n3'),
		graph = webvowl.graph(),
		options = graph.graphOptions(),
		languageTools = webvowl.util.languageTools(),
		GRAPH_SELECTOR = "#graph",
	// Modules for the webvowl app
		exportMenu = require("./menu/exportMenu")(graph),
		filterMenu = require("./menu/filterMenu")(graph),
		gravityMenu = require("./menu/gravityMenu")(graph),
		modeMenu = require("./menu/modeMenu")(graph),
		ontologyMenu = require("./menu/ontologyMenu")(graph),
		pauseMenu = require("./menu/pauseMenu")(graph),
		styleMenu = require("./menu/styleMenu")(graph),
		resetMenu = require("./menu/resetMenu")(graph),
		searchMenu = require("./menu/searchMenu")(graph),
		navigationMenu = require("./menu/navigationMenu")(graph),
		sidebar = require("./sidebar")(graph),
	// Graph modules
		colorExternalsSwitch,
		compactNotationSwitch,
		datatypeFilter,
		disjointFilter,
		emptyLiteralFilter,
		focuser,
		nodeDegreeFilter,
		nodeScalingSwitch,
		objectPropertyFilter,
		pickAndPin,
		selectionDetailDisplayer,
		statistics,
		subclassFilter,
		progress,
		tagFilter,
		setOperatorFilter;

	// it let us append every html string
	d3.selection.prototype.appendHTML = function(HTMLString) {
			return this.select(function() {
					return this.appendChild(document.importNode(new DOMParser().parseFromString(HTMLString, 'text/html').body.childNodes[0], true));
			});
	};

	function overrideOptions(overridingOptions) {
		options.rewriteFrom(overridingOptions);
	};

	function getValue(uri, prefixes) {
    if (!uri) { return null; }
    var util = N3.Util;
    var result = uri;
    if (util.isLiteral(uri)) {
      result = util.getLiteralValue(uri);
			var tryParse = parseFloat(result, 10);
			if (!isNaN(tryParse)) {
				result = tryParse;
			} else if (result === 'true') {
				result = true;
			} else if (result === 'false') {
				result = false;
			}
    } else if (prefixes) {
      Object.keys(prefixes).map(function(prefixKey) {
        var iriToReplace = prefixes[prefixKey];
        var index = uri.indexOf(iriToReplace);
        if (index > -1) {
					// remove prefixes from the values
          result = uri.replace(iriToReplace, '');
        }
      });
    }

    return result;
  }

	function getOptionsFromTtl(ttl, dictionaryTtl) {
		var parser = N3.Parser(),
		parsed = parser.parse(ttl),
		store = N3.Store(parsed, {prefixes: parser._prefixes}),
		dictionaryParser = N3.Parser(),
		dictionaryParsed = dictionaryParser.parse(dictionaryTtl),
		dictionaryStore = N3.Store(dictionaryParsed, {prefixes: dictionaryParser._prefixes}),
		result = {};
		// console.log('dictionaryStore.getObjects(): ', dictionaryStore.getObjects(), 'dictionaryStore.getPredicates(): ', dictionaryStore.getPredicates(), 'dictionaryStore.getSubjects(): ', dictionaryStore.getSubjects());
	  // console.log('store.getObjects(): ', store.getObjects(), 'store.getPredicates(): ', store.getPredicates(), 'store.getSubjects(): ', store.getSubjects());

		// get subject for options.
		var optionSubject = store.getSubjects('rdf:type', 'webvowl:OptionSet').clean()[0];
		// get all predicates for options.
		var labels = store.getPredicates(optionSubject).clean();
    for (var i = 0; i < labels.length; i++) {
			// change predicate into human-readable object key name.
			var key = getValue(labels[i], store._prefixes);
			// get valid value from object for specified subject and predicate.
      var value = getValue(store.getObjects(optionSubject, labels[i]).clean()[0]);
			if (typeof value === 'string' && value.indexOf('http') > -1) {
				// if the value is an url that means we need to get value from a webvowl.ttl file.
				value = getValue(dictionaryStore.getObjects(value, 'webvowl:typeLabel').clean()[0], dictionaryStore._prefixes);
			}
			// if the value is not null
			if (value) {
				result[key] = value;
			}
    }

		return result;
	}

	app.loadOptionsFile = function() {
    var pathToWebvowlTtl = location.origin + location.pathname + 'webvowl.ttl';
    d3.xhr(pathToWebvowlTtl, 'application/ttl', function (error, request) {
      if (!error) {
				var dictionaryTtl = request.responseText;
				var pathToOptionsTtl = location.origin + location.pathname + 'options.ttl';
				d3.xhr(pathToOptionsTtl, 'application/ttl', function (error, request) {
					if (!error) {
						var options = getOptionsFromTtl(request.responseText, dictionaryTtl);
						overrideOptions(options);
					} else {
		        console.error(error);
		      }
					// start application
					app.initialize();
				});
      } else {
        console.error(error);
      }
    });
	}

	app.initialize = function () {

		initializeModules();

		options.graphContainerSelector(GRAPH_SELECTOR);
		options.selectionModules().push(focuser);
		options.selectionModules().push(selectionDetailDisplayer);
		options.selectionModules().push(pickAndPin);
		options.filterModules().push(emptyLiteralFilter);
		options.filterModules().push(statistics);
		options.filterModules().push(datatypeFilter);
		options.filterModules().push(objectPropertyFilter);
		options.filterModules().push(subclassFilter);
		options.filterModules().push(disjointFilter);
		options.filterModules().push(setOperatorFilter);
		options.filterModules().push(nodeScalingSwitch);
		options.filterModules().push(nodeDegreeFilter);
		options.filterModules().push(compactNotationSwitch);
		options.filterModules().push(colorExternalsSwitch);
		options.filterModules().push(tagFilter);
		options.pickAndPinModule(pickAndPin);

		d3.select(window).on("resize", adjustSize);

		exportMenu.setup();
		gravityMenu.setup();
		filterMenu.setup(datatypeFilter, objectPropertyFilter, subclassFilter, disjointFilter, setOperatorFilter, nodeDegreeFilter);
		modeMenu.setup(pickAndPin, nodeScalingSwitch, compactNotationSwitch, colorExternalsSwitch);
		pauseMenu.setup();
		styleMenu.setup();
		sidebar.setup(tagFilter);
		ontologyMenu.setup(loadOntologyFromText);
		resetMenu.setup([gravityMenu, filterMenu, modeMenu, focuser, selectionDetailDisplayer, pauseMenu, styleMenu]);
		searchMenu.setup();
		navigationMenu.setup();

		// give the options the pointer to the some menus for import and export
		options.literalFilter(emptyLiteralFilter);
		options.filterMenu(filterMenu);
		options.modeMenu(modeMenu);
		options.gravityMenu(gravityMenu);
		options.pausedMenu(pauseMenu);
		options.pickAndPinModule(pickAndPin);
		options.resetMenu(resetMenu);
		options.searchMenu(searchMenu);
		options.ontologyMenu(ontologyMenu);
		options.navigationMenu(navigationMenu);
		options.styleMenu(styleMenu);
		options.sidebar(sidebar);
		graph.start();
		adjustSize();
	};

	function initializeModules() {
		colorExternalsSwitch = webvowl.modules.colorExternalsSwitch(graph);
		compactNotationSwitch = webvowl.modules.compactNotationSwitch(graph);
		datatypeFilter = webvowl.modules.datatypeFilter(options);
		disjointFilter = webvowl.modules.disjointFilter();
		emptyLiteralFilter = webvowl.modules.emptyLiteralFilter();
		focuser = webvowl.modules.focuser();
		nodeDegreeFilter = webvowl.modules.nodeDegreeFilter(filterMenu, graph);
		nodeScalingSwitch = webvowl.modules.nodeScalingSwitch(graph);
		objectPropertyFilter = webvowl.modules.objectPropertyFilter(options);
		pickAndPin = webvowl.modules.pickAndPin();
		progress = document.getElementById("myProgress");
		selectionDetailDisplayer = webvowl.modules.selectionDetailsDisplayer(sidebar.updateSelectionInformation);
		statistics = webvowl.modules.statistics();
		subclassFilter = webvowl.modules.subclassFilter();
		tagFilter = webvowl.modules.tagFilter();
		setOperatorFilter = webvowl.modules.setOperatorFilter();
	}

	function loadOntologyFromText(jsonText, filename, alternativeFilename) {
		pauseMenu.reset();

		if (jsonText===undefined && filename===undefined){
			console.log("Nothing to load");
			return;
		}

		var data;
		if (jsonText) {
			// validate JSON FILE
			var validJSON;
			try {
				data =JSON.parse(jsonText);
				validJSON=true;
			} catch (e){
				validJSON=false;
			}
			if (validJSON===false){
				// the server output is not a valid json file
				console.log("Retrieved data is not valid! (JSON.parse Error)");
				ontologyMenu.emptyGraphError();
				return;
			}

			if (!filename) {
				// First look if an ontology title exists, otherwise take the alternative filename
				var ontologyNames = data.header ? data.header.title : undefined;
				var ontologyName = languageTools.textInLanguage(ontologyNames);

				if (ontologyName) {
					// add version to the filename
					ontologyName += ' - ' + data.header.version;
					filename = ontologyName;
				} else {
					filename = alternativeFilename;
				}
			}
		}

		//@WORKAROUND
		// check if data has classes and properties;
		var classCount = 0, objectPropertyCount = 0, datatypePropertyCount = 0;
		if (data.metrics) {
			classCount				  = parseInt(data.metrics.classCount);
			objectPropertyCount		  = parseInt(data.metrics.objectPropertyCount);
			datatypePropertyCount	  = parseInt(data.metrics.datatypePropertyCount);
		}

		if (classCount === 0 && objectPropertyCount===0 && datatypePropertyCount===0 ){
			// generate message for the user;
			ontologyMenu.emptyGraphError();
		}

		exportMenu.setJsonText(jsonText);
		options.data(data);
		graph.load();

		sidebar.updateOntologyInformation(data, statistics);
		exportMenu.setFilename(filename);
	}

	function adjustSize() {
		var graphContainer = d3.select(GRAPH_SELECTOR),
			svg = graphContainer.select("svg"),
			height = window.innerHeight - 40,
			width = window.innerWidth - (window.innerWidth * 0.22);

		graphContainer.style("height", height + "px");
		svg.attr("width", width)
			.attr("height", height);

		options.width(width)
			.height(height);
		graph.updateStyle();
		navigationMenu.updateVisibilityStatus();
	}
	return app;
};
