//  Begin...Graph1DirFunction is the first graph we created.
var Graph1DirFunction = function(d3Svc, $window) {
  //  factory model.
  return {
    restrict : 'EA',
    scope    : {
        data: '=' // bi-directional data-binding
    },
    link     : function(scope, elt, attrs) {
      d3Svc.d3().then(function(d3) {
        var margin = parseInt(attrs.margin) || 20
        var barHeight = parseInt(attrs.barHeight) || 20
        var barPadding = parseInt(attrs.barPadding) || 5

        console.log('bar-height='+barHeight)

        var svg = d3.select(elt[0])
          .append('svg')
          .style('width', '100%')

        // Browser onresize event
        window.onresize = function() {
          scope.$apply();
        };

        // Watch for resize event
        scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.render(scope.data);
          }
        )

        scope.$watch('data', function(newVals, oldVals) {
          // So...we only need to do a full render if the bars change order.
          return scope.render(newVals)
        }, true)

        var renderBar = function(datum) {
        }

        scope.render = function(data) {
          // remove all previous items before render
          svg.selectAll('*').remove()

          // If we don't pass any data, return out of the element
          if (!data) {
            return
          }

          // setup variables
          var width = d3.select(elt[0]).node().offsetWidth - margin
          // calculate the height
          var height = scope.data.length * (barHeight + barPadding)
          // Use the category20() scale function for multicolor support
          var color = d3.scale.category20()
          // our xScale
          // Ok, now this is some pretty code...(props to whomever)
          var xScale = d3.scale.linear()
            .domain([0, d3.max(data, function(d) {
              return d.score
            })])
            .range([0, width])

          // set the height based on the calculations above
          svg.attr('height', height)

          //create the rectangles for the bar chart
          svg.selectAll('rect')
            .data(data).enter()
            .append('rect')
              .attr('height', barHeight)
              // .attr('width', 140)
              .attr('width', function(d){return xScale(d.score)})
              .attr('x', Math.round(margin/2))
              .attr('y', function(d,i) {
                return i * (barHeight + barPadding)
              })
              .attr('fill', function(d) { console.log('fill color: '+color(d.score));return color(d.score); })
              .forEach(function(a,i) {
                console.log(i+'here\'s the deal: '+a)
              })

          /*
          svg.selectAll('rect')
            .data(data).each()
              .append('text')
                .attr('x', Math.round(margin/2))
                .attr('y', function(d,i) { return i*(barHeight+barPadding)+20})
                .attr('font-family', 'sans-serif')
                .attr('font-size', '20px')
                .attr('fill', 'black')
          */
            /*
            .transition()
              .duration(1000)
              .attr('width', function(d) {
                return xScale(d.score)
              })
            */
            // our custom d3 code
        }
      })
    }
  } // close our directive factory
}
//  End.
