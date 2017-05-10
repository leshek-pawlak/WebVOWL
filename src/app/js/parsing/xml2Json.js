module.exports = function() {
  // import
  var xmlToJson = require('../../../../util/xmlToJson/xmlToJson');
  var parseJson = require('./parseJson')();

  // application
  function parseXml(xml) {
    var options = {
      attrKey: '', // tag for attr groups
      attrsAsObject: false, // if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
      childrenAsArray: false // force children into arrays
    };
    // xml to json
    var json = xmlToJson.parseString(xml, options);
    console.log(json);
    // parsing JSON
    return parseJson(json);
  }

  return parseXml;
};
