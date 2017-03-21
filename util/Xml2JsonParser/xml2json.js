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

function parseJson(json) {
  var classes = json.owl_Ontology["skos_member-List"].owl_class;
  var datatypeProperties = json.owl_Ontology["skos_member-List"].owl_DatatypeProperty;
  var objectProperties = json.owl_Ontology["skos_member-List"].owl_ObjectProperty;
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
    classAttribute: [
      // {
      //   id: 'class25',
      //   label: {
      //     undefined: 'Country',
      //   },
      //   iri: 'http://someUrlHere#Country',
      //   instances: 0,
      //   subClasses: [
      //     'class21',
      //   ],
      //   superClasses: [
      //     'class11',
      //   ],
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
      //   individuals: [
      //     {
      //       iri: 'http://someUrlHere#AccountableRochePartyPDMA',
      //       labels: {
      //         undefined: 'test label',
      //       },
      //       annotations: {
      //         label: [
      //           {
      //             identifier: 'label',
      //             language: 'undefined',
      //             value: 'PDMA',
      //             type: 'label',
      //           },
      //         ],
      //       },
      //     },
      //   ],
      //   backgroundColor: '#d0d0d0',
      //   x: 568.7106102686425,
      //   y: -286.22831535513427,
      // },
    ],
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
    result.propertyAttribute.push({
      id: 'property' + objectProperties[i]._hash,
      label: {
        undefined: objectProperties[i].skos_prefLabel,
      },
      iri: objectProperties[i]._uri,
      // domain: '?',
      // range: '?',
      // cardinality: 0,
      // minCardinality: 0,
      // maxCardinality: 0,
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
    });
  }

  return JSON.stringify(result);
}
