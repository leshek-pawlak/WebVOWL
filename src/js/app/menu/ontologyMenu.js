/**
 * Contains the logic for the ontology listing and conversion.
 *
 * @returns {{}}
 */
webvowlApp.ontologyMenu = function (loadOntologyFromText) {

	var ontologyMenu = {},
		jsonBasePath = "js/data/",
		defaultJsonName = "foaf", // This file is loaded by default
	// Selections for the app
		loadingError = d3.select("#loading-error"),
		loadingProgress = d3.select("#loading-progress"),
		ontologyMenuTimeout;

	ontologyMenu.setup = function () {
		setupUriListener();

		setupConverterButton();
		setupUploadButton();
	};


	function setupUriListener() {
		// parse the url initially
		parseUrlAndLoadOntology();

		// reload ontology when hash parameter gets changed manually
		d3.select(window).on("hashchange", function () {
			var oldURL = d3.event.oldURL, newURL = d3.event.newURL;

			if (oldURL !== newURL) {
				// don't reload when just the hash parameter gets appended
				if (newURL === oldURL + "#") {
					return;
				}

				updateNavigationHrefs();
				parseUrlAndLoadOntology();
			}
		});

		updateNavigationHrefs();
	}

	/**
	 * Quick fix: update all anchor tags that are used as buttons because a click on them
	 * changes the url and this will load an other ontology.
	 */
	function updateNavigationHrefs() {
		d3.selectAll("#optionsMenu > li > a").attr("href", location.hash || "#");
	}

	function parseUrlAndLoadOntology() {
		// slice the "#" character
		var hashParameter = location.hash.slice(1);

		if (!hashParameter) {
			hashParameter = defaultJsonName;
		}

		var ontologyOptions = d3.selectAll(".select li").classed("selected-ontology", false);

		// IRI parameter
		var iriKey = "iri=";
		if (location.hash === "#file") {
			displayLoadingStatus(false, "No file was uploaded");
		} else if (hashParameter.substr(0, iriKey.length) === iriKey) {
			var iri = hashParameter.slice(iriKey.length);
			loadOntologyFromUri("converter.php?iri=" + encodeURIComponent(iri));

			d3.select("#converter-option").classed("selected-ontology", true);
		} else {
			// id of an existing ontology as parameter
			loadOntologyFromUri(jsonBasePath + hashParameter + ".json");

			ontologyOptions.each(function () {
				var ontologyOption = d3.select(this);
				if (ontologyOption.select("a").size() > 0) {

					if (ontologyOption.select("a").attr("href") === "#" + hashParameter) {
						ontologyOption.classed("selected-ontology", true);
					}
				}
			});
		}
	}

	function loadOntologyFromUri(relativePath) {
		displayLoadingInformations();
		d3.xhr(relativePath, 'application/json', function (error, request) {
			var loadingFailed = !!error;

			displayLoadingStatus(!loadingFailed, error ? error.response : undefined);
			hideLoadingInformations();

			var jsonText;
			if (!loadingFailed) {
				jsonText = request.responseText;
			}

			var filename = relativePath.slice(relativePath.lastIndexOf("/") + 1);
			loadOntologyFromText(jsonText, filename);
		});
	}

	function setupConverterButton() {
		d3.select("#iri-converter-input").on("input", function() {
			keepOntologySelectionOpenShortly();
		}).on("click", function() {
			keepOntologySelectionOpenShortly();
		});

		d3.select("#iri-converter-form").on("submit", function () {
			location.hash = "iri=" + d3.select("#iri-converter-input").property("value");

			// abort the form submission because we set the hash parameter manually to prevent the ? attached in chrome
			d3.event.preventDefault();
			return false;
		});
	}

	function setupUploadButton() {
		var input = d3.select("#file-converter-input"),
			inputLabel = d3.select("#file-converter-label"),
			uploadButton = d3.select("#file-converter-button");

		input.on("change", function () {
			var selectedFiles = input.property("files");
			if (selectedFiles.length <= 0) {
				inputLabel.text("Please select a file");
				uploadButton.property("disabled", true);
			} else {
				inputLabel.text(selectedFiles[0].name);
				uploadButton.property("disabled", false);

				keepOntologySelectionOpenShortly();
			}
		});

		uploadButton.on("click", function () {
			var selectedFile = input.property("files")[0];
			if (!selectedFile) {
				return false;
			}

			displayLoadingInformations();
			uploadButton.property("disabled", true);
			location.hash = "file";

			var formData = new FormData();
			formData.append("ontology", selectedFile);

			var xhr = new XMLHttpRequest();
			xhr.open("POST", "converter.php", true);

			xhr.onload = function () {
				uploadButton.property("disabled", false);

				if (xhr.status === 200) {
					loadOntologyFromText(xhr.responseText, selectedFile.name)
				} else {
					displayLoadingStatus(false, xhr.responseText);
				}
				hideLoadingInformations();
			};

			xhr.send(formData);
		});
	}

	function keepOntologySelectionOpenShortly() {
		// Events in the menu should not be considered
		var ontologySelection = d3.select("#select .toolTipMenu");
		ontologySelection.on("click", function() {
			d3.event.stopPropagation();
		}).on("keydown", function() {
			d3.event.stopPropagation();
		});

		ontologySelection.style("display", "block");

		function disableKeepingOpen() {
			ontologySelection.style("display", undefined);

			clearTimeout(ontologyMenuTimeout);
			d3.select(window).on("click", undefined).on("keydown", undefined);
			ontologySelection.on("mouseover", undefined);
		}

		// Clear the timeout to handle fast calls of this function
		clearTimeout(ontologyMenuTimeout);
		ontologyMenuTimeout = setTimeout(function () {
			disableKeepingOpen();
		}, 3000);

		// Disable forced open selection on interaction
		d3.select(window).on("click", function () {
			disableKeepingOpen();
		}).on("keydown", function () {
			disableKeepingOpen();
		});

		ontologySelection.on("mouseover", function () {
			disableKeepingOpen();
		});
	}


	function displayLoadingInformations() {
		loadingError.classed("hidden", true);
		loadingProgress.classed("hidden", false);
	}

	function displayLoadingStatus(success, message) {
		if (!success) {
			d3.select("#error-container").style("display", "none");
			d3.select("#button-error").on("click", function () {
				toggleErrorMessage();
			});
			d3.select("#custom-error-message").text(message || "");
		}
		loadingError.classed("hidden", success);
	}

	function toggleErrorMessage() {
		var selection = d3.select("#error-container");
		console.log(selection.style("display"));

		if (selection.style("display") == "block") {
			selection.style("display", "none");
		}
		else {
			selection.style("display", "block");
		}
		console.log(selection.style("display"));
	}

	function hideLoadingInformations() {
		loadingProgress.classed("hidden", true);
	}

	return ontologyMenu;
};