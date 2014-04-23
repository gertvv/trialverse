var fs = require('fs');
var _ = require('underscore');
var csvStringify = require('csv-stringify');

function abstractsToTsv(path) {
  var tsv = csvStringify({ delimiter: '\t' });
  tsv.pipe(fs.createWriteStream(path));
  tsv.write([ 'id', 'title', 'abstract', 'keywords', 'authors', 'journal' ]);

  function meshStr(mesh) {
    return _.map(mesh, function(term) {
      var els = [term.descriptor].concat(term.qualifiers);
      return _.map(els, function(el) {
        return (el.majorTopic ? "*" : "") + el.name;
      }).join("/");
    }).join("; ");
  }
  function authorsStr(authors) {
    return _.map(authors, function(author) { return author.familyName + ' ' + author.initials; }).join(", ");
  }

  function abstractTSV(abstr) {
    tsv.write([ abstr.id, abstr.title, abstr.abstractText, meshStr(abstr.mesh), authorsStr(abstr.authors), abstr.journal ]);
  }

  this.write = abstractTSV;
  this.end = function() { tsv.end() };
}

module.exports = { abstractTsvWriter: abstractsToTsv };
