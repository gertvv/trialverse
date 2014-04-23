var events = require('events');
var util = require('util');
var XmlStream = require('xml-stream');
var _ = require('underscore');

function parse(stream, emitter) {
  var xml = new XmlStream(stream);

  var abstr = {};

  xml.on('startElement: PubmedArticle', function(element) {
    abstr = {};
  });

  xml.on('updateElement: PubmedArticle > MedlineCitation > PMID', function(element) {
    abstr.id = 'http://pubmed.com/' + element.$text;
  });

  xml.on('updateElement: PubmedArticle ArticleTitle', function(element) {
    abstr.title = element.$text;
  });

  xml.on('updateElement: PubmedArticle Journal > Title', function(element) {
    abstr.journal = element.$text;
  });

  xml.on('updateElement: PubmedArticle Journal PubDate > Year', function(element) {
    abstr.year = element.$text;
  });

  xml.on('startElement: PubmedArticle AuthorList', function(element) {
    abstr.authors = [];
  });

  xml.on('updateElement: PubmedArticle AuthorList > Author', function(element) {
    var author = {
      'familyName': element.LastName,
      'initials': element.Initials
    };
    abstr.authors.push(author);
  });

  xml.on('startElement: PubmedArticle Abstract', function(element) {
    abstr.abstractText = '';
  });

  xml.on('updateElement: PubmedArticle Abstract > AbstractText', function(element) {
    if (element.$ && element.$.Label) {
      abstr.abstractText += element.$.Label + ' ';
    }
    abstr.abstractText += element.$text + '\n';
  });

  xml.on('startElement: PubmedArticle MeshHeadingList', function(element) {
    abstr.mesh = [];
  });

  xml.collect('QualifierName');
  xml.on('updateElement: PubmedArticle MeshHeadingList > MeshHeading', function(element) {
    var meshHeading = {};
    meshHeading.descriptor = {
      name: element.DescriptorName.$text,
      majorTopic: element.DescriptorName.MajorTopicYN == "Y"
    };
    meshHeading.qualifiers = _.map(element.QualifierName, function(element) {
      return {
        name: element.$text,
        majorTopic: element.MajorTopicYN == "Y"
      };
    });
    abstr.mesh.push(meshHeading);
  });

  xml.on('endElement: PubmedArticle', function(element) {
    emitter.emit('item', abstr);
  });

  xml.on('end', function() {
    emitter.emit('end');
  });
}

function Parser(stream) {
  events.EventEmitter.call(this);

  parse(stream, this);
}
util.inherits(Parser, events.EventEmitter);

module.exports = Parser;
