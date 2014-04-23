var fs = require('fs');
var everyauth = require('everyauth');
var conf = require('./conf');
var _ = require('underscore');
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session');
var storage = require('node-persist');
var pubmedSearch = require('./pubmed/search');
var abstrackr = require('./abstrackr');

storage.initSync();

var usersById = storage.getItem('usersById') || {};
var projectsById = storage.getItem('projectsById') || {};

everyauth.everymodule
  .findUserById(function(id, callback) {
    callback(null, usersById[id]);
  });

everyauth.google
  .appId(conf.google.clientId)
  .appSecret(conf.google.clientSecret)
  .scope('https://www.googleapis.com/auth/userinfo.profile')
  .findOrCreateUser(function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    if (!usersById[googleUser.id]) {
      usersById[googleUser.id] = googleUser;
      storage.setItem('usersById', usersById);
    }
    return usersById[googleUser.id];
  })
  .redirectPath('/');

var app = express();
app
  .use(express.static(__dirname + '/public'))
  .use(bodyParser())
  .use(cookieParser('very secret secret'))
  .use(session())
  .use(everyauth.middleware());

app.get("/me", function(req, res) {
  res.type("application/json");
  res.send(req.user);
});


function randomId(size, prefix) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < size; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return prefix ? prefix + text : text;
}

app.get('/projects', function(req, res) {
  res.type("application/json");
  if (!req.user) {
    res.send({});
  } else {
    res.send(req.user.projects);
  }
});

app.get('/projects/:projectId', function(req, res) {
  res.type("application/json");
  var project = projectsById[req.params.projectId];
  if (project) {
    res.send(project);
  } else {
    res.send(404, "Not found");
  }
});

function generateQuery(project) {
  var template = '(randomized controlled trial[Publication Type] OR (randomized[Title/Abstract] AND controlled[Title/Abstract] AND trial[Title/Abstract])) AND (%indication%) AND (%interventions%) AND (%minYear%[Date - Publication] : %maxYear%[Date - Publication])';
  var query = template.replace('%indication%', project.indication + "[Title/Abstract]");
  query = query.replace('%interventions%', _.map(project.interventions, function(el) { return el + '[Title/Abstract]' }).join(" OR "));
  query = query.replace('%minYear%', project.publicationYear.min);
  query = query.replace('%maxYear%', project.publicationYear.max);
  return query;
}

app.get('/projects/:projectId/query', function(req, res) {
  res.type("application/json");
  var project = projectsById[req.params.projectId];
  if (project) {
    var query = generateQuery(project);
    pubmedSearch.count(query).then(function(count) {
      res.send( { "string": query, "count": count });
    });
  } else {
    res.send(404, "Not found");
  }
});

app.post('/projects', function(req, res) {
  if (!req.user) {
    res.send(403, "Not authorized");
  } else if (!req.body || !req.body.title) {
    res.send(400, "Not valid");
  } else {
    var id = randomId(5);
    var user = req.user;
    var project = req.body;
    project.id = id;
    if (!user.projects) {
      user.projects = [];
    }
    projectsById[id] = project;
    user.projects.push( { id: id, title: project.title } );
    storage.setItem('projectsById', projectsById);
    storage.setItem('usersById', usersById);
    res.type("application/json");
    res.send(201, project);
  }
});

app.post('/projects/:projectId', function(req, res) {
  var projectId = req.params.projectId;
  if (!req.user) {
    res.send(403, "Not authorized: must be logged in");
    return;
  }
  
  if (!req.body || !req.body.title || projectId !== req.body.id) {
    res.send(400, "Not valid");
    return;
  }
  
  var userProject = _.find(req.user.projects, function(project) { return project.id === projectId });
  if (!userProject) {
    res.send(403, "Not authorized: must own the project");
    return;
  }

  projectsById[projectId] = req.body;
  userProject.title = req.body.title;
  storage.setItem('projectsById', projectsById);
  storage.setItem('usersById', usersById);
  res.type("application/json");
  res.send(201, projectsById[projectId]);
});

app.post('/projects/:projectId/screening', function(req, res) {
  var projectId = req.params.projectId;
  if (!req.user) {
    res.send(403, "Not authorized: must be logged in");
    return;
  }
  
  var userProject = _.find(req.user.projects, function(project) { return project.id === projectId });
  if (!userProject) {
    res.send(403, "Not authorized: must own the project");
    return;
  }

  var project = projectsById[projectId];
  var query = generateQuery(project);
  var search = new pubmedSearch.search(query, 100);
  var tsvWriter = new abstrackr.abstractTsvWriter('persist/' + project.id + '.abstracts.tsv');
  var ids = [];
  search.on('item', function(item) {
    var pmid = item.id.replace('http://pubmed.com/', '');
    tsvWriter.write(item);
    storage.setItem('pmid.' + pmid, item);
    ids.push(item.id);
  });
  search.on('end', function() {
    var screening = { "abstracts": ids };
    tsvWriter.end();
    storage.setItem(project.id + '.screening', screening);
    project.screening = { "href": "/projects/" + project.id + "/screening" };
    storage.setItem('projectsById', projectsById);
    res.send(201, screening);
  });
});

app.get('/projects/:projectId/screening', function(req, res) {
  if (!projectsById[req.params.projectId]) {
    res.send(404, "Not found");
    return;
  }
    
  var screening = storage.getItem(req.params.projectId + '.screening');
  if (screening) {
    res.type("application/json");
    res.send(200, screening);
  } else {
    res.send(404, "Not found");
  }
});

app.get('/projects/:projectId/abstracts.tsv', function(req, res) {
  if (!projectsById[req.params.projectId]) {
    res.send(404, "Not found");
    return;
  }
    
  var path = './persist/' + req.params.projectId + '.abstracts.tsv';
  fs.exists(path, function(exists) {
    if (exists) {
      res.type("text/tab-separated-values");
      fs.createReadStream(path).pipe(res);
    } else {
      res.send(404, "Not found");
    }
  });
});

app.listen(8080);

module.exports = app;
