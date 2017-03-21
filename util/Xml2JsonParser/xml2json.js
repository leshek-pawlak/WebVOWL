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
function getRelationClassess(classes) {
  var relationClasses = [];
  if (classes.length) {
    for (var i = 0; i < classes.length; i++) {
      relationClasses.push(classes[i]._uri);
    }
  } else if (typeof classes === 'object') {
    relationClasses.push(classes._uri);
  }

  return relationClasses;
}

function parseJson(json) {
  var classes = json.owl_Ontology['skos_member-List'].owl_class;
  var datatypeProperties = json.owl_Ontology['skos_member-List'].owl_DatatypeProperty;
  var objectProperties = json.owl_Ontology['skos_member-List'].owl_ObjectProperty;
  var result = {
    _comment: json.owl_Ontology.rdfs_comment + ', ' + json.owl_Ontology._uri,
    namespace: [
      // '?',
    ],
    header: {
      languages: [
        'undefined',
      ],
      iri: json.owl_Ontology._uri,
      title: {
        undefined: json.owl_Ontology.rdfs_label,
      },
      version: json.owl_Ontology._hash,
      author: [
        // '?',
      ],
      description: {
        // undefined: '?'
      }
    },
    metrics: {
      classCount: classes.length,
      datatypeCount: 0,
      objectPropertyCount: objectProperties.length,
      datatypePropertyCount: datatypeProperties.length,
      propertyCount: 0,
      nodeCount: 0,
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

  // add classes to result json.
  for (var i = 0; i < classes.length; i++) {
    result.class.push({
      id: 'class' + classes[i]._hash,
      // type: '?',
    });

    var classAttribute = {
      id: 'class' + classes[i]._hash,
      label: {
        undefined: classes[i].skos_prefLabel || classes[i].rdfs_label,
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
    // add variables only when it's defined in xml file.
    if (classes[i].rdfs_subClassOf) {
      classAttribute.subClasses = getRelationClassess(classes[i].rdfs_subClassOf);
    }
    if (classes[i].rdfs_superClassOf) {
      classAttribute.superClasses = getRelationClassess(classes[i].rdfs_superClassOf);
    }
    if (classes[i].instance && classes[i].instance_prefLabel) {
      classAttribute.instances = classes[i].instance.length;
      var individuals = [];
      for (var k = 0; k < classes[i].instance.length; ++k) {
        individuals.push({
          iri: classes[i].instance[k]._uri,
          labels: {
            undefined: classes[i].instance_prefLabel[k],
          },
          // annotations: {
          //   label: [
          //     {
          //       identifier: 'label',
          //       language: 'undefined',
          //       value: classes[i].instance_prefLabel[k],
          //       type: 'label'
          //     }
          //   ]
          // }
        });
      }
      classAttribute.individuals = individuals;
    }
    result.classAttribute.push(classAttribute);
  }

  // add datatype properties to result json.
  for (var i = 0; i < datatypeProperties.length; i++) {
    result.datatypeAttribute.push({
      id: 'datatype' + datatypeProperties[i]._hash,
      label: {
        undefined: datatypeProperties[i].skos_prefLabel,
      },
      iri: datatypeProperties[i]._uri,
      // x: 0,
      // y: 0,
    });
  }

  // add object properties to result json.
  for (var i = 0; i < objectProperties.length; i++) {
    var propertyAttribute = {
        id: 'property' + objectProperties[i]._hash,
        label: {
          undefined: objectProperties[i].skos_prefLabel,
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
    if (objectProperties[i].rdfs_domain) {
      propertyAttribute.domain = objectProperties[i].rdfs_domain._uri;
    }
    if (objectProperties[i].rdfs_range) {
      propertyAttribute.range = objectProperties[i].rdfs_range._uri;
    }
    propertyAttribute.addPropertyIfExists('cardinality', objectProperties[i]);
    propertyAttribute.addPropertyIfExists('maxCardinality', objectProperties[i]);
    propertyAttribute.addPropertyIfExists('minCardinality', objectProperties[i]);
    result.propertyAttribute.push(propertyAttribute);
  }

  return JSON.stringify(result);
}
