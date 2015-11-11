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

          var radius = Math.round(barHeight/2)
          //create the rectangles for the bar chart
          svg.selectAll('rect')
            .data(data)
            .enter()
            .append('g')
              .append('rect')
                .attr('height', barHeight)
                .attr('width', function(d) {
                  return xScale(d.score)
                })
                .attr('x', Math.round(margin/2))
                .attr('y', function(d,i) {
                  return Math.round(barPadding/2 + i * (barHeight + barPadding))
                })
                .attr('fill', function(d) {
                  return color(d.score)
                })
          var fontHeight = Math.round(0.5*barHeight)
          console.log('fontHeight is '+fontHeight)
          svg.selectAll('g')
            .data(data)
            // update()
            .append('text')
              .attr('x', Math.round(margin/2))
              .attr('y', function(d,i) {
                return Math.round((barHeight+0.75*fontHeight+barPadding)/2 + i*(barHeight+barPadding))
              })
              .text(function(d) {return d.name+' ('+d.score+')'})
              .attr('font-family', 'sans-serif')
              .style('font-size', fontHeight+'px')
              .attr('fill', 'black')

/*
          var labels = texts
              .attr('x', Math.round(margin/2))
              .attr('y', function(d,i) {
                return Math.round((barHeight)/2+i*(barHeight+barPadding))
              })
              .text(function(d) {return d.name+' ('+d.score+')'})
              .attr('font-family', 'sans-serif')
              .attr('font-size', fontHeight+'px')
              .attr('fill', 'black')
*/

          //  Ok....do one loop on all the rectangles, then add the rest to the group
          //  basically depth first on that group, then add everything to that g
          /*
          svg.selectAll('g')
            .data(data)
            // .update()
            .append('circle')
              .attr('cx', Math.round(margin/2+radius))
              .attr('cy', function(d,i) {
                return i*(barHeight+barPadding)
              })
              .attr('r', '20')
              .attr('fill', 'red')
           */


          /*
          svg.selectAll('rect')
            .data(data)
            .update()
            .append('text')
              .attr('x', Math.round(margin/2))
                .attr('y', function(d,i) {
                  var y = i*(barHeight+barPadding)+20
                  console.log('y='+y)
                  return y
                })
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
