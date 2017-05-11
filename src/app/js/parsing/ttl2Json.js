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
      parsed = parser.parse(ttl);
    // NOTE don't use N3 parser with callback. It started to be async and breaks return value!!
    for (var i = 0; i < parsed.length; ++i) {
      // save triples as js objects
      if (isEmpty(tmp)) {
        tmp._uri = parsed[i].subject;
      } else if (parsed[i].subject !== tmp._uri) {
        store.push(tmp);
        tmp = {
          _uri: parsed[i].subject,
          _hash: getHash(parsed[i].subject)
        };
      }
      tmp[parsed[i].predicate] = parsed[i].object;
    }
    var newStore = replacePrefixesInStore(store, parser._prefixes);
    // parsing JSON to graph valid JSON
    return parseJson(createNestedStructure(newStore));
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
        header: [],
        class: [],
        datatype_property: [],
        object_property: []
      };
      json[typeOfElement] = element;
    } else if (typeOfElement.indexOf('class') > -1) {
      var arrayPath = getPathToPutObject(typeOfElement, json);
      var obj = json;
      for (var i = arrayPath.length - 1; i > 0; --i) {
        obj = obj[arrayPath[i]];
      }
      if (obj[arrayPath[0]]) {
        if (typeof obj[arrayPath[0]] === 'string') {
          obj[arrayPath[0]] = [];
        }
        obj[arrayPath[0]].push(element);
      }
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
      if (res.length < 1 && elementKey.indexOf(key.replace(/^.+_/i, '')) > -1) {
        res.push(elementKey);
      }
    });

    return res;
  }

  return parseTtl;
};
