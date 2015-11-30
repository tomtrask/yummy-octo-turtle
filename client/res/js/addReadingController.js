var fs = require('fs');

AddReadingControllerFunction = function($scope, toolFactory) {
  var ONE_DAY = 86400000;
  $scope.newPedometer = 10000;
  var prevDate = function(date) {
    return new Date(date.getTime() - ONE_DAY);
  };
  var nextDate = function(date) {
    return new Date(date.getTime() + ONE_DAY);
  };
  $scope.newDate = prevDate(new Date());

  var dateMillis = function(d) {return d.getTime() % ONE_DAY;};

  if ($scope.history && $scope.history.length > 0) {
    var maxDate = dateMillis($scope.history[0].dateAsDate);
    for (var i = 1 ; i < $scope.history.length ; ++i) {
      if (dateMillis($scope.history[i].dateAsDate) > maxDate)
        maxDate = dateMillis($scope.history[i].dateAsDate);
    }
    $scope.newDate = new Date(maxDate+ONE_DAY);
  }

  $scope.stepsKeyUp = function(event) {
    if (event && event.keyCode === 13) {
      $scope.commit()
    }
  }

  $scope.commit = function() {
    var newElt = {dateAsDate:$scope.newDate, pedometer:$scope.newPedometer};
    var compareTime = newElt.dateAsDate.getTime();
    var added = false;
    for (var i = 0 ; i < $scope.history.length ; ++i) {
      var elt = $scope.history[i];
      if (elt.dateAsDate.getTime() < compareTime) {
        $scope.history.splice(i,0,newElt);
        added = true;
        break;
      }
    }
    if (!added) {
      $scope.history.push(newElt);
    }

    $scope.appModel.addAnnotationsAndSummary()
    //  roll date to next day
    $scope.newDate = prevDate($scope.newDate);
    $scope.appModel.writeHistoryFile(function(err,res) {
      if (!err) {
        $scope.appModel.generateGraph(function(err, name) {
          if (!err) {
            $scope.$apply()
          }
        })
      }
    })

  };

};
