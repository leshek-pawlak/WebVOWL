/**
 * Contains the logic for connecting the segments filters with the website.
 *
 * @param graph required for calling a refresh after a filter change
 * @returns {{}}
 */
module.exports = function (graph) {

    var segmentsMenu = {},
        allSegmentsCheckbox = [],
        filter,
        allSegmentsFilteringOptionId = "#allSegmentsFilteringOption",
        allOptionsWithoutAllSegments = "#segmentsCheckboxes li:not(" + allSegmentsFilteringOptionId + ")";


    /**
     * Connects the website with graph filters.
     * @param tagFilter filter for all tags
     */
    segmentsMenu.setup = function (tagFilter) {
        filter = tagFilter;

        addFilterItem(tagFilter, "allSegments", "All segments", allSegmentsFilteringOptionId);
    };

    function addFilterItem(filter, identifier, pluralNameOfFilteredItems, selector) {
        var filterContainer,
            filterCheckbox;

        filterContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        filterCheckbox = filterContainer.append("input")
            .classed("filterCheckbox", true)
            .attr("id", identifier + "FilterCheckbox")
            .attr("type", "checkbox")
            .property("checked", filter.enabled());

        // Store for easier resetting
        allSegmentsCheckbox = {checkbox: filterCheckbox, defaultState: filter.enabled()};

        filterCheckbox.on("click", function () {
            // There might be no parameters passed because of a manual
            // invocation when resetting the filters
            var isEnabled = filterCheckbox.property("checked");

            d3.selectAll(allOptionsWithoutAllSegments + " input")
                .property("checked", isEnabled)
                .each(function () {
                    d3.select(this).on("click")();
                });

            filter.enabled(isEnabled);
            graph.update();
        });

        filterContainer.append("label")
            .attr("for", identifier + "FilterCheckbox")
            .text(pluralNameOfFilteredItems);
    }

    segmentsMenu.initialize = function (tags) {

        d3.selectAll(allOptionsWithoutAllSegments).remove();
        filter.clear();

        tags.forEach(function (tag) {
            addTagFilterItem(tag);
        });

        this.reset();
    };

    function addTagFilterItem(tag) {
        var filterContainer;
        var filterCheckbox;
        var tagCheckboxId = tag + "FilterTagCheckbox";

        filterContainer = d3.select("#segmentsCheckboxes")
            .append("li")
            .classed("toggleOption", true)
            .append("div")
            .classed("checkboxContainer", true);

        filterCheckbox = filterContainer.append("input")
            .classed("filterCheckbox", true)
            .attr("id", tagCheckboxId)
            .attr("type", "checkbox");

        filterCheckbox.on("click", function () {
            var isEnabled = filterCheckbox.property("checked");
            filter[isEnabled ? "addTag" : "removeTag"](tag);
            graph.update();
        });

        filterContainer.append("label")
            .attr("for", tagCheckboxId)
            .text(tag);
    }

    /**
     * Resets the filter (and also filtered elements) to their default.
     */
    segmentsMenu.reset = function () {

        allSegmentsCheckbox.checkbox
            .property("checked", allSegmentsCheckbox.defaultState)
            .on("click")();

    };


    return segmentsMenu;
};
