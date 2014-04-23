var events = require('events');
var util = require('util');
var querystring = require('querystring');
var deferred = require('deferred');
var http = require('http');
var PubmedParser = require('./parser');

var eutils = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
var search = "esearch.fcgi?";
var fetch = "efetch.fcgi?";

function initSearch(query_str) {
  var result = deferred();

  var query = querystring.stringify({
    "db": "pubmed",
    "retmode": "json",
    "type": "count",
    "retmax": 0,
    "usehistory": "y",
    "term": query_str
  });

  var url = eutils + search + query;

  var data = ""
  http.get(url, function(res) {
    res.setEncoding('utf-8');
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('error', result.reject);
    res.on('end', function() {
      result.resolve(JSON.parse(data).esearchresult);
    });
  });

  return result.promise;
}

// Returns a promise that resolves to true if there are more results to fetch
function fetchPage(search, pageIndex, pageSize, emitter) {
  var result = deferred();

  var query = querystring.stringify({
    "db": "pubmed",
    "query_key": search.querykey, 
    "webenv": search.webenv,
    "retmode": "xml",
    "retstart": pageIndex * pageSize,
    "retmax": pageSize
  });

  var url = eutils + fetch + query;

  var data = ""
  http.get(url, function(res) {
    res.setEncoding('utf-8');
    var parser = new PubmedParser(res);
    parser.on('item', function(item) { emitter.emit('item', item) });
    parser.on('end', function() { result.resolve((pageIndex + 1) * pageSize < search.count); });
  }, result.reject);

  return result.promise;
}

function fetchResult(search, pageSize, emitter) {
  var n = 0;
  fetchPage(search, n, pageSize, emitter).then(function process(more) {
    if (more) {
      fetchPage(search, ++n, pageSize, emitter).then(process);
    } else {
      emitter.emit('end');
    }
  });
}

function Search(query_str, pageSize) {
  events.EventEmitter.call(this);

  var self = this;

  initSearch(query_str).then(function(search) { fetchResult(search, pageSize, self); });
}
util.inherits(Search, events.EventEmitter);

function Count(query_str) {
  var count = deferred();

  initSearch(query_str).then(function(search) { count.resolve(search.count) });

  return count.promise;
}

module.exports = { count: Count, search: Search };
