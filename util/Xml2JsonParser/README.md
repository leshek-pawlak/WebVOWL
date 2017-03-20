# Xml2JsonParser

This tool converts XML files into valid D3 JSON, which can be used to create graphs.

To use this tool we need to install firstly NodeJS on the machine.

## How to install and run

1. Run `npm install` in the root directory of this project to install the dependency which
processes the css code.

> Windows users need to open NodeJS prompt first as administrator and run `npm install -g --production windows-build-tools`.
> It's required to install npm dependencies on non-unix OS.

2. Run `grunt run:xml2json --pathToXmlfile="src/blabla/bla/ourXmlFile.xml" --exportFolder="test/exportFolder"`.
Arguments `pathToXmlfile` and `exportFolder` aren't required.
Default pathToXmlfile is `src/app/xml/model-output.xml` and exportFolder is `src/app/data`.

3. Add new JSON file to `index.html` file inside `Models` list.

4. Run `grunt webserver` to run WebVOWL locally. From the `Models` select a newly generated model and check if everything is ok.
