var querystring = require('querystring');
var deferred = require('deferred');
var http = require('http');

var query_str = '(randomized controlled trial[Publication Type] OR (randomized[Title/Abstract] AND controlled[Title/Abstract] AND trial[Title/Abstract])) AND (depression) AND (bupropion[Title/Abstract] OR citalopram[Title/Abstract] OR duloxetine[Title/Abstract] OR escitalopram[Title/Abstract] OR fluoxetine[Title/Abstract] OR fluvoxamine[Title/Abstract] OR mirtazapine[Title/Abstract] OR paroxetine[Title/Abstract] OR sertraline[Title/Abstract] OR venlafaxine[Title/Abstract]) AND ("1991"[Date - Publication] : "2004"[Date - Publication])';

var eutils = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
var search = "esearch.fcgi?";
var fetch = "efetch.fcgi?";

function initSearch(query) {
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

function fetchResult(search) {
  var result = deferred();

  var query = querystring.stringify({
    "db": "pubmed",
    "query_key": search.querykey, 
    "webenv": search.webenv,
    "retmode": "xml",
    "retstart": 0,
    "retmax": 3 // search.count 
  });

  var url = eutils + fetch + query;

  var data = ""
  http.get(url, function(res) {
    res.setEncoding('utf-8');
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('error', result.reject);
    res.on('end', function() {
      result.resolve(data);
    });
  });

  return result.promise;
}

initSearch(query_str).then(fetchResult).then(console.log);
