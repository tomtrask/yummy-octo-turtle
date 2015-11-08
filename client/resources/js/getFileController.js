var GetFileControllerFunction = function($scope, $window) {

  $scope.fileNameChanged = function(elt) {
    var fileName = elt.value;
    $scope.appModel.setHistoryFileName(fileName, function(err, res) {
      if (err) {
        $window.alert(err)
      }
    })
  }
};
