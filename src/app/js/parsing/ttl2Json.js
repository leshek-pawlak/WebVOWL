module.exports = function() {
  // import
  var N3 = require('n3');
  var N3Util = N3.Util;
  var parseJson = require('./parseJson')();
  var _ = require("lodash");

  // application
  function parseTtl(ttl) {
    var parser = N3.Parser(),
      store = [],
      tmp = {},
      finalJson = {};
    parser.parse(ttl, function(error, triple, prefixes) {
      if (triple) {
        // save triples as js objects
        if (isEmpty(tmp)) {
          tmp._uri = triple.subject;
        } else if (triple.subject !== tmp._uri) {
          store.push(tmp);
          tmp = {
            _uri: triple.subject
          };
        }
        tmp[triple.predicate] = triple.object;
      } else {
        // replace all keys in objects prefixes defined in turtle file
        var newStore = replacePrefixesInStore(store, prefixes);
        finalJson = createNestedStructure(newStore);
        console.log(finalJson);
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
        var value = store[i][storeObjectKey];
        Object.keys(prefixes).map(function(prefixKey, index) {
          var iriToReplace = prefixes[prefixKey];
          if (storeObjectKey.indexOf(iriToReplace) > -1) {
            replacedKey = storeObjectKey.replace(iriToReplace, prefixKey + '_');
          }
          if (storeObjectKey.indexOf('type') > -1 && value.indexOf(iriToReplace) > -1) {
            value = value.replace(iriToReplace, prefixKey + ':');
          }
        });
        newStore[i][replacedKey] = value;
      });
    }

    return newStore;
  }

  function createNestedStructure(store) {
    var json = {};
    for (var i = 0; i < store.length; i++) {
      json = findObjectToPut(store[i], json);
    }

    return json;
  }

  function findObjectToPut(element, json) {
    var typeKey = getPathToPutObject('type', element);
    var typeOfElement = _.snakeCase(element[typeKey[0]]);
    if (isEmpty(json)) {
      element.list = {
        owl_class: [],
        owl_datatype_property: [],
        owl_object_property: []
      };
      json[typeOfElement] = element;
    } else if (typeOfElement) {
      var arrayPath = getPathToPutObject(typeOfElement, json);
      var obj = json;
      console.log('arrayPath', arrayPath);
      for (var i = arrayPath.length - 1; i > 0; --i) {
        obj = obj[arrayPath[i]];
      }
      console.log('arrayPath[0]', arrayPath[0]);
      if (!obj[arrayPath[0]] || !obj[arrayPath[0]].length) {
        obj[arrayPath[0]] = [];
      }
      obj[arrayPath[0]].push(element);
    }

    return json;
  }

  function getPathToPutObject(key, element, res) {
    res = res ? res : [];
    Object.keys(element).map(function(elementKey, index) {
      if (typeof res === 'object' && typeof element[elementKey] === 'object') {
        var recusiveKey = getPathToPutObject(key, element[elementKey], res);
        if (recusiveKey.length > 0 && !element[recusiveKey[recusiveKey.length - 1]]) {
          res.push(elementKey);
        }
      }
      if (elementKey.indexOf(key) > -1) {
        res.push(elementKey);
      }
    });
    console.log('res: ', res);
    return res;
  }

  return parseTtl;
};
