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
    var graphJson = {
        _comment: "Created with OWL2VOWL (version 0.2.0), http://vowl.visualdataweb.org",
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
      store = N3.Store(parsed, {prefixes: parser._prefixes});

    // add header to json
    var root = store.getSubjects(null, 'owl:Ontology').clean()[0];
    var header = store.getSubjects('rdf:type', 'webvowl:Header').clean()[0];
    // get version from root and add it to header
    var headerVersion = getTextValue(store.getObjects(root, 'owl:versionInfo').clean()[0]);
    // add languages to header
    var headerLanguages = store.getObjects(header, 'webvowl:definedLanguage').clean();
    var lang = [];
    for (var i = 0; i < headerLanguages.length; i++) {
      lang.push(getTextValue(headerLanguages[i], store._prefixes).replace('webvowl', '').replace('Language', ''));
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
    for (var i = 0; i < classes.length; i++) {
      ++graphJson.metrics.classCount;
      // add label
      var labelObject = {};
      var label = store.getObjects(classes[i], 'webvowl:label').clean();
      for (var j = 0; j < label.length; j++) {
        var text = getTextValue(store.getObjects(label[j], 'webvowl:labelText').clean()[0]);
        var language = getTextValue(store.getObjects(label[j], 'webvowl:labelLanguage').clean()[0], store._prefixes).replace('webvowl', '').replace('Language', '');
        labelObject[language] = text;
      }
      // create id
      var id = getTextValue(classes[i], store._prefixes);
      // get coordinates
      var coordinateX = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateX').clean()[0]);
      var coordinateY = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateY').clean()[0]);
      // add class to "class" in the final json
      graphJson.class.push({id: id, type: 'owl:Class'});
      // add class to "classAttribute" in the final json
      graphJson.classAttribute.push({
        id: id,
        label: labelObject,
        iri: classes[i],
        x: coordinateX || 0,
        y: coordinateY || 0,
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
