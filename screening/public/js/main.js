var app = angular.module("screening", ['ui.router', 'ngResource']);

app.factory("Projects", function($resource) {
  return $resource('/projects/:projectId', { projectId: '@id' });
});

app.controller("ProjectCtrl", function($scope, project, $http) {
  $scope.project = project;
  $scope.messages = [];
  $scope.query = {};

  function init(project) {
    if (!project.exclusions) {
      project.exclusions = [];
    }
    if (!project.interventions) {
      project.interventions = [];
    }
    if (!project.outcomes) {
      project.outcomes = []
    }
    if (!project.publicationYear) {
      project.publicationYear = { min: 1981, max: 2014 };
    }
  }
  init(project);

  $scope.createOutcome = function(title) {
    project.outcomes.push(title);
    $scope.newOutcomeTitle = "";
  }

  $scope.createIntervention = function(title) {
    project.interventions.push(title);
    $scope.newInterventionTitle = "";
  }

  $scope.createExclusion = function(title) {
    project.exclusions.push(title);
    $scope.newExclusionTitle = "";
  }

  $scope.saveProject = function() {
    $scope.project.$save(function(project, responseHeaders) {
      $scope.messages.push({ "type": "success", "text": "Project saved", "date": Date.now() });
    }, function(httpResponse) {
      $scope.messages.push({ "type": "error", "text": "Error: " + httpResponse.status + ": " + httpResponse.data, "date": Date.now() });
    });
  }

  $scope.resetProject = function() {
    $scope.project.$get(function(project, responseHeaders) {
      init(project);
      $scope.messages.push({ "type": "success", "text": "Project reset", "date": Date.now() });
    }, function(httpResponse) {
      $scope.messages.push(httpResponse);
      $scope.messages.push({ "type": "error", "text": "Error: " + httpResponse.status + ": " + httpResponse.data, "date": Date.now() });
    });
  }

  $scope.testQuery = function() {
    $http({method: 'GET', url: '/projects/' + $scope.project.id + "/query"})
      .success(function(data) {
        $scope.query.string = data.string;
        $scope.query.count = data.count;
      })
      .error(function(error) {
        $scope.messages.push({ "type": "error", "text": error, "date": Date.now() });
      });
  }

  $scope.startScreening = function() {
    $http({method: 'POST', url: '/projects/' + $scope.project.id + "/screening"})
      .success(function(data) {
        $scope.messages.push({ "type": "success", "text": JSON.stringify(data), "date": Date.now() });
      })
      .error(function(error) {
        $scope.messages.push({ "type": "error", "text": error, "date": Date.now() });
      });
  }
});

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('');

  $stateProvider.state('root', {
    url: '',
    templateUrl: 'views/home.html',
    resolve: {
      user: function($q, $http) {
        var user = $q.defer();
        $http({method: 'GET', url: '/me'})
          .success(function(data) {
            user.resolve(data);
          })
          .error(function(error) {
            user.resolve(null);
          });
        return user.promise;
      }
    },
    controller: function($scope, $state, Projects, user) {
      $scope.user = user;

      $scope.goProject = function(id) {
        $state.go("root.project", { projectId: id });
      };

      $scope.createProject = function(title) {
        if (title) {
          Projects.save({ title: title }, function(project) {
            $scope.user.projects = Projects.query();
            $scope.goProject(project.id)
          });
        }
      };
    }
  });

  $stateProvider.state('root.project', {
    url: '/projects/:projectId',
    templateUrl: 'views/project.html',
    resolve: {
      project: function($stateParams, Projects) {
        return Projects.get($stateParams).$promise;
      }
    },
    controller: 'ProjectCtrl'
  })
});
