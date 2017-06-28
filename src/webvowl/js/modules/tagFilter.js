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
        var filteredData = filterTools.filterNodesAndTidy(nodes, properties, hasNoTag, true);

        nodes = filteredData.nodes;
        properties = filteredData.properties;
    }

    function getDimansionValuesAndLabels(dimensionValues) {
      // get values and labels from dimension values.
      var values = [], labels = {};
      if (_.isObject(dimensionValues[0])) {
        dimensionValues.forEach(function(value) {
          values.push(value.key);
          labels[value.key] = value.value;
        });
      } else {
        values = dimensionValues;
        dimensionValues.forEach(function(value) {
          labels[value] = value;
        });
      }

      return { labels: labels, values: values };
    }

    function hasNoTag(node) {
        var nodeTags = node.tags();
        // nodes with no tags are always visible.
        if(_.isEmpty(nodeTags)) return true;

        // for tags an array
        if (_.isArray(tags)) {
          return !_.isEmpty(_.difference(nodeTags, tags));
        }

        // if tags is empty object all node with tags should be hidden.
        if (_.isEmpty(tags)) {
          return false;
        }

        // if tags are not empty object
        var shouldBeShown = true;
        allTags.forEach(function(dimension) {
          var obj = getDimansionValuesAndLabels(dimension.values);
          var values = obj.values;
          // if for some dimension is no selected option ...
          if (_.isUndefined(tags[dimension.name])) {
            // ... and there is no "common" values then make is visible.
            shouldBeShown = _.intersection(nodeTags, values).length === 0;
          } else if (shouldBeShown) {
            // if where no change to false before it, make sure is this element fit to checked filters.
            // create diff from current selected in this dimension and nodeTags. If the difference is smaller than nodeTags that means that something's selected.
            var diff = _.difference(nodeTags, tags[dimension.name]);
            // create intersection with dimension values and nodeTags. If it's empty that means there is no nodeTags for this dimension.
            var intersection = _.intersection(nodeTags, values);
            shouldBeShown = _.isEmpty(intersection) || diff.length < nodeTags.length;
          }
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
      // 5. If node has no tag for the dimension then it cannot be hide by unselect all checkboxes in the dimension.
      if(_.isEmpty(tagsUnselected) || allTags.length < 1) {
        // if there is one or none dimensions, or all tags are selected
        tags = tagsUnselected;
      } else {
        // if we have dimensions we need to know which value comes from which dimension
        var tmpTags = {};
        allTags.forEach(function(dimension) {
          dimension.values.forEach(function(value) {
            if (_.isObject(value)) {
              value = value.key;
            }
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
      var uncheck;
      if(!tag) {
        return;
      } else if (_.isObject(tag)) {
        uncheck = tag.key;
      } else {
        uncheck = tag;
      }

      if(_.indexOf(tagsUnselected, uncheck) === -1) {
          tagsUnselected.push(uncheck);
      }
      createTagsFromLogic();
    };

    filter.check = function (tagToRemove) {
      var check;
      if(!tagToRemove) {
        return;
      } else if (_.isObject(tagToRemove)) {
        check = tagToRemove.key;
      } else {
        check = tagToRemove;
      }

      _.remove(tagsUnselected, function (tag) {
          return tag === check;
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
