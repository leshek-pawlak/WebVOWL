// imports
var commandLineArgs = require('command-line-args');
var parser = require('xml2json');
var fs = require('fs');

// global vars
var optionDefinitions = [
  { name: 'pathToXmlfile', type: String },
  { name: 'exportFolder', type: String }
];
var options = commandLineArgs(optionDefinitions);
var exportFolder = options.exportFolder || 'src/app/data';
var pathToXmlfile = options.pathToXmlfile || 'src/app/xml/model-output.xml';
var classes, datatypeProperties, objectProperties, result;

// extend of object

// add property to object when it's not null or undefined
Object.prototype.addPropertyIfExists = function(propertyName, object) {
  if (object[propertyName]) {
    this[propertyName] = object[propertyName];
  }
}

// application
fs.readFile(pathToXmlfile, 'utf8', function (err, data) {
  if (err) {
    return console.error(err);
  }
  // xml to json
  var json = parser.toJson(data, { object: true });
  // parsing JSON
  var parsedJson = parseJson(json);
  // save parsed json to file
  fs.writeFile(exportFolder + '/' + Date.now() + '.json', parsedJson, function(err) {
    if(err) {
        return console.error(err);
    }

    console.log('The file was saved!');
  });
});

// get subClasses and superClassess
function getRelationClassess(classElement, key) {
  var relationClasses = [];
  if (classElement[key].length) {
    for (var i = 0; i < classElement[key].length; i++) {
      managePropertyInRestrictions(classElement[key][i]._uri, classElement.restrictions, relationClasses);
    }
  } else if (typeof classElement[key] === 'object') {
    managePropertyInRestrictions(classElement[key]._uri, classElement.restrictions, relationClasses);
  }

  return relationClasses;
}

function managePropertyInRestrictions(uri, restrictions, relationClasses) {
  if (!restrictions) {
    return
  }
  var restrictionsKeyName = Object.keys(restrictions)[0];
  for (var i = 0; i < restrictions[restrictionsKeyName].length; i++) {
    if (restrictions[restrictionsKeyName][i]._uri === uri) {
      var id = findIdByUri(restrictions[restrictionsKeyName][i].owl_onProperty._uri);
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
    var id = 'class' + classes[i]._hash;
    var type = 'owl:Class';
    var iriLabel = classes[i].skos_prefLabel || classes[i].rdfs_label || classes[i]._uri.substring(classes[i]._uri.indexOf('#')+1);
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
      iri: classes[i]._uri,
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
  for (var i = 0; i < datatypeProperties.length; i++) {
    var id = 'datatype' + datatypeProperties[i]._hash;
    var iriLabel = datatypeProperties[i].skos_prefLabel || datatypeProperties[i].rdfs_label || datatypeProperties[i]._uri.substring(datatypeProperties[i]._uri.indexOf('#')+1);
    result.datatype.push({
      id: id,
      type: 'rdfs:Datatype',
    });
    result.property.push({
      id: 'property' + datatypeProperties[i]._hash,
      type: 'owl:datatypeProperty',
    });
    result.datatypeAttribute.push({
      id: id,
      label: {
        'IRI-based': iriLabel,
      },
      iri: datatypeProperties[i]._uri,
      // x: 0,
      // y: 0,
    });
  }
  // add object properties to result json.
  for (var i = 0; i < objectProperties.length; i++) {
    var id = 'property' + objectProperties[i]._hash;
    var iriLabel = objectProperties[i].skos_prefLabel || objectProperties[i].rdfs_label || objectProperties[i]._uri.substring(objectProperties[i]._uri.indexOf('#')+1);
    result.property.push({
      id: id,
      type: 'owl:objectProperty',
    });
    var propertyAttribute = {
        id: id,
        label: {
          'IRI-based': iriLabel,
          undefined: iriLabel.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); }),
        },
        iri: objectProperties[i]._uri,
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
    propertyAttribute.addPropertyIfExists('cardinality', objectProperties[i]);
    propertyAttribute.addPropertyIfExists('maxCardinality', objectProperties[i]);
    propertyAttribute.addPropertyIfExists('minCardinality', objectProperties[i]);
    result.propertyAttribute.push(propertyAttribute);
  }
}

