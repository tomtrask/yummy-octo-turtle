var ToolFactoryFunction = function($rootScope) {

  //  We can read the file, we can crack it up into bite-sized
  //  pieces, but we can't put it in the scope or global name space
  privateReadHistoryFile = function(fileName, callback) {
    if (!callback || !(callback instanceof Function)) {
      return;
    }

    fs.readFile(fileName, 'utf-8', function(err, contents) {
      var allPedo = [];
      if (err) {
        callback(new Error("Cannot locate file "+fileName));
      } else {
        var lines = contents.split('\n');
        for (var i = 1 ; i < lines.length ; ++i) {
          var line = lines[i];
          var parts = line.split(',');
          if (parts.length == 2) {
            allPedo.push({
              date:parts[0],
              dateAsDate:new Date(parts[0]),
              pedometer:Number.parseInt(parts[1])
            });
          }
        }
        callback(null, allPedo)
      }
    });
  }


  var privateWriteHistoryFile = function(allPedo, fileName) {
    var block = "date,pedo\n";
    if (allPedo && allPedo.length > 0) {
      for (var i = 0 ; i < allPedo.length ; ++i) {
        var elt = allPedo[i];
        var d = elt.dateAsDate;
        if (elt && d) {
          block += (1+d.getMonth())+"/"+d.getDate()+"/"+(d.getYear()%100)+","+elt.pedometer+"\n"
        }
      }
    }
    fs.writeFile(fileName, block, function(res,err) {
      if (err) {
        console.log('Error writing pedometer file ('+fileName+'): '+err)
      } else {
        // console.log('wrote pedometer readings to '+fileName+': '+res)
      }
    })
  }
  

  var privateWriteStandardHistory = function(rootScope) {
    // console.log('we will write to '+rootScope.lastLoadedFile)
    privateWriteHistoryFile(rootScope.pedo, rootScope.lastLoadedFile)
  }

  var privateCreateOrderedRing = function(size) {
    var privateRingSize = size;
    var privateRing = [];
    var privateOrderedArray = [];
    var stats = {
      nextIndex:0,
      sumX:0,
      sumY:0,
      sumXY:0,
      sumXX:0,
      sumYY:0,
      n:0
    };

    var _insertSorted = function(value, orderedArray, lower, upper) {
      if (upper == lower) {
        //  insert before upper
        orderedArray.splice(upper,0,value);
      } else {
        var center = Math.floor((lower+upper)/2);
        if (value < orderedArray[center]) {
          _insertSorted(value, orderedArray, lower, center);
        } else {
          _insertSorted(value, orderedArray, center+1, upper);
        }
      }
    }

    var addInAscendingOrder = function(value, orderedArray) {
      // value will be placed after some index between [lower,upper]
      _insertSorted(value, orderedArray, 0, orderedArray.length);
    }

    var _find = function(value, orderedArray, lower, upper, depth) {
      if (upper == lower) {
        return (orderedArray[lower] == value) ? lower : -1;
      } else {
        var center = Math.floor((lower+upper)/2);
        if (value <= orderedArray[center]) {
          return _find(value, orderedArray, lower, center, depth+1);
        } else {
          return _find(value, orderedArray, center+1, upper, depth+1);
        }
      }
    }

    var find = function(value, orderedArray) {
      return _find(value, orderedArray, 0, orderedArray.length-1);
    }

    function OrderedRing() { }

    OrderedRing.prototype.getSize = function() {
      return privateOrderedArray.length;
    }

    OrderedRing.prototype.push = function(val) {
      privateRing.push(val);
      stats.sumY += val;
      stats.sumYY += val*val;
      stats.sumX += stats.nextIndex;
      addInAscendingOrder(val, privateOrderedArray);
      if (privateRing.length > privateRingSize) {
        var dropped = privateRing.shift();
        stats.sumY -= dropped;
        stats.sumYY -= dropped*dropped;
        var xDrop = (stats.nextIndex - privateRingSize);
        stats.sumX -= xDrop;
        stats.sumXY -= xDrop * dropped;
        var index = find(dropped,privateOrderedArray);
        if (index >= 0) {
          privateOrderedArray.splice(index,1);
        }
      } else {
        stats.n = privateRing.length;
      }
      ++stats.nextIndex;
      // console.log("after push:\ntime order: "+privateRing+"\nvalue order: "+privateOrderedArray);
    }

    //  rank is numbered from highest, being 1.
    //  zero rank will be median (I declare)
    //  rank from bottom denoted by negative rank (so -1 is lowest, 1 highest)
    //  returns null when rank*2 > privateOrderedArray.length (not enough samples)
    OrderedRing.prototype.getByRank = function(rank) {
      var uRank = rank < 0 ? -rank : rank
      if (uRank*2 > privateOrderedArray.length || rank === 0 && privateOrderedArray.length === 0) {
        return null
      } else if (uRank === 0) {
        return privateOrderedArray[Math.floor(privateOrderedArray.length/2)]
      } else {
        if (rank < 0) {
          return privateOrderedArray[-(rank+1)]
        } else {
          return privateOrderedArray[privateOrderedArray.length-rank]
        }
      }
    }

    OrderedRing.prototype.getDescriptiveStats = function() {
      var result = JSON.parse(JSON.stringify(stats))
      if (result.n > 0) {
        result.average = privateRing.length > 0 ? result.sumY / result.n: null
        if (result.n > 1) {
          result.stdDev = Math.sqrt((result.sumYY-result.sumY*result.sumY/result.n)/(result.n-1))
        }
      }

      return result
    }

    return new OrderedRing();
  }


  var privateAddAnnotations = function(history) {
    var ring = [];
    var total = 0;
    var all = [];
    var oneYear = privateCreateOrderedRing(365);
    for (var i = history.length - 1 ; i >= 0 ; --i) {
      var dateRec = history[i];
      var reading = dateRec.pedometer;
      ring.push(dateRec.pedometer);
      oneYear.push(dateRec.pedometer);
      all.push(dateRec.pedometer);
      total += dateRec.pedometer;
      if (ring.length > 365) {
        var remove = ring.shift();
        total -= remove;
      }
      var average = Math.round(total / ring.length);
      dateRec.average = average;

      all.sort();
      var onceAWeekIndex = Math.floor(all.length / 7);
      var weekian = all[onceAWeekIndex];
      dateRec.weekian = weekian;
      var interesting = Math.ceil(oneYear.getSize()/7);
      var weeksInSample = Math.ceil(oneYear.getSize()/7);
      var monthsInSample = Math.ceil(oneYear.getSize()*12/365.25);
      dateRec.median = oneYear.getByRank(0);
      dateRec.weeklyRange = {
        lower:oneYear.getByRank(-weeksInSample),
        upper:oneYear.getByRank(weeksInSample)
      };
      dateRec.monthlyRange = {
        lower:oneYear.getByRank(-monthsInSample),
        upper:oneYear.getByRank(monthsInSample)
      };
    }

    return oneYear
  }

 
  var privateRunScript = function(name,args,onCompletion) {
     var fs = require('fs')
     var spawn = require('child_process').spawn
     var logFileName = './out.log'
     //  always delete old log file.
     if (fs.existsSync(logFileName)) {
       fs.unlinkSync(logFileName)
     }

     var out = fs.openSync(logFileName, 'a')
     var err = fs.openSync(logFileName, 'a')
     var io = [ 'ignore', out, err ]
     //  detached:true is another option
     var options = {
       stdio:io
     }

     var child = spawn(name, args||[], options)

     if (onCompletion && onCompletion instanceof Function) {
       // console.log('setting up callback on script '+name+' completion: '+onCompletion)
       child.on('exit', onCompletion)
     }

     child.unref();
  }


  //  is it ugly?  maybe.  But it gets rid of the files.
  var deleteOldFiles = function(reRoot, folderName) {
    fs.readdir(folderName, function(err,files) {
      if (!err) {
        files.forEach(function(file,idx){
          if (file.match(reRoot)) {
            stat = fs.statSync(folderName+'/'+file)
            if (stat.isFile()) {
              fs.unlinkSync(folderName+'/'+file)
            }
          }
        })
      }
    })
  }

  var privateRegenerateGraph = function(historyFileName, onCompletion) {
    deleteOldFiles(/pedometerByDate-/, 'images')
    var name = 'pedometerByDate-'+(new Date()).getTime()+'.png'
    var args = ['-w', '680', '-d', historyFileName, '-n', name]
    privateRunScript('scripts/play.r', args, function(err, res) {
      if (err) {
        console.log('ERROR generating graph:  '+err+' (that is probably an exit code)')
        onCompletion(new Error('process exited with code='+err+', status='+res))
      } else {
        onCompletion(null, name);
      }
    })
    if (localStorage.lastGraphName)
      delete localStorage.lastGraphName
  }

  //  This is because we're a factory...maybe service is a better choice
  //  I think services look cleaner but I'm thinking services are essentially
  //  singletons (i.e. that is the definition of service...obviously the im-
  //  plementation of the two classes is different).
  return {
    addAnnotations:privateAddAnnotations,
    createOrderedRing:privateCreateOrderedRing,
    readHistoryFile:privateReadHistoryFile,
    writeStandardHistory:privateWriteStandardHistory,
    regenerateGraph:privateRegenerateGraph
  }
}
