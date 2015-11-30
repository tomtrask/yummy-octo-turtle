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
      xValue    : '@',
      yValue    : '@',
      data      : '='
    },
    //  we do drawData as a separate function because in some cases drawing the data
    //  is not available when the initial frame is drawn (other apps)
    drawData : function(scope) {
      console.log('here we are in drawData()')
      console.log('x-value will be '+scope.xValue)
      console.log('y-value will be '+scope.yValue)
      console.log('data: '+scope.data)
      //console.log('hey, what is the data? '+JSON.stringify(scope.data[0]))
      console.log('plotValue: '+scope.plotValue)

      for (var key in scope) {
        if (!key.match(/^\$/))
          console.log('key: '+key)
      }

      /*
      scope.$watch(function() {return scope.data}, function(a, b) {
        console.log('a (was): '+a);
        console.log('b ( is): '+b)
      })
      */

      scope.$watchCollection(function(){return scope.data}, function(newVal, oldVal) {
        if (newVal) {
          var now = (new Date()).getTime()
          var yearAgo = now - (366*86400)*1000

          var history = []
          newVal.forEach(function(d) {
            d.date = new Date(d.date)
            if (d.date.getTime() > yearAgo) {
              history.push(d)
            }
          })

          var grain = 5000
          console.log('yValue: '+scope.yValue)
          var ymax = d3.max(history, function(elt){return elt[scope.yValue]})
          var cymax = Math.ceil(ymax/grain)*grain
          var ymin = d3.min(history, function(elt){return elt[scope.yValue]})
          var fymin = Math.floor(ymin/grain)*grain

          console.log('max y: '+d3.max(history, function(elt){return elt[scope.yValue]}))
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

          // Add the scatterplot
          that.layout.svg.selectAll("dot")
            .data(history)
            .enter().append("circle")
              .attr("r", 3.5)
              .attr("cx", function(d) { return that.layout.x(d.date); })
              .attr("cy", function(d) { return that.layout.y(d.pedometer); })
              .attr('fill', 'none')
              .attr('stroke','#f00')

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
        console.log('I think the element we will fill is '+elt[0])

        console.log('there are '+elt.length+' elements')
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
          /*
        d3.csv("data.csv", function(error, data) {
          if (error) {
            console.error('error in fetching data.csv: '+error)
            return
          } else {
            console.log('this is the data: '+JSON.stringify(data))
          }

          data.forEach(function(d) {
            d.date = parseDate(d.date);
            d.close = +d.close;
          });

          // Scale the range of the data
          x.domain(d3.extent(data, function(d) { return d.date; }));
          y.domain([0, d3.max(data, function(d) { return d.close; })]);

          // Add the valueline path.
          svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(data));

          // Add the scatterplot
          svg.selectAll("dot")
            .data(data)
            .enter().append("circle")
              .attr("r", 3.5)
              .attr("cx", function(d) { return x(d.date); })
              .attr("cy", function(d) { return y(d.close); });

            // Add the X Axis
            svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);
      
            // Add the Y Axis
            svg.append("g")
              .attr("class", "y axis")
              .call(yAxis);
          that.derga(scope)

        })
          */
      })
    }
  } // close our directive factory
  return that
}
//  End.
