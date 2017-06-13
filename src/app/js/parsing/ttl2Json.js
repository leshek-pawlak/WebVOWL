/* jshint -W117 */
module.exports = function() {
  // import
  var N3 = require('n3');

  // export function
  function parseTtl(ttl) {
    return new Promise(function (resolve, reject) {
      var pathToWebvowlTtl = location.origin + location.pathname + 'webvowl.ttl';
      d3.xhr(pathToWebvowlTtl, 'application/ttl', function (error, request) {
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

  function getTextValue(uri, prefixes, toReplace) {
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
          if (typeof toReplace === 'undefined') { toReplace = prefixKey; }
          result = uri.replace(iriToReplace, toReplace);
        }
      });
    }

    return result;
  }

  function createStructure(ttl, dictionaryTtl) {
    // add rule function is specifed here, because we need access to graphJson.
    function addRuleProperty(id, element, domain, range) {
      ++graphJson.metrics.objectPropertyCount;
      ++graphJson.metrics.propertyCount;
      graphJson.propertyAttribute.push({
        id: id, // new id for this property. unique number
        element: element, // iri of output/input
        domain: domain, // this iri of rule || iri of input class.
        range: range // iri of output class || this iri of rule
      });
      graphJson.property.push({
        id: id,
        type: 'relations'
      });
    }

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
      versions: [{
        url: location.href,
        version: version,
      }],
      author: [author],
      description: description,
    };
    // add versions to json
    var otherVersions = getTextValue(store.getObjects(header, 'webvowl:otherVersion').clean());
    if (otherVersions.length > 0) {
      for (var ov = 0; ov < otherVersions.length; ++ov) {
        graphJson.header.versions.push({
          url: getTextValue(store.getObjects(otherVersions[ov], 'webvowl:link').clean()[0]),
          version: getTextValue(store.getObjects(otherVersions[ov], 'webvowl:version').clean()[0])
        });
      }
    }
    // add rules to json
    var rules = store.getSubjects('rdf:type', 'webvowl:Rule').clean();
    for (var r = 0; r < rules.length; r++) {
      var ruleId = rules[r];
      // add label
      var ruleLabelObject = getLabels(rules[r], languageLabels, store);
      // get inputs and add property to create arrows between rule and inputs
      var ruleInputs = store.getObjects(rules[r], 'webvowl:ruleInput').clean();
      for (var ri = 0; ri < ruleInputs.length; ri++) {
        var inputIri = getTextValueFromTtl(ruleInputs[ri], 'webvowl:iri', store);
        var inputType = getTextValue(store.getObjects(ruleInputs[ri], 'rdf:type').clean()[0], store._prefixes, '');
        if (inputType === 'Class') {
          addRuleProperty('property' + ri + Date.now(), inputIri, inputIri, ruleId);
        } else {
          var domainInputIri = getTextValueFromTtl(store.getObjects(inputIri, 'webvowl:domain').clean()[0], 'webvowl:iri', store);
          addRuleProperty('property' + ri + Date.now(), inputIri, domainInputIri, ruleId);
        }
      }
      // get output and add property to create arrow between rule and output
      var ruleOutput = getTextValueFromTtl(rules[r], 'webvowl:ruleOutput', store);
      var outputIri = getTextValueFromTtl(ruleOutput, 'webvowl:iri', store);
      var outputType = getTextValue(store.getObjects(ruleOutput, 'rdf:type').clean()[0], store._prefixes, '');
      if (outputType === 'Class') {
        addRuleProperty('property' + ri + Date.now(), outputIri, ruleId, outputIri);
      } else {
        var domainOutputIri = getTextValueFromTtl(store.getObjects(outputIri, 'webvowl:domain').clean()[0], 'webvowl:iri', store);
        addRuleProperty('property' + ri + Date.now(), outputIri, domainOutputIri, ruleId);
      }
      // create role attribute object.
      var ruleAttribute = {
        id: ruleId,
        label: ruleLabelObject,
        input: ruleInputs,
        output: ruleOutput
      };
      // get annotations
      var ruleAnnotations = getAnnotations(rules[r], languageLabels, store, dictionaryStore);
      if (Object.keys(ruleAnnotations).length > 0) {
        ruleAttribute.annotations = ruleAnnotations;
      }
      // add rule to "class" in the final json
      graphJson.class.push({id: ruleId, type: 'rule'});
      // add rule to "classAttribute" in the final json
      graphJson.classAttribute.push(ruleAttribute);
    }
    // add classes to json
    var classes = store.getSubjects('rdf:type', 'webvowl:Class').clean();
    var classCount = classes.length + rules.length;
    graphJson.metrics.classCount += classCount;
    for (var i = 0; i < classes.length; i++) {
      // add label
      var classLabelObject = getLabels(classes[i], languageLabels, store);
      // get iri
      var classIri = getTextValueFromTtl(classes[i], 'webvowl:iri', store);
      // get coordinates
      var classCoordinateX = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateX').clean()[0]);
      var classCoordinateY = getTextValue(store.getObjects(classes[i], 'webvowl:coordinateY').clean()[0]);
      // get classTypes
      var classTypeIRI = store.getObjects(classes[i], 'webvowl:classType').clean()[0];
      var classType = getTextValue(dictionaryStore.getObjects(classTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // if it's null it's unionOf.
      if (!classType) {
        // NOTE it should be defined in the webvowl.ttl file
        classType = 'owl:unionOf';
      }
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
        id: classes[i],
        label: classLabelObject,
        iri: classIri,
        instances: instances.length,
        individuals: individuals
      };
      if (classCoordinateX) {
        classAttribute.x = classCoordinateX;
      }
      if (classCoordinateY) {
        classAttribute.y = classCoordinateY;
      }
      // get part of unions
      if (classType === 'owl:unionOf') {
        var partOfUnion = [];
        var partOfUnionIRIs = store.getObjects(classIri, 'webvowl:partOfUnion').clean();
        for (var pu = 0; pu < partOfUnionIRIs.length; pu++) {
          partOfUnion.push(getTextValueFromTtl(partOfUnionIRIs[pu], 'webvowl:iri', store));
        }
        classAttribute.union = partOfUnion;
      }
      // get annotations
      var classAnnotations = getAnnotations(classes[i], languageLabels, store, dictionaryStore);
      if (Object.keys(classAnnotations).length > 0) {
        classAttribute.annotations = classAnnotations;
      }
      // add class to "class" in the final json
      graphJson.class.push({id: classes[i], type: classType});
      // add class to "classAttribute" in the final json
      graphJson.classAttribute.push(classAttribute);
    }
    // it's time to add datatypes
    var datatypes = store.getSubjects('rdf:type', 'webvowl:Datatype').clean();
    var nodeCount = classes.length + datatypes.length;
    graphJson.metrics.datatypePropertyCount += datatypes.length;
    graphJson.metrics.datatypeCount += datatypes.length;
    graphJson.metrics.nodeCount += nodeCount;
    for (var d = 0; d < datatypes.length; d++) {
      // get iri
      var datatypeIri = getTextValueFromTtl(datatypes[d], 'webvowl:iri', store);
      // get type from datatype
      var datatypeTypeIRI = store.getObjects(datatypes[d], 'webvowl:datatypeType').clean()[0];
      var datatypeType = getTextValue(dictionaryStore.getObjects(datatypeTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // add label
      var datatypeLabelObject = getLabels(datatypes[d], languageLabels, store);
      // get coordinates
      var datatypeCoordinateX = getTextValue(store.getObjects(datatypes[d], 'webvowl:coordinateX').clean()[0]);
      var datatypeCoordinateY = getTextValue(store.getObjects(datatypes[d], 'webvowl:coordinateY').clean()[0]);
      var datatypeAttribute = {
        id: datatypes[d],
        label: datatypeLabelObject,
        iri: datatypeIri,
      };
      if (datatypeCoordinateX) {
        datatypeAttribute.x = datatypeCoordinateX;
      }
      if (datatypeCoordinateY) {
        datatypeAttribute.y = datatypeCoordinateY;
      }
      // add datatype to "datatype" in the final json
      graphJson.datatype.push({id: datatypes[d], type: datatypeType});
      // add datatype to "datatypeAttribute" in the final json
      graphJson.datatypeAttribute.push(datatypeAttribute);
    }
    // at the end add properties
    var properties = store.getSubjects('rdf:type', 'webvowl:Property').clean();
    var propertyCount = properties.length + datatypes.length;
    graphJson.metrics.objectPropertyCount += properties.length;
    graphJson.metrics.propertyCount += propertyCount;
    for (var p = 0; p < properties.length; p++) {
      // get iri
      var propertyIri = getTextValueFromTtl(properties[p], 'webvowl:iri', store);
      // get type from datatype
      var propertyTypeIRI = store.getObjects(properties[p], 'webvowl:propertyType').clean()[0];
      var propertyType = getTextValue(dictionaryStore.getObjects(propertyTypeIRI, 'webvowl:typeLabel').clean()[0]);
      // add label
      var propertyLabelObject = getLabels(properties[p], languageLabels, store);
      // add range
      var rangeID = getTextValueFromTtl(properties[p], 'webvowl:range', store);
      // add domain
      var domainID = getTextValueFromTtl(properties[p], 'webvowl:domain', store);
      // add datatype to "datatype" in the final json
      graphJson.property.push({id: properties[p], type: propertyType});
      // add datatype to "datatypeAttribute" in the final json
      var propertyAttribute = {
        id: properties[p],
        label: propertyLabelObject,
        iri: propertyIri,
        range: rangeID,
        domain: domainID,
      };
      // add optional props (cardinality)
      var cardinality = getTextValueFromTtl(properties[p], 'webvowl:cardinality', store);
      if (cardinality) {
        propertyAttribute.cardinality = cardinality;
      }
      var maxCardinality = getTextValueFromTtl(properties[p], 'webvowl:maxCardinality', store);
      if (maxCardinality) {
        propertyAttribute.maxCardinality = maxCardinality;
      }
      var minCardinality = getTextValueFromTtl(properties[p], 'webvowl:minCardinality', store);
      if (minCardinality) {
        propertyAttribute.minCardinality = minCardinality;
      }
      // get annotations
      var propertyAnnotations = getAnnotations(properties[p], languageLabels, store, dictionaryStore);
      if (Object.keys(propertyAnnotations).length > 0) {
        propertyAttribute.annotations = propertyAnnotations;
      }
      graphJson.propertyAttribute.push(propertyAttribute);
    }

    // console.log("graphJson", graphJson);
    // parsing JSON to graph valid JSON
    return JSON.stringify(graphJson);
  }

  return parseTtl;
};
