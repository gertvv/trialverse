'use strict';
define([],
  function() {
    var dependencies = ['$scope', '$stateParams', 'StudyResource', '$location', '$anchorScroll', '$modal', 'StudyService'];
    var StudyController = function($scope, $stateParams, StudyResource, $location, $anchorScroll, $modal, StudyService) {

      $scope.study = {};
      $scope.arms = {};
      $scope.categorySettings = {
        populationCharacteristics: {
          service: 'PopulationCharacteristicService',
          anchorId: 'populationCharacteristics',
          header: 'Population Characteristics',
          addItemController: 'CreatePopulationCharacteristicController',
          categoryEmptyMessage: 'No population characteristics defined.',
          itemName: 'Population Characteristic',
          itemTemplateUrl: 'app/js/populationCharacteristic/populationCharacteristic.html',
          addItemTemplateUrl: 'app/js/populationCharacteristic/addPopulationCharacteristic.html',
          editItemTemplateUrl: 'app/js/populationCharacteristic/editPopulationCharacteristic.html',
          editItemController: 'EditPopulationCharacteristicController',
        },
        arms: {
          service: 'ArmService',
          anchorId: 'arms',
          header: 'Arms',
          addItemController: 'CreateArmController',
          categoryEmptyMessage: 'No arms defined.',
          itemName: 'Arm',
          itemTemplateUrl: 'app/js/arm/arm.html',
          addItemTemplateUrl: 'app/js/arm/addArm.html',
          editItemTemplateUrl: 'app/js/arm/editArm.html',
          editItemController: 'EditArmController',
        },
        epochs: {
          service: 'EpochService',
          anchorId: 'epochs',
          header: 'Epochs',
          addItemController: 'CreateEpochController',
          categoryEmptyMessage: 'No epochs defined.',
          itemName: 'Epoch',
          itemTemplateUrl: 'app/js/epoch/epoch.html',
          addItemTemplateUrl: 'app/js/epoch/addEpoch.html',
          editItemTemplateUrl: 'app/js/epoch/editEpoch.html',
          editItemController: 'EditEpochController',
        }
      };

      function reloadStudyModel() {
        StudyService.resetStore();
        StudyResource.get($stateParams, function(response) {
          StudyService.
          loadStore(response.n3Data)
            .then(function(numberOfTriples) {
              console.log('loading study-store success, ' + numberOfTriples + ' triples loaded');
              StudyService.queryStudyData().then(function(studyQueryResult) {
                $scope.study = studyQueryResult;
              });
            }, function() {
              console.error('failed loading study-store');
            });
        });
      }

      // onload
      reloadStudyModel();

      $scope.isStudyModified = function() {
        return StudyService.isStudyModified();
      };

      $scope.sideNavClick = function(anchor) {
        var newHash = anchor;
        if ($location.hash() !== newHash) {
          $location.hash(anchor);
        } else {
          $anchorScroll();
        }
      };

      $scope.saveStudy = function() {
        StudyService.exportGraph().then(function(graph) {
          StudyResource.put({
            datasetUUID: $stateParams.datasetUUID,
            studyUUID: $stateParams.studyUUID
          }, graph, function() {
            console.log('graph saved');
            StudyService.studySaved();
          });
        });
      };
    };
    return dependencies.concat(StudyController);
  });