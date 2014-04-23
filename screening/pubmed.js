var querystring = require('querystring');
var deferred = require('deferred');
var http = require('http');
var _ = require('underscore');
var PubmedSearch = require('./pubmed/search');
var csvStringify = require('csv-stringify');

//var query_str = '(randomized controlled trial[Publication Type] OR (randomized[Title/Abstract] AND controlled[Title/Abstract] AND trial[Title/Abstract])) AND (depression) AND (bupropion[Title/Abstract] OR citalopram[Title/Abstract] OR duloxetine[Title/Abstract] OR escitalopram[Title/Abstract] OR fluoxetine[Title/Abstract] OR fluvoxamine[Title/Abstract] OR mirtazapine[Title/Abstract] OR paroxetine[Title/Abstract] OR sertraline[Title/Abstract] OR venlafaxine[Title/Abstract]) AND ("1991"[Date - Publication] : "2004"[Date - Publication])';

var query_str = 'vampires';

var tsv = csvStringify({ delimiter: '\t' });
tsv.pipe(process.stdout);
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

var search = new PubmedSearch(query_str, 20);
search.on('item', abstractTSV);
