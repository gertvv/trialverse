'use strict';
define([], function() {
  var dependencies = ['$scope', '$stateParams', 'callback', '$modalInstance', 'ConceptService'];

  var CreateConceptController = function($scope, $stateParams, callback, $modalInstance, ConceptService) {
    $scope.concept = {};

    $scope.typeOptions = [{
      uri: 'http://trials.drugis.org/ontology#Drug',
      label: 'Drug'
    }, {
      uri: 'http://trials.drugis.org/ontology#Variable',
      label: 'Variable'
    }];

    $scope.createConcept = function() {
      return ConceptService.addItem($scope.concept).then(function() {
        callback();
        $modalInstance.close();
      });
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  };
  return dependencies.concat(CreateConceptController);
});
