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
    var root = store.getSubjects(null, 'owl:Ontology').clean()[0];
    var header = store.getSubjects('rdf:type', 'webvowl:Header').clean()[0];
    // get version from root and add it to header
    var headerVersion = getTextValue(store.getObjects(root, 'owl:versionInfo').clean()[0]);
    // add languages to header
    var headerLanguages = store.getObjects(header, 'webvowl:definedLanguage').clean();
    var lang = [];
    for (var z = 0; z < headerLanguages.length; z++) {
      lang.push(languageLabels[headerLanguages[z]]);
    }
    graphJson.header = {
      languages: lang,
      iri: header,
      title: {
        undefined: 'title'
      },
      version: headerVersion || 'version',
      author: ['MODS'],
      description: {
        undefined: 'description'
      },
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
      // find classType
      var classTypeIRI = store.getObjects(classes[i], 'webvowl:classType').clean()[0];
      // get classTypes
      var classType = getTextValue(dictionaryStore.getObjects(classTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // get individuals
      var individuals = [];
      var instances = store.getObjects(classes[i], 'webvowl:hasIndividual').clean();
      for (var j = 0; j < instances.length; j++) {
        var individualLabels = getLabels(instances[j], languageLabels, store);
        individuals.push({
          iri: instances[j],
          labels: individualLabels,
          // annotations: {
          //   label: [{
          //     identifier: 'label',
          //     language: 'undefined',
          //     value: individualLabels.undefined,
          //     type: 'label'
          //   }]
          // }
        });
      }
      // add class to "class" in the final json
      graphJson.class.push({id: id, type: classType});
      // add class to "classAttribute" in the final json
      graphJson.classAttribute.push({
        id: id,
        label: labelObject,
        iri: classes[i],
        instances: instances.length,
        x: coordinateX,
        y: coordinateY,
        individuals: individuals
      });
    }

    console.log("graphJson", graphJson);
    // parsing JSON to graph valid JSON
    return JSON.stringify(graphJson);
  }

  function getTextValue(uri, prefixes) {
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
