var myModule = angular.module('rootModule', [])
    .constant('HISTORY_FILE', 'history.csv')
    .controller("mainController", MainControllerFunction)
    .controller("getFileController", GetFileControllerFunction)
    .controller("addReadingController", AddReadingControllerFunction)
    .controller('graphCtrl', GraphCtrlFunction)
    .service('graphSvc', GraphToolFunction)
    .factory('toolFactory', ToolFactoryFunction)


//  I'm very much adding the guts of this function at the end of development.
//  Seems like we need to have some central repository of application state.
//  That state can contain scalar details but not extensive details (it can
//  contain the name of the file but not the contents of the history file).
//  I believe this will supercede settings.json and any other details we store
//  in localStorage.
//  4/20 - I think this module manages state while tools do fancy stuff with data
//  and file I/O and parsing.
myModule.run(function($rootScope, $window, toolFactory, HISTORY_FILE) {
  var fs = require('fs')
  var path = require('path')

  var appStateName = 'rumpelstiltskin'
  var historyFileName = HISTORY_FILE
  var appState = {
    historyFileName : HISTORY_FILE
  }

  var saveAppState = function() {
    localStorage[appStateName] = JSON.stringify(appState)
  }

  //  The functions marked private will be exposed through the $scope.appModel object
  //  add derived data to history[]
  var privateAddAnnotationsAndSummary = function() {
    var ringBuffer = toolFactory.addAnnotations($rootScope.history)
    $rootScope.describe = ringBuffer.getDescriptiveStats();
  }

  //  create a graph, callback gets an error object or the name of the file
  //  This function will also clean up the images directory
  var privateGenerateGraph = function(callback) {
    //  This switch is just easier to do in javascript than [R]
    var p = path.parse(appState.historyFileName)
    var useHistoryFileName = appState.historyFileName
    if (!path.isAbsolute(useHistoryFileName)) {
      useHistoryFileName = '../'+useHistoryFileName
    }

    toolFactory.regenerateGraph(useHistoryFileName, function(err, name) {
      appState.graphName = name
      saveAppState()
      if (callback && callback instanceof Function) {
        callback(err, name)
      }
    })
  }

  //  Read the history file and put details into $rootScope.history etc.
  var privateReadHistoryFile = function(historyFileName, callback) {
    toolFactory.readHistoryFile(historyFileName, function(err,res) {
      if (err === null) {
        $rootScope.history = res
      } else {
        $rootScope.history = []
        //  we try not to write empty history files so this is a reasonable response.
        $window.alert('the history file ('+appState.historyFileName+') seems to be empty')
      }
      privateAddAnnotationsAndSummary()
      if (callback && callback instanceof Function) {
        callback(err,res)
      }
      //  I'm skeptical of firing a UI event in the app code.
      $rootScope.$apply()
    })
  }


  //  Write the contents of $rootScope.history back to appState.historyFileName.
  var privateWriteHistoryFile = function(callback) {
    var history = $rootScope.history
    var fileName = appState.historyFileName

    var block = "date,pedo\n";
    if (history && history.length > 0) {
      for (var i = 0 ; i < history.length ; ++i) {
        var elt = history[i];
        var d = elt.dateAsDate;
        if (elt && d) {
          block += (1+d.getMonth())+"/"+d.getDate()+"/"+(d.getYear()%100)+","+elt.pedometer+"\n"
        }
      }
    }
    //  we could wrap this callback but there's nothing we can really add.
    fs.writeFile(fileName, block, callback)
  }


  //  Set the name of the history file.
  var privateSetHistoryFileName = function(name) {
    privateReadHistoryFile(name, function(err,res){
      if (!err) {
        appState.historyFileName = name
        saveAppState()
      }
    })
  }

  // There's no real reason to save the name of our history file in localStorage
  if (localStorage[appStateName]) {
    appState = JSON.parse(localStorage[appStateName])
  } else {
    appState = {}
    saveAppState()
  }
  // It is pointless to save the name of the history file
  appState.historyFileName = HISTORY_FILE

  // load or create&load history file
  fs.exists(appState.historyFileName, function(res,err) {
    if (err) {
      $rootScope.history = []
    } else {
      privateReadHistoryFile(appState.historyFileName)
    }
  })

  // was $rootScope.appState
  $rootScope.appModel = {
    addAnnotationsAndSummary:privateAddAnnotationsAndSummary,
    generateGraph:privateGenerateGraph,
    getGraphName:function(){return appState.graphName},
    getHistoryFileName:function() {return appState.historyFileName },
    readHistoryFile:privateReadHistoryFile,
    setHistoryFileName:privateSetHistoryFileName,
    writeHistoryFile:privateWriteHistoryFile
  }
})
