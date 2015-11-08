MainControllerFunction = function($scope, toolFactory, $document, $window) {
  $scope.askingAbout = 10000
  $scope.frequencyDescription = 'n/a'

  var tell = function(count,total,partialDescr, steps) {
    var result = []
    var frac = count/total
    var breakPoint = 1/30  // one day a month or 31 days between events
    var denoms = [
      {denom:7, label:'week'},
      {denom:30, label:'month'},
      {denom:365, label:'year'}
    ]

    var otherWord = {fewer:'lower',more:'higher'}
    result.push((frac*100).toFixed(2)+'% of days you walk '+partialDescr+' than '+steps+' steps.')
    var daysToRepeat = Math.round(1/frac)
    result.push('You achieve that level or '+otherWord[partialDescr]+' every '+daysToRepeat+' days.')

    for (denomIndex in denoms) {
      var denom = denoms[denomIndex]
      var tryNum = Math.floor(denom.denom * frac)
      if (tryNum > 0)
        result.push(tryNum+' days per '+denom.label)
    }
    return result
  }

  $scope.describeFrequency = function() {
    var pedos = $scope.pedo
    if (pedos) {
      var steps = $scope.askingAbout
      $scope.frequencyDescription = 'I really can\'t say'
      var higherCount = 0
      var lowerCount = 0
      var total = pedos.length
      for (var i in pedos) {
        var pedo = pedos[i]
        if (pedo.pedometer > steps)
          ++higherCount
        else if (pedo.pedometer < steps)
          ++lowerCount
      }
      var describe = "I go more or less than that exactly half the time"
      if (lowerCount < higherCount) {
        describe = tell(lowerCount, total, 'fewer',steps)
      } else if (higherCount < lowerCount) {
        describe = tell(higherCount, total, 'more',steps)
      }
      $scope.frequencyDescriptions = describe
    }
  }


  $scope.doDeleteRow = function(row) {
    var elt = $scope.history[row]
    if (elt) {
      if ($window.confirm('do you really want to delete '+elt.date)) {
        $scope.history.splice(row,1)
        $scope.appModel.writeHistoryFile(function(err,res) {
          // It kind of shouldn't be our responsibility to do this...again
          // refer to the comment in app.js about calling $apply() from
          // that module.
          if (!err) {
            $scope.appModel.generateGraph(function(err,res){
              $scope.$apply()
            })
          }
        })
      }
    }
  }

  $scope.setLastLoadedFileName = function(fileName) {
    $scope.lastLoadedFile = fileName;
    $scope.settings.source = fileName;
    $scope.saveFileName(fileName);
    $scope.$apply();
  }


}
