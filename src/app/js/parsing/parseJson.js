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

  function getHash(url) {
    if (typeof url === 'object') {
      url = url._value;
    }
    return url.substring(url.indexOf('#') + 1);
  }

  function createStructure() {
    // add classes to result json.
    for (var i = 0; i < classes.length; i++) {
      var classHashKey = findKeyName('hash', classes[i]);
      var classLabelKey = findKeyName('label', classes[i]);
      var id = classHashKey ? classes[i][classHashKey]._value || classes[i][classHashKey] : '';
      var type = 'owl:Class';
      var labelObject = {}, labelFromJson = classLabelKey ? classes[i][classLabelKey] : getHash(classes[i]._uri);
      if (labelFromJson.length > 0) {
        // extract languages from json
        for (var k = 0; k < labelFromJson.length; ++k) {
          var langVal = findKeyName('language', labelFromJson[k]);
          var text = findKeyName('text', labelFromJson[k]);
          labelObject[getHash(labelFromJson[k][langVal]).replace(/Language/g, '')] = labelFromJson[k][text];
        }
      } else {
        labelObject = {
          'IRI-based': labelFromJson,
          undefined: labelFromJson.replace(/([a-z])([A-Z])/g, '$1 $2'),
        };
      }
      // NOTE type can be an attribute of class or 'owl:unionOf', but in xml file there are none exemples of used.
      result.class.push({
        id: id,
        type: type,
      });
      var xKey = findKeyName('coordinateX', classes[i]);
      var yKey = findKeyName('coordinateY', classes[i]);
      var classAttribute = {
        id: id,
        label: labelObject,
        iri: classes[i]._uri._value || classes[i]._uri,
        instances: 0,
        x: classes[i][xKey] || 0,
        y: classes[i][yKey] || 0,
        // backgroundColor: '#d0d0d0',
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
    for (var z = 0; z < datatypeProperties.length; z++) {
      var idDatatype = 'datatype' + datatypeProperties[z]._hash._value;
      var iriDatatypeLabel = datatypeProperties[z].skos_prefLabel || datatypeProperties[z].rdfs_label || datatypeProperties[z]._uri._value.substring(datatypeProperties[z]._uri._value.indexOf('#') + 1);
      result.datatype.push({
        id: idDatatype,
        type: 'rdfs:Datatype',
      });
      result.property.push({
        id: 'property' + datatypeProperties[z]._hash._value,
        type: 'owl:datatypeProperty',
      });
      result.datatypeAttribute.push({
        id: idDatatype,
        label: {
          'IRI-based': iriDatatypeLabel,
        },
        iri: datatypeProperties[z]._uri._value || datatypeProperties[z]._uri,
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
        iri: objectProperties[j]._uri._value || objectProperties[j]._uri,
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

  function findKeyName(key, obj) {
    var result = null;
    key = key.toLowerCase();
    Object.keys(obj).map(function(objKey, index) {
      if (objKey.toLowerCase().indexOf(key) > -1) {
        result = objKey;
      }
    });

    return result;
  }

  function parseJson(json) {
    var firstKeyName = Object.keys(json);
    var root = json[firstKeyName];
    var listKey = findKeyName('list', root);
    var mainKeys = Object.keys(root[listKey]);
    var classKey, datatypeKey, objectKey, headerKey;
    for (var i = 0; i < mainKeys.length; ++i) {
      var toLowerCase = mainKeys[i].toLowerCase();
      if (toLowerCase.indexOf('class') > -1) {
        classKey = mainKeys[i];
      } else if (toLowerCase.indexOf('datatype') > -1) {
        datatypeKey = mainKeys[i];
      } else if (toLowerCase.indexOf('object') > -1) {
        objectKey = mainKeys[i];
      } else if (toLowerCase.indexOf('header') > -1) {
        headerKey = mainKeys[i];
      }
    }
    classes = root[listKey][classKey];
    datatypeProperties = root[listKey][datatypeKey];
    objectProperties = root[listKey][objectKey];
    if (headerKey) {
      // merge root with header if exists
      Object.assign(root, root[listKey][headerKey][0]);
    }
    var headerTitleKey = findKeyName('label', root);
    var versionKey = findKeyName('version', root);
    var headerCommentKey = findKeyName('comment', root);
    var languageKey = findKeyName('language', root);
    var languages = ['undefined'];
    if (languageKey) {
      // extract languages if exists
      if (root[languageKey].length) {
        languages = [];
        for (var j = 0; j < root[languageKey].length; ++j) {
          languages.push(getHash(root[languageKey][j]).replace(/Language/g, ''));
        }
      } else {
        languages = [ root[languageKey] ];
      }
    }
    result = {
      _comment: "Created with OWL2VOWL (version 0.2.0), http://vowl.visualdataweb.org",
      namespace: [
        // '?',
      ],
      header: {
        languages: languages,
        iri: root._uri._value || root._uri,
        title: {
          undefined: headerTitleKey ? root[headerTitleKey]._text || root[headerTitleKey] : 'title' ,
        },
        version: versionKey ? root[versionKey]._value || root[versionKey] : 'version',
        author: [
          'MODS'
        ],
        description: {
          undefined: headerCommentKey ? root[headerCommentKey]._text || root[headerCommentKey] : 'description',
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
      var classHashKey = findKeyName('hash', classes[k]);
      var classHashValue = classHashKey ? classes[k][classHashKey]._value || classes[k][classHashKey] : '';
      var classAttribute = getObjectById(result.classAttribute, 'class' + classHashValue);
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
        for (var x = 0; x < classes[k].instance.length; ++x) {

          var url = classes[k].instance[x]._uri._value;
          var hash = url.substring(url.indexOf('#') + 1);
          var label = classes[k].instance_prefLabel ? classes[k].instance_prefLabel[x] : hash;
          var iriLabel = classes[k].skos_prefLabel || classes[k].rdfs_label || classes[k]._uri._value.substring(classes[k]._uri._value.indexOf('#') + 1);
          // create undefined label from class url hash and IRI-based label
          var undefinedLabel = label.replace(iriLabel, '').replace(/([a-z])([A-Z])/g, '$1 $2');
          individuals.push({
            iri: classes[k].instance[x]._uri._value,
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
    console.log('5. create graphJson and fill it with information from the input json: ', result);
    return JSON.stringify(result);
  }

  return parseJson;
};
