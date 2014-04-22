var app = angular.module("screening", ['ui.router', 'ngResource']);

app.factory("Projects", function($resource) {
  return $resource('/projects/:projectId', { projectId: '@projectId' });
});

app.controller("ProjectCtrl", function($scope, project) {
  $scope.project = project;
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
