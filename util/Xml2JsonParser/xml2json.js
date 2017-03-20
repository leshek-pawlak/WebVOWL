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
var exportFolder = options.exportFolder || "src/app/data";
var pathToXmlfile = options.pathToXmlfile || "src/app/xml/model-output.xml";

// application
fs.readFile(pathToXmlfile, 'utf8', function (err, data) {
  if (err) {
    return console.warn(err);
  }
  // xml to json
  var json = parser.toJson(data, { object: true });
  // parsing JSON
  var parsedJson = parseJson(json);
  // save parsed json to file
  fs.writeFile(exportFolder + '/' + Date.now() + '.json', parsedJson, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  });
});

function parseJson(json) {
  console.log("to json -> %s", json);

  return JSON.stringify(json);
}