function findIdByUri(uri) {
  for (var i = 0; i < classes.length; i++) {
    if (classes[i]._uri === uri) {
      return 'class' + classes[i]._hash;
    }
  }
  for (var i = 0; i < datatypeProperties.length; i++) {
    if (datatypeProperties[i]._uri === uri) {
      return 'datatype' + datatypeProperties[i]._hash;
    }
  }
  for (var i = 0; i < objectProperties.length; i++) {
    if (objectProperties[i]._uri === uri) {
      return 'property' + objectProperties[i]._hash;
    }
  }

  return null;
}

function parseJson(json) {
  var firstKeyName = Object.keys(json)[0];
  var mainKeys = Object.keys(json[firstKeyName]['skos_member-List']);
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
  classes = json[firstKeyName]['skos_member-List'][classKey];
  datatypeProperties = json[firstKeyName]['skos_member-List'][datatypeKey];
  objectProperties = json[firstKeyName]['skos_member-List'][objectKey];
  result = {
    _comment: json[firstKeyName].rdfs_comment + ', ' + json[firstKeyName]._uri,
    namespace: [
      // '?',
    ],
    header: {
      languages: [
        'undefined',
      ],
      iri: json[firstKeyName]._uri,
      title: {
        undefined: json[firstKeyName].rdfs_label,
      },
      version: json[firstKeyName]._hash,
      author: [
        // '?',
      ],
      description: {
        // undefined: '?'
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
  for (var i = 0; i < classes.length; i++) {
    var classAttribute = getObjectById(result.classAttribute, 'class' + classes[i]._hash);
    if (!classAttribute) {
      continue;
    }
    // add variables only when it's defined in xml file.
    if (classes[i].rdfs_subClassOf) {
      classAttribute.subClasses = getRelationClassess(classes[i], 'rdfs_subClassOf');
    }
    if (classes[i].rdfs_superClassOf) {
      classAttribute.superClasses = getRelationClassess(classes[i], 'rdfs_superClassOf');
    }
    if (classes[i].instance) {
      result.metrics.individualCount += classes[i].instance.length;
      result.classAttribute.instances = classes[i].instance.length;
      var individuals = [];
      for (var k = 0; k < classes[i].instance.length; ++k) {
        var url = classes[i].instance[k]._uri;
        var hash = url.substring(url.indexOf('#')+1);
        var label = classes[i].instance_prefLabel ? classes[i].instance_prefLabel[k] : hash;
        var iriLabel = classes[i].skos_prefLabel || classes[i].rdfs_label || classes[i]._uri.substring(classes[i]._uri.indexOf('#')+1);
        // create undefined label from class url hash and IRI-based label
        var undefinedLabel = label.replace(iriLabel, '').replace(/([a-z])([A-Z])/g, '$1 $2');
        individuals.push({
          iri: classes[i].instance[k]._uri,
          labels: {
            'IRI-based': label,
          },
          annotations: {
            label: [
              {
                identifier: 'label',
                language: 'undefined',
                value: undefinedLabel,
                type: 'label'
              }
            ]
          }
        });
      }
      classAttribute.individuals = individuals;
    }
  }

  // find and parse property attributes
  for (var i = 0; i < objectProperties.length; i++) {
    var propertyAttribute = getObjectById(result.propertyAttribute, 'property' + objectProperties[i]._hash);
    if (!propertyAttribute) {
      continue;
    }
    if (objectProperties[i].rdfs_domain) {
      propertyAttribute.domain = findIdByUri(objectProperties[i].rdfs_domain._uri);
    }
    if (objectProperties[i].rdfs_range) {
      propertyAttribute.range = findIdByUri(objectProperties[i].rdfs_range._uri);
    }
  }

  return JSON.stringify(result);
}
