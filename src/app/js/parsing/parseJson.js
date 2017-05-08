module.exports = function() {
  // global vars
  var classes, datatypeProperties, objectProperties, result;

  // extend of object
  // add property to object when it's not null or undefined
  Object.prototype.addPropertyIfExists = function(propertyName, object) {
    if (object[propertyName]) {
      this[propertyName] = object[propertyName];
    }
  };

  // get subClasses and superClassess
  function getRelationClassess(classElement, key) {
    var relationClasses = [];
    if (classElement[key].length) {
      for (var i = 0; i < classElement[key].length; i++) {
        managePropertyInRestrictions(classElement[key][i]._uri._value, classElement.restrictions, relationClasses);
      }
    } else if (typeof classElement[key] === 'object') {
      managePropertyInRestrictions(classElement[key]._uri._value, classElement.restrictions, relationClasses);
    }

    return relationClasses;
  }

  function managePropertyInRestrictions(uri, restrictions, relationClasses) {
    if (!restrictions) {
      return;
    }
    var restrictionsKeyName = Object.keys(restrictions)[0];
    for (var i = 0; i < restrictions[restrictionsKeyName].length; i++) {
      if (restrictions[restrictionsKeyName][i]._uri._value === uri) {
        var id = findIdByUri(restrictions[restrictionsKeyName][i].owl_onProperty._uri._value);
        relationClasses.push(id);
        var keys = Object.keys(restrictions[restrictionsKeyName][i]);
        for (var k = 0; k < keys.length; k++) {
          // add to object all properties with "owl_" in the name
          // exclude all keys with "roperty" so property and Property also.
          if (keys[k].indexOf('owl_') > -1 && keys[k].indexOf('roperty') === -1) {
            addToProperty(id, keys[k].replace('owl_', ''), restrictions[restrictionsKeyName][i][keys[k]]);
          }
        }
      }
    }
  }

  function addToProperty(id, property, value) {
    var element = getObjectById(result.propertyAttribute, id);
    if (value && element) {
      element[property] = value;
    }
  }

  function getObjectById(elements, id) {
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].id === id) {
        return elements[i];
      }
    }

    return null;
  }

  function createStructure() {
    // add classes to result json.
    for (var i = 0; i < classes.length; i++) {
      var id = 'class' + classes[i]._hash._value;
      var type = 'owl:Class';
      var iriLabel = classes[i].skos_prefLabel || classes[i].rdfs_label || classes[i]._uri._value.substring(classes[i]._uri._value.indexOf('#') + 1);
      // NOTE type can be an attribute of class or 'owl:unionOf', but in xml file there are none exemples of used.
      result.class.push({
        id: id,
        type: type,
      });
      var classAttribute = {
        id: id,
        label: {
          'IRI-based': iriLabel,
          undefined: iriLabel.replace(/([a-z])([A-Z])/g, '$1 $2'),
        },
        iri: classes[i]._uri._value,
        instances: 0,
        // backgroundColor: '#d0d0d0',
        // x: 0,
        // y: 0,
        //   annotations: {
        //     seeAlso: [
        //       {
        //         identifier: 'seeAlso',
        //         language: 'undefined',
        //         value: 'http://another/url/here?ID=46',
        //         type: 'iri',
        //       },
        //     ],
        //   },
      };
      result.classAttribute.push(classAttribute);
    }
    // add datatype properties to result json.
    for (var k = 0; k < datatypeProperties.length; k++) {
      var idDatatype = 'datatype' + datatypeProperties[k]._hash._value;
      var iriDatatypeLabel = datatypeProperties[k].skos_prefLabel || datatypeProperties[k].rdfs_label || datatypeProperties[k]._uri._value.substring(datatypeProperties[k]._uri._value.indexOf('#') + 1);
      result.datatype.push({
        id: idDatatype,
        type: 'rdfs:Datatype',
      });
      result.property.push({
        id: 'property' + datatypeProperties[k]._hash._value,
        type: 'owl:datatypeProperty',
      });
      result.datatypeAttribute.push({
        id: idDatatype,
        label: {
          'IRI-based': iriDatatypeLabel,
        },
        iri: datatypeProperties[k]._uri._value,
        // x: 0,
        // y: 0,
      });
    }
    // add object properties to result json.
    for (var j = 0; j < objectProperties.length; j++) {
      var idProperty = 'property' + objectProperties[j]._hash._value;
      var iriPropertyLabel = objectProperties[j].skos_prefLabel || objectProperties[j].rdfs_label || objectProperties[j]._uri._value.substring(objectProperties[j]._uri._value.indexOf('#') + 1);
      result.property.push({
        id: idProperty,
        type: 'owl:objectProperty',
      });
      var propertyAttribute = {
        id: idProperty,
        label: {
          'IRI-based': iriPropertyLabel,
          undefined: iriPropertyLabel.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
            return str.toUpperCase();
          }),
        },
        iri: objectProperties[j]._uri._value,
        // annotations: {
        //   definition: [
        //     {
        //       identifier: 'definition',
        //       language: 'undefined',
        //       value: '?',
        //       type: 'label'
        //     }
        //   ],
        //   seeAlso: [
        //     {
        //       identifier: 'seeAlso',
        //       language: 'undefined',
        //       value: '?',
        //       type: 'iri'
        //     },
        //   ]
        // },
      };
      propertyAttribute.addPropertyIfExists('cardinality', objectProperties[j]);
      propertyAttribute.addPropertyIfExists('maxCardinality', objectProperties[j]);
      propertyAttribute.addPropertyIfExists('minCardinality', objectProperties[j]);
      result.propertyAttribute.push(propertyAttribute);
    }
  }

  function findIdByUri(uri) {
    for (var i = 0; i < classes.length; i++) {
      if (classes[i]._uri._value === uri) {
        return 'class' + classes[i]._hash._value;
      }
    }
    for (var k = 0; k < datatypeProperties.length; k++) {
      if (datatypeProperties[k]._uri._value === uri) {
        return 'datatype' + datatypeProperties[k]._hash._value;
      }
    }
    for (var j = 0; j < objectProperties.length; j++) {
      if (objectProperties[j]._uri._value === uri) {
        return 'property' + objectProperties[j]._hash._value;
      }
    }

    return null;
  }

  function parseJson(json) {
    var firstKeyName = Object.keys(json);
    var root = json[firstKeyName];
    var mainKeys = Object.keys(root['skos_member-List']);
    var classKey, datatypeKey, objectKey;
    for (var i = 0; i < mainKeys.length; ++i) {
      var toLowerCase = mainKeys[i].toLowerCase();
      if (toLowerCase.indexOf('class') > -1) {
        classKey = mainKeys[i];
      } else if (toLowerCase.indexOf('datatype') > -1) {
        datatypeKey = mainKeys[i];
      } else if (toLowerCase.indexOf('object') > -1) {
        objectKey = mainKeys[i];
      }
    }
    classes = root['skos_member-List'][classKey];
    datatypeProperties = root['skos_member-List'][datatypeKey];
    objectProperties = root['skos_member-List'][objectKey];
    result = {
      _comment: "Created with OWL2VOWL (version 0.2.0), http://vowl.visualdataweb.org",
      namespace: [
        // '?',
      ],
      header: {
        languages: [
          'undefined',
        ],
        iri: root._uri._value,
        title: {
          undefined: root.rdfs_label._text,
        },
        version: root._hash._value,
        author: [
          'MODS'
        ],
        description: {
          undefined: root.rdfs_comment._text,
        }
      },
      metrics: {
        classCount: classes.length,
        datatypeCount: datatypeProperties.length,
        objectPropertyCount: objectProperties.length,
        datatypePropertyCount: datatypeProperties.length,
        propertyCount: objectProperties.length + datatypeProperties.length,
        nodeCount: classes.length + datatypeProperties.length,
        axiomCount: 0,
        individualCount: 0,
      },
      class: [],
      classAttribute: [],
      datatype: [],
      datatypeAttribute: [],
      property: [],
      propertyAttribute: [],
    };
    // initialize all needed objects
    createStructure();
    // find and parse class attributes
    for (var k = 0; k < classes.length; k++) {
      var classAttribute = getObjectById(result.classAttribute, 'class' + classes[k]._hash._value);
      if (!classAttribute) {
        continue;
      }
      // add variables only when it's defined in xml file.
      if (classes[k].rdfs_subClassOf) {
        classAttribute.subClasses = getRelationClassess(classes[k], 'rdfs_subClassOf');
      }
      if (classes[k].rdfs_superClassOf) {
        classAttribute.superClasses = getRelationClassess(classes[k], 'rdfs_superClassOf');
      }
      if (classes[k].instance) {
        result.metrics.individualCount += classes[k].instance.length;
        result.classAttribute.instances = classes[k].instance.length;
        var individuals = [];
        for (var j = 0; j < classes[k].instance.length; ++j) {

          var url = classes[k].instance[j]._uri._value;
          var hash = url.substring(url.indexOf('#') + 1);
          var label = classes[k].instance_prefLabel ? classes[k].instance_prefLabel[j] : hash;
          var iriLabel = classes[k].skos_prefLabel || classes[k].rdfs_label || classes[k]._uri._value.substring(classes[k]._uri._value.indexOf('#') + 1);
          // create undefined label from class url hash and IRI-based label
          var undefinedLabel = label.replace(iriLabel, '').replace(/([a-z])([A-Z])/g, '$1 $2');
          individuals.push({
            iri: classes[k].instance[j]._uri._value,
            labels: {
              'IRI-based': label,
            },
            annotations: {
              label: [{
                identifier: 'label',
                language: 'undefined',
                value: undefinedLabel,
                type: 'label'
              }]
            }
          });
        }
        classAttribute.individuals = individuals;
      }
    }

    // find and parse property attributes
    for (var l = 0; l < objectProperties.length; l++) {
      var propertyAttribute = getObjectById(result.propertyAttribute, 'property' + objectProperties[l]._hash);
      if (!propertyAttribute) {
        continue;
      }
      if (objectProperties[l].rdfs_domain) {
        propertyAttribute.domain = findIdByUri(objectProperties[l].rdfs_domain._uri);
      }
      if (objectProperties[l].rdfs_range) {
        propertyAttribute.range = findIdByUri(objectProperties[l].rdfs_range._uri);
      }
    }

    return JSON.stringify(result);
  }

  return parseJson;
};
