var everyauth = require('everyauth');
var conf = require('./conf')
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session');

var usersById = {};
var projectsById = {};

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
    return usersById[googleUser.id] || (usersById[googleUser.id] = googleUser);
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

app.get("/projects/:projectId", function(req, res) {
  res.type("application/json");
  var project = projectsById[req.params.projectId];
  if (project) {
    res.send(project);
  } else {
    res.send(404, "Not found");
  }
});

app.get('/projects', function(req, res) {
  res.type("application/json");
  if (!req.user) {
    res.send({});
  } else {
    res.send(req.user.projects);
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
    res.type("application/json");
    res.send(201, project);
  }
});

app.listen(8080);

module.exports = app;
