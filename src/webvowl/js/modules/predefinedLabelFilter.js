var _ = require("lodash/array");
var filterTools = require("../util/filterTools")();

module.exports = function () {

    var filter = {},
        nodes,
        properties,
        enabled = false,
        filteredNodes,
        filteredProperties,
        predefinedLabels = [];


    /**
     * If enabled, all elements which have one of the predefined label are filtered.
     * @param untouchedNodes
     * @param untouchedProperties
     */
    filter.filter = function (untouchedNodes, untouchedProperties) {
        nodes = untouchedNodes;
        properties = untouchedProperties;

        if (this.enabled()) {
            removeWithPredefinedLabels();
        }

        filteredNodes = nodes;
        filteredProperties = properties;
    };

    function removeWithPredefinedLabels() {
        var filteredData = filterTools.filterNodesAndTidy(nodes, properties, hasNoPredefinedLabel);

        nodes = filteredData.nodes;
        properties = filteredData.properties;
    }

    function hasNoPredefinedLabel(node) {
        var nodeLabel = node.labelForCurrentLanguage();

        if(!nodeLabel) return false;

        nodeLabel = String.prototype.toLowerCase.apply(nodeLabel);

        return predefinedLabels.filter(function (label) {
                return label ===  nodeLabel;
        })
        .length === 0;

    }

    filter.enabled = function (p) {
        if (!arguments.length) return enabled;
        enabled = p;
        return filter;
    };

    filter.addLabel = function(label) {
        if(!label) return;

        var label = String.prototype.toLowerCase.apply(label);

        if(_.indexOf(predefinedLabels, label) === -1) {
            predefinedLabels.push(label);
        }

    };

    filter.removeLabel = function (label) {
        if(!label) return;

        var label = String.prototype.toLowerCase.apply(label);

        _.remove(predefinedLabels, function (predefinedLabel) {
            return predefinedLabel ===  label;
        });
    };

    filter.reset = function () {
      predefinedLabels = [];
    };
    // Functions a filter must have
    filter.filteredNodes = function () {
        return filteredNodes;
    };

    filter.filteredProperties = function () {
        return filteredProperties;
    };


    return filter;
};
