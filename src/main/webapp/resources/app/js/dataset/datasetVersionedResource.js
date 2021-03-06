'use strict';
define([], function() {

  var dependencies = ['$resource'];
  var DatasetVersionedResource = function($resource) {
    return $resource('/users/:userUid/datasets/:datasetUUID/versions/:versionUuid', {
      userUid: '@userUid',
      datasetUUID: '@datasetUUID',
      versionUuid: '@versionUuid'
    }, {
      'get': {
        method: 'get',
        headers: {
          'Accept': 'text/turtle'
        },
        transformResponse: function(data) {
          return {
            data: data // property on Responce object to access raw result data
          };
        }
      },
      'query': {
        method: 'GET',
        headers: {
          'Accept': 'text/turtle'
        },
        isArray: false,
        transformResponse: function(data) {
          return {
            data: data // property on Responce object to access raw result data
          };
        },
      }
    });
  };
  return dependencies.concat(DatasetVersionedResource);
});