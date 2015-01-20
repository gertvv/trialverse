'use strict';
define([],
  function() {
    var dependencies = ['$q', '$filter', 'StudyService', 'SparqlResource'];
    var MeasurementMomentService = function($q, $filter, StudyService, SparqlResource) {

      var measurementMomentQuery = SparqlResource.get('queryMeasurementMoment.sparql');
      var addItem = SparqlResource.get('addMeasurementMoment.sparql');

      function queryItems() {
        return measurementMomentQuery.then(function(query) {
          return StudyService.doNonModifyingQuery(query);
        });
      }

      function addItem(item) {
        return addMeasurementMomentQuery.then(function(query) {
          return StudyService.doNonModifyingQuery(query);
        });
      }

      function generateLabel(measurementMoment) {
        var offsetStr = (measurementMoment.offset === 'PT0H') ? 'At' : $filter('durationFilter')(measurementMoment.offset) + ' from';
        var anchorStr = measurementMoment.relativeToAnchor === '<http://trials.drugis.org/ontology#anchorEpochStart>' ?  'start' : 'end';
        return offsetStr + ' ' + anchorStr + ' of ' + measurementMoment.epoch.label;
      }

      return {
        queryItems: queryItems,
        addItem: addItem,
        generateLabel: generateLabel
      };
    };
    return dependencies.concat(MeasurementMomentService);
  });