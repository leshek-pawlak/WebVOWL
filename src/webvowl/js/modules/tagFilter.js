var _ = require("lodash");
var filterTools = require("../util/filterTools")();

module.exports = function () {

    var filter = {},
        nodes,
        properties,
        enabled = true,
        filteredNodes,
        filteredProperties,
        tags = [];


    /**
     * If enabled, all elements which have one of the predefined label are filtered.
     * @param untouchedNodes
     * @param untouchedProperties
     */
    filter.filter = function (untouchedNodes, untouchedProperties) {
        nodes = untouchedNodes;
        properties = untouchedProperties;

        if (this.enabled()) {
            removeTags();
        }

        filteredNodes = nodes;
        filteredProperties = properties;
    };

    function removeTags() {
        var filteredData = filterTools.filterNodesAndTidy(nodes, properties, hasTag);

        nodes = filteredData.nodes;
        properties = filteredData.properties;
    }

    function hasTag(node) {
        var nodeTags = node.tags();

        if(_.isEmpty(nodeTags)) return false;

        nodeTags = _.invokeMap(nodeTags, String.prototype.toLowerCase);

        return !_.isEmpty(_.intersection(tags, nodeTags));

    }

    filter.enabled = function (p) {
        if (!arguments.length) return enabled;
        enabled = p;
        return filter;
    };

    filter.addTag = function(tag) {
        if(!tag) return;

        var tag = String.prototype.toLowerCase.apply(tag);

        if(_.indexOf(tags, tag) === -1) {
            tags.push(tag);
        }

    };

    filter.removeTag = function (tagToRemove) {
        if(!tagToRemove) return;

        var tagToRemove = String.prototype.toLowerCase.apply(tagToRemove);

        _.remove(tags, function (tag) {
            return tag ===  tagToRemove;
        });
    };

    filter.clear = function () {
      tags = [];
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
