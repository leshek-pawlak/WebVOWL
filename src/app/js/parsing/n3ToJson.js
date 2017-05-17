module.exports = function() {
  // import
  var N3 = require('n3');
  var parseJson = require('./parseJson')();
  var _ = require("lodash");

  // export function
  function parseTtl(ttl) {
    var json = {},
      parser = N3.Parser(),
      parsed = parser.parse(ttl),
      store = N3.Store(parsed, { prefixes: parser._prefixes });

    var subjects = store.getSubjectsByIRI();
    for (var s = 0; s < subjects.length; ++s) {
      if (!subjects[s]) { continue; }
      var predicates = store.getPredicatesByIRI(subjects[s]);
      for (var p = 0; p < predicates.length; p++) {
        if (!predicates[p]) { continue; }
        var object = getTextValue(store.getObjectsByIRI(subjects[s], predicates[p])[0], parser._prefixes);
        var jsonKey = getTextValue(subjects[s], parser._prefixes);
        var valueKey = getTextValue(predicates[p], parser._prefixes);
        var obj = json[jsonKey] || {};
        if (obj[valueKey]) {
          if (obj[valueKey].length) {
            var tmp = obj[valueKey];
            obj[valueKey] = [tmp];
          } else {
            obj[valueKey].push(object);
          }
        } else {
          obj[valueKey] = object;
        }
        json[jsonKey] = obj;
      }
    }
    console.log("json", json);
    // console.log("parsed", parsed, 'parser._prefixes', parser._prefixes);
    // console.log("store.getObjects()", store.getObjects('https://gdsr.roche.com/mods/dft/1704/study1609-webvowl#class4'));
    // console.log("store.getPredicates()", store.getPredicates('https://gdsr.roche.com/mods/dft/1704/study1609-webvowl#class4'));
    // console.log("store.getSubjects()", store.getSubjects('https://gdsr.roche.com/mods/dft/1704/study1609-webvowl#class4'));



    // parsing JSON to graph valid JSON
    // return parseJson(json);
  }

  function getTextValue(uri, prefixes) {
    var util = N3.Util;
    var result = uri;
    if (util.isLiteral(uri)) {
      result = util.getLiteralValue(uri);
    } else {
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
