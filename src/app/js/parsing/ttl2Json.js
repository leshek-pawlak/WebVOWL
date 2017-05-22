module.exports = function() {
  // remove undefined values from array
  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] === deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

  // import
  var N3 = require('n3');

  // export function
  function parseTtl(ttl) {
    return new Promise(function (resolve, reject) {
      d3.xhr('../../data/webvowl.ttl', 'application/ttl', function (error, request) {
        if (!error) {
          resolve(createStructure(ttl, request.responseText));
        } else {
          reject(error);
        }
      });
    });
  }

  function getLabels(iri, languageLabels, store) {
    var labelObject = {};
    var labels = store.getObjects(iri, 'webvowl:label').clean();
    for (var i = 0; i < labels.length; i++) {
      var text = getTextValue(store.getObjects(labels[i], 'webvowl:content').clean()[0]);
      var language = store.getObjects(labels[i], 'webvowl:contentLanguage').clean()[0];
      labelObject[languageLabels[language]] = text;
    }

    return labelObject;
  }

  function getTextForLanguage(iri, languageLabels, store) {
    var textObject = {};
    var text = getTextValue(store.getObjects(iri, 'webvowl:content').clean()[0]);
    var language = store.getObjects(iri, 'webvowl:contentLanguage').clean()[0];
    textObject[languageLabels[language]] = text;

    return textObject;
  }

  function getTextValueFromTtl(subject, predicate, store) {
    return getTextValue(store.getObjects(subject, predicate).clean()[0], store._prefixes);
  }

  function getAnnotations(iri, languageLabels, store, dictionaryStore) {
    var annotations = {};
    var annotationIRI = store.getObjects(iri, 'webvowl:annotation').clean();
    for (var j = 0; j < annotationIRI.length; j++) {
      var annotation = getTextForLanguage(annotationIRI[j], languageLabels, store);
      var lang = Object.keys(annotation)[0];
      var typeIRI = store.getObjects(annotationIRI[j], 'rdf:type').clean()[0];
      var identifier = getTextValue(dictionaryStore.getObjects(typeIRI, 'rdfs:label').clean()[0]);
      annotations[identifier] = [
        {
          identifier: identifier,
          language: lang,
          value: annotation[lang],
          type: 'label',
        }
      ];
    }

    return annotations;
  }

  function createStructure(ttl, dictionaryTtl) {
    var graphJson = {
        _comment: "Created with TTL2JSON",
        metrics: {
          classCount: 0,
          datatypeCount: 0,
          objectPropertyCount: 0,
          datatypePropertyCount: 0,
          propertyCount: 0,
          nodeCount: 0,
          axiomCount: 0,
          individualCount: 0
        },
        namespace: [],
        class: [],
        classAttribute: [],
        datatype: [],
        datatypeAttribute: [],
        property: [],
        propertyAttribute: []
      },
      parser = N3.Parser(),
      parsed = parser.parse(ttl),
      store = N3.Store(parsed, {prefixes: parser._prefixes}),
      dictionaryParser = N3.Parser(),
      dictionaryParsed = dictionaryParser.parse(dictionaryTtl),
      dictionaryStore = N3.Store(dictionaryParsed, {prefixes: dictionaryParser._prefixes});

    // console.log('dictionaryStore.getObjects(): ', dictionaryStore.getObjects(), 'dictionaryStore.getPredicates(): ', dictionaryStore.getPredicates(), 'dictionaryStore.getSubjects(): ', dictionaryStore.getSubjects());
    // console.log('store.getObjects(): ', store.getObjects(), 'store.getPredicates(): ', store.getPredicates(), 'store.getSubjects(): ', store.getSubjects());
    // get language labels
    var languageLabels = {};
    var languagesIri = dictionaryStore.getSubjects('webvowl:languageLabel').clean();
    for (var l = 0; l < languagesIri.length; l++) {
      var label = getTextValue(dictionaryStore.getObjects(languagesIri[l], 'webvowl:languageLabel').clean()[0]);
      languageLabels[languagesIri[l]] = label;
    }
    // add header to json
    var header = store.getSubjects('rdf:type', 'webvowl:Header').clean()[0];
    // get parameters from header
    var version = getTextValue(store.getObjects(header, 'webvowl:version').clean()[0]);
    var author = getTextValue(store.getObjects(header, 'webvowl:author').clean()[0]);
    // get description from header
    var descriptionIRI = getTextValue(store.getObjects(header, 'webvowl:headerDescription').clean()[0]);
    var description = getTextForLanguage(descriptionIRI, languageLabels, store);
    // get title from header
    var titleIRI = getTextValue(store.getObjects(header, 'webvowl:headerTitle').clean()[0]);
    var title = getTextForLanguage(titleIRI, languageLabels, store);
    // add languages to header
    var headerLanguages = store.getObjects(header, 'webvowl:definedLanguage').clean();
    var lang = [];
    for (var z = 0; z < headerLanguages.length; z++) {
      lang.push(languageLabels[headerLanguages[z]]);
    }
    graphJson.header = {
      languages: lang,
      iri: header,
      title: title,
      version: version,
      author: [author],
      description: description,
    };
    // add classes to json
    var classes = store.getSubjects('rdf:type', 'webvowl:Class').clean();
    graphJson.metrics.classCount = classes.length;
    for (var i = 0; i < classes.length; i++) {
      // add label
      var labelObject = getLabels(classes[i], languageLabels, store);
      // create id
      var id = getTextValue(classes[i], store._prefixes);
      // get coordinates
      var coordinateX = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateX').clean()[0]);
      var coordinateY = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateY').clean()[0]);
      // get classTypes
      var classTypeIRI = store.getObjects(classes[i], 'webvowl:classType').clean()[0];
      var classType = getTextValue(dictionaryStore.getObjects(classTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // get individuals
      var individuals = [];
      var instances = store.getObjects(classes[i], 'webvowl:hasIndividual').clean();
      for (var j = 0; j < instances.length; j++) {
        ++graphJson.metrics.individualCount;
        var individualLabels = getLabels(instances[j], languageLabels, store);
        individuals.push({
          iri: instances[j],
          labels: individualLabels,
        });
      }
      // prepare object to put to classAttribute
      var classAttribute = {
        id: id,
        label: labelObject,
        iri: classes[i],
        instances: instances.length,
        x: coordinateX,
        y: coordinateY,
        individuals: individuals
      };
      // get annotations
      var annotations = getAnnotations(classes[i], languageLabels, store, dictionaryStore);
      if (Object.keys(annotations).length > 0) {
        classAttribute.annotations = annotations;
      }
      // add class to "class" in the final json
      graphJson.class.push({id: id, type: classType});
      // add class to "classAttribute" in the final json
      graphJson.classAttribute.push(classAttribute);
    }
    // it's time to add datatypes
    var datatypes = store.getSubjects('rdf:type', 'webvowl:Datatype').clean();
    graphJson.metrics.datatypePropertyCount = graphJson.metrics.datatypeCount = datatypes.length;
    graphJson.metrics.nodeCount = classes.length + datatypes.length;
    for (var i = 0; i < datatypes.length; i++) {
      // create id
      var id = getTextValue(datatypes[i], store._prefixes);
      // get type from datatype
      var datatypeTypeIRI = store.getObjects(datatypes[i], 'webvowl:datatypeType').clean()[0];
      var datatypeType = getTextValue(dictionaryStore.getObjects(datatypeTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // add label
      var labelObject = getLabels(datatypes[i], languageLabels, store);
      // get coordinates
      var coordinateX = getTextValue(store.getObjects(datatypes[i], 'webvowl:coordinateX').clean()[0]);
      var coordinateY = getTextValue(store.getObjects(datatypes[i], 'webvowl:coordinateY').clean()[0]);
      // add datatype to "datatype" in the final json
      graphJson.datatype.push({id: id, type: datatypeType});
      // add datatype to "datatypeAttribute" in the final json
      graphJson.datatypeAttribute.push({
        id: id,
        label: labelObject,
        iri: datatypes[i],
        x: coordinateX,
        y: coordinateY,
      });
    }
    // at the end add properties
    var properties = store.getSubjects('rdf:type', 'webvowl:Property').clean();
    graphJson.metrics.objectPropertyCount = properties.length;
    graphJson.metrics.propertyCount = properties.length + datatypes.length;
    for (var i = 0; i < properties.length; i++) {
      // create id
      var id = getTextValue(properties[i], store._prefixes);
      // get type from datatype
      var propertyTypeIRI = store.getObjects(properties[i], 'webvowl:propertyType').clean()[0];
      var propertyType = getTextValue(dictionaryStore.getObjects(propertyTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // add label
      var labelObject = getLabels(properties[i], languageLabels, store);
      // add range
      var rangeID = getTextValueFromTtl(properties[i], 'webvowl:range', store);
      // add domain
      var domainID = getTextValueFromTtl(properties[i], 'webvowl:domain', store);
      // add datatype to "datatype" in the final json
      graphJson.property.push({id: id, type: propertyType});
      // add datatype to "datatypeAttribute" in the final json
      var propertyAttribute = {
        id: id,
        label: labelObject,
        iri: properties[i],
        range: rangeID,
        domain: domainID,
      };
      // add optional props (cardinality)
      var cardinality = getTextValueFromTtl(properties[i], 'webvowl:cardinality', store);
      if (cardinality) {
        propertyAttribute.cardinality = cardinality;
      }
      var maxCardinality = getTextValueFromTtl(properties[i], 'webvowl:maxCardinality', store);
      if (maxCardinality) {
        propertyAttribute.maxCardinality = maxCardinality;
      }
      var minCardinality = getTextValueFromTtl(properties[i], 'webvowl:minCardinality', store);
      if (minCardinality) {
        propertyAttribute.minCardinality = minCardinality;
      }
      // get annotations
      var annotations = getAnnotations(properties[i], languageLabels, store, dictionaryStore);
      if (Object.keys(annotations).length > 0) {
        propertyAttribute.annotations = annotations;
      }
      graphJson.propertyAttribute.push(propertyAttribute);
    }

    // <http://gdsr.roche.com/mods/md/1609/study#researchGroupDescription>
    //   rdf:type webvowl:Property ;
    //   webvowl:cardinality "1"^^xsd:nonNegativeInteger ;
    //   webvowl:domain <http://gdsr.roche.com/mods/md/1609/study#ResearchGroup> ;
    //   webvowl:iri <http://gdsr.roche.com/mods/md/1609/study#researchGroupDescription> ;
    //   webvowl:label <http://gdsr.roche.com/mods/md/1609/study#researchGroupDescriptionIriLabel> ;
    //   webvowl:label <http://gdsr.roche.com/mods/md/1609/study#researchGroupDescriptionPrefLabel> ;
    //   webvowl:propertyType webvowl:propertyTypeDatatypeProperty ;
    //   webvowl:range <http://gdsr.roche.com/mods/md/1609/study#researchGroupDescriptionDatatypeObject> ;
    // .

    // {
    //   "id": "property28",
    //   "label": {
    //     "IRI-based": "scientificTitle",
    //     "undefined": "Scientfic Title"
    //   },
    //   "iri": "http://gdsr.roche.com/mods/md/1609/study#scientificTitle",
    //   "annotations": {
    //     "definition": [
    //       {
    //         "identifier": "definition",
    //         "language": "undefined",
    //         "value": "A comprehensive summary of study design and objectives, aimed at scientific audience. Scientific title may also be referred to as \"official title\" or \"protocol title.\"",
    //         "type": "label"
    //       }
    //     ],
    //     "seeAlso": [
    //       {
    //         "identifier": "seeAlso",
    //         "language": "undefined",
    //         "value": "https://mods.roche.com/ws/resource?uri=http://mods.roche.com/ui/mods-browser-app%23MODSBrowser#/stds/at/http%3A%2F%2Fmods.roche.com%2Fmods-data%23StudyScientificTitle",
    //         "type": "iri"
    //       },
    //       {
    //         "identifier": "seeAlso",
    //         "language": "undefined",
    //         "value": "https://gdsr.roche.com/ws/resource?uri=http://mods.roche.com/ui/mods-browser-app%23MODSBrowser#/stds/at/http%3A%2F%2Fmods.roche.com%2Fmods-data%23StudyScientificTitle",
    //         "type": "iri"
    //       }
    //     ],
    //     "customProperty": [
    //       {
    //         "identifier": "leszek's link",
    //         "language": "undefined",
    //         "value": "<a style=\"color: blue;\" href=\"http://leszekpawlak.pl\">test</a>",
    //         "type": "html"
    //       }
    //     ]
    //   },
    //   "domain": "class11",
    //   "range": "datatype3",
    //   "maxCardinality": 1
    // },

    console.log("graphJson", graphJson);
    // parsing JSON to graph valid JSON
    return JSON.stringify(graphJson);
  }

  function getTextValue(uri, prefixes) {
    if (!uri) { return null; }
    var util = N3.Util;
    var result = uri;
    if (util.isLiteral(uri)) {
      result = util.getLiteralValue(uri);
    } else if (prefixes) {
      Object.keys(prefixes).map(function(prefixKey) {
        var iriToReplace = prefixes[prefixKey];
        var index = uri.indexOf(iriToReplace);
        if (index > -1) {
          result = uri.replace(iriToReplace, prefixKey);
        }
      });
    }

    return result;
  }

  return parseTtl;
};
