'use strict';
define(
  ['angular',
    'require',
    'jQuery',
    'foundation',
    'mmfoundation',
    'angular-ui-router',
    'dataset/dataset',
    'util/util',
    'study/study',
    'graph/graph',
    'arm/arm',
    'outcome/outcome',
    'populationCharacteristic/populationCharacteristic',
    'endpoint/endpoint',
    'adverseEvent/adverseEvent',
    'epoch/epoch',
    'results/results',
    'measurementMoment/measurementMoment',
    'activity/activity',
    'studyDesign/studyDesign',
    'concept/concept',
    'commit/commit',
    'mapping/mapping',
    'angular-resource',
    'rdfstore',
    'lodash'
  ],
  function(angular) {
    var dependencies = [
      'ui.router',
      'mm.foundation.modal',
      'mm.foundation.typeahead',
      'trialverse.dataset',
      'trialverse.util',
      'trialverse.graph',
      'trialverse.study',
      'trialverse.arm',
      'trialverse.outcome',
      'trialverse.populationCharacteristic',
      'trialverse.endpoint',
      'trialverse.adverseEvent',
      'trialverse.epoch',
      'trialverse.measurementMoment',
      'trialverse.studyDesign',
      'trialverse.activity',
      'trialverse.results',
      'trialverse.concept',
      'trialverse.commit',
      'trialverse.mapping'
    ];


    Number.isInteger = Number.isInteger || function(value) {
      return typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value;
    };

    var app = angular.module('trialverse', dependencies);

    app.run(['$rootScope', '$window', '$http',
      function($rootScope, $window, $http) {
        var csrfToken = $window.config._csrf_token;
        var csrfHeader = $window.config._csrf_header;

        $http.defaults.headers.common[csrfHeader] = csrfToken;
        $rootScope.$on('$viewContentLoaded', function() {
          $(document).foundation();
        });
      }
    ]);

    app.constant('SCRATCH_RDF_STORE_URL', '/scratch');
    app.constant('CONCEPT_GRAPH_UUID', 'concepts');

    app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider',
      function($stateProvider, $urlRouterProvider, $httpProvider) {
        $httpProvider.interceptors.push('SessionExpiredInterceptor');

        $stateProvider
          .state('datasets', {
            url: '/datasets',
            templateUrl: 'app/js/dataset/datasets.html',
            controller: 'DatasetsController'
          })
          .state('create-dataset', {
            url: '/create-dataset',
            templateUrl: 'app/js/dataset/createDataset.html',
            controller: 'CreateDatasetController'
          })
          .state('versionedDataset', {
            url: '/datasets/:datasetUUID/versions/:versionUuid',
            templateUrl: 'app/js/dataset/dataset.html',
            controller: 'DatasetController'
          })
          .state('datasetHistory', {
            url: '/datasets/:datasetUUID/history',
            templateUrl: 'app/js/dataset/datasetHistory.html',
            controller: 'DatasetHistoryController'
          })
          .state('versionedDataset.concepts', {
            url: '/concepts',
            templateUrl: 'app/js/concept/concepts.html',
            controller: 'ConceptController'
          })
          .state('versionedDataset.study', {
            url: '/studies/:studyGraphUuid',
            templateUrl: 'app/js/study/view/study.html',
            controller: 'StudyController'
          });

        // Default route
        $urlRouterProvider.otherwise('/datasets');
      }
    ]);

    return app;
  });
