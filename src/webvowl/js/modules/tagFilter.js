var _ = require("lodash");
var filterTools = require("../util/filterTools")();

module.exports = function () {

    var filter = {},
        nodes,
        properties,
        enabled = true,
        filteredNodes,
        filteredProperties,
        tags = [],
        tagsUnselected = [],
        allTags = [];

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
        var filteredData = filterTools.filterNodesAndTidy(nodes, properties, hasNoTag);

        nodes = filteredData.nodes;
        properties = filteredData.properties;
    }

    function hasNoTag(node) {
        var nodeTags = node.tags();
        // if tags is an array and nodeTags is empty return true.
        // if tags is an object that means we need to hide this element.
        if(_.isEmpty(nodeTags)) return _.isArray(tags) || _.isEmpty(tags);

        nodeTags = _.invokeMap(nodeTags, String.prototype.toLowerCase);

        // for tags an array
        if (_.isArray(tags)) {
          return !_.isEmpty(_.difference(nodeTags, tags));
        }

        // if tags is empty object show nodes without tags
        if (_.isEmpty(tags)) {
          return false;
        }

        // if tags are an object
        var shouldBeShown = true;
        _.forEach(tags, function(value, name) {
          shouldBeShown = shouldBeShown && (_.isEmpty(value) || _.difference(nodeTags, value).length < nodeTags.length);
        });

        return shouldBeShown;
    }

    function createTagsFromLogic() {
      // console.log('allTags', allTags, 'tagsUnselected', tagsUnselected, 'tags', tags);
      // Logic to implement and test:
      // 1. When all checkboxes are selected - display all elements
      // 2. Checked checkboxes from the same dimension treat like logical OR
      // 3. Checked checkboxes from the other dimensions treat like logical AND
      // 4. When none is selected display only elements with no tags
      if(_.isEmpty(tagsUnselected) || allTags.length < 1) {
        // if there is one or none dimensions, or all tags are selected
        tags = tagsUnselected;
      } else {
        // if we have dimensions we need to know which value comes from which dimension
        var tmpTags = {};
        allTags.forEach(function(dimension) {
          dimension.values.forEach(function(value) {
            value = String.prototype.toLowerCase.apply(value);
            if (tagsUnselected.indexOf(value) === -1) {
              if (!tmpTags[dimension.name]) {
                tmpTags[dimension.name] = [];
              }
              // push only checked filters
              tmpTags[dimension.name].push(value);
            }
          });
        });
        tags = tmpTags;
      }
    }

    filter.allTags = function(p) {
      if (!arguments.length) return allTags;
      allTags = p;
      return filter;
    };

    filter.enabled = function (p) {
        if (!arguments.length) return enabled;
        enabled = p;
        return filter;
    };

    filter.uncheck = function(tag) {
        if(!tag) return;

        tag = String.prototype.toLowerCase.apply(tag);

        if(_.indexOf(tagsUnselected, tag) === -1) {
            tagsUnselected.push(tag);
        }
        createTagsFromLogic();
    };

    filter.check = function (tagToRemove) {
        if(!tagToRemove) return;

        tagToRemove = String.prototype.toLowerCase.apply(tagToRemove);

        _.remove(tagsUnselected, function (tag) {
            return tag === tagToRemove;
        });
        createTagsFromLogic();
    };

    filter.clear = function () {
      tags = [];
      tagsUnselected = [];
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
