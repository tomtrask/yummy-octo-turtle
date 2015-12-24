//  Begin...scatterDirFunction is a scatter diagram.
//  with or without markers
//  with or without lines
//  can't have *neither*. Can have both.
//  Ok, naming scheme is that these class functions have init cap
var ScatterDirFunction = function(d3Svc, $window, $interval, $timeout) {
  //  factory model.
  //  Aha...we need that in this case because that there factory object gets deep
  var that = {
    restrict : 'EA',
    layout   : {
    },
    scope    : {
      config    : '=',
      xOrd      : '@xOrd',
      yOrd      : '@yOrd',
      data      : '=',
      width     : '@width'

    },
    //  we do drawData as a separate function because in some cases drawing the data
    //  is not available when the initial frame is drawn (other apps)
    drawData : function(scope) {
      console.log('here we are in drawData()')
      console.log('x-value will be '+scope.xOrd)
      console.log('y-value will be '+scope.yOrd)
      console.log('config will be '+JSON.stringify(scope.config))
      console.log('data: '+scope.data)
      //console.log('hey, what is the data? '+JSON.stringify(scope.data[0]))
      console.log('plotOrd: '+scope.plotOrd)

      for (var key in scope) {
        if (!key.match(/^\$/))
          console.log('key: '+key+' = '+typeof(scope[key]))
      }

      /*
      scope.$watch(function() {return scope.data}, function(a, b) {
        console.log('a (was): '+a);
        console.log('b ( is): '+b)
      })
      */

      scope.$watchCollection(function(){return scope.data}, function(newVal, oldVal) {
        if (newVal) {
          console.log('now we have data...I bet this fucker is good: '+JSON.stringify(scope.config))
          var now = (new Date()).getTime()
          var yearAgo = now - (366*86400)*1000

          var history = []
          newVal.forEach(function(d) {
            d.date = new Date(d.date)
          })
          history = newVal.filter(function(d) {
            return d.date.getTime() > yearAgo
          })

          //  play with rollup, mean, key...
          var averages = d3.nest()
            .key(function(d) {
              var date = new Date(d.date)
              return date.getMonth()
            })
          //  .sortKeys(d3.ascending)
            .rollup(function(d) {
              return d3.mean(d, function(g) { 
                return +g.pedometer
              })
            })
            .entries(history)
          // console.log('monthly averages: '+JSON.stringify(averages,{},4))

          // Cool...what's our average by part of week (weekday, weekend)?
          averages = d3.nest()
            .key(function(d) {
              var date = new Date(d.date)
              return date.getDay()
            })
            .sortKeys(d3.ascending)
            .rollup(function(d) {
              return d3.mean(d, function(g) { 
                return +g.pedometer
              })
            })
            .entries(history)

          // console.log('daily averages: '+JSON.stringify(averages, {}, 4))

          var grain = 5000
          console.log('yOrd: '+scope.yOrd)
          var ymax = d3.max(history, function(elt){return elt[scope.yOrd]})
          var cymax = Math.ceil(ymax/grain)*grain
          var ymin = d3.min(history, function(elt){return elt[scope.yOrd]})
          var fymin = Math.floor(ymin/grain)*grain

          console.log('max y: '+d3.max(history, function(elt){return elt[scope.yOrd]}))
          console.log('min y: '+d3.min(history, function(elt){return elt.pedometer}))

          that.layout.x.domain(d3.extent(history, function(elt){return elt.date}))
          // could do domain([minVal, maxVal])
          that.layout.y.domain([fymin, cymax])
          // that.layout.y.domain(d3.extent(history, function(elt){return elt.pedometer}))

          /*
          //  Line (closed path?!)
          that.layout.svg.append("path")
            .attr("class", "line")
            .attr("d", that.layout.valueline(history))
          */

          var addLine = function(pt1, pt2) {
            console.log('here we go')
            that.layout.svg.append("line")
              .attr("x1", pt1[0])
              .attr("y1", pt1[1])
              .attr("x2", pt2[0])
              .attr("y2", pt2[1])
              .style('stroke', 'blue')
          }


          // Add the scatterplot
          that.layout.svg.selectAll("dot")
            .data(history)
            .enter().append("circle")
              .attr("r", 2.5)
              .attr("cx", function(d) { return that.layout.x(d.date); })
              .attr("cy", function(d) { return that.layout.y(d.pedometer); })
              .attr('fill', 'none')
              .attr('stroke','#ff3c3c')

          addLine([0,25000], [500,20000])

          // Add the X Axis
          that.layout.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + that.layout.height + ")")
            .call(that.layout.xAxis)
      
          // Add the Y Axis
          that.layout.svg.append("g")
            .attr("class", "y axis")
            .call(that.layout.yAxis)
        }
      })
    },

    link     : function(scope, elt, attrs) {
      console.log('happy camper on my new scatter plot')
      console.log('hey, is that history thing done yet? '+that.scope.data)
      for (var key in scope) {
        if (!key.match(/^\$/)) {
          console.log('    '+key+': '+typeof(scope[key]))
        }
      }

      d3Svc.d3().then(function(d3) {
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 30, left: 50},
            width = 640 - margin.left - margin.right,
            height = 270 - margin.top - margin.bottom;
        that.layout.height = height
        that.layout.width = width

        for (var key in scope) {
          if (key === 'data') {
            console.log(key+': '+scope[key])
          }
        }
        console.log('data attr value: '+attrs.data)

        // Parse the date / time
        var parseDate = d3.time.format("%d-%b-%y").parse;

        // Set the ranges
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);

        that.layout.x = x
        that.layout.y = y

        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(5);
        that.layout.xAxis = xAxis

        var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);
        that.layout.yAxis = yAxis

        // Define the line
        //  Neat...we say what the line "is" before we even know the data
        var valueline = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.pedometer); });
        that.layout.valueline = valueline
    
        // Adds the svg canvas
        console.log('scope.width is '+scope.width)
        var svg = d3.select(elt[0])
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
        console.log('the graph has been configured')
        that.layout.svg = svg

        //////////////////////////////////////////////////////
        //  This used to be "get the data and draw it"
        //  Now it needs to be broken out into a separate function
        // Get the data
        console.log('scope.data: '+scope.data)
        that.drawData(scope)
      })
    }
  } // close our directive factory
  return that
}
//  End.
