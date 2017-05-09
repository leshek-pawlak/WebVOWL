module.exports = function() {
  // import
  var N3 = require('n3');
  var N3Util = N3.Util;
  var parseJson = require('./parseJson')();
  var _ = require("lodash");

  // application
  function parseTtl(ttl) {
    // TODO TTL -> JSON
    var store = [];
    var parser = N3.Parser();
    var tmp = {}
    parser.parse(ttl, function(error, triple, prefixes) {
      if (triple) {
        if (isEmpty(tmp)) {
          tmp._uri = triple.subject;
          tmp[triple.predicate] = triple.object;
        } else if (triple.subject === tmp._uri) {
          tmp[triple.predicate] = triple.object;
        } else {
          store.push(tmp);
          tmp = {};
        }
        // if (N3Util.isIRI(subject)) {}
      } else {
        var newStore = replacePrefixesInStore(store, prefixes);
        console.log(newStore);
      }
    });
    // parsing JSON
    // return parseJson(json);
  }

  function getHash(url) {
    return url.substring(url.indexOf('#') + 1);
  }

  // Speed up calls to hasOwnProperty
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj === null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
  }

  function replacePrefixesInStore(store, prefixes) {
    var newStore = [];
    for (var i = 0; i < store.length; i++) {
      newStore.push({});
      Object.keys(store[i]).map(function(storeObjectKey, index) {
        var replacedKey = storeObjectKey;
        Object.keys(prefixes).map(function(prefixKey, index) {
          var iriToReplace = prefixes[prefixKey];
          if (storeObjectKey.indexOf(iriToReplace) > -1) {
            replacedKey = storeObjectKey.replace(iriToReplace, prefixKey + '_');
          }
        });
        newStore[i][replacedKey] = store[i][storeObjectKey];
      });
    }
    // for (var i = 0; i < prefixes.length; i++) {
    //   prefixes[i]
    // }

    return newStore;
  }

  return parseTtl;
};
