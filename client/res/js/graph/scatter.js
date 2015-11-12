//  Begin...scatterDirFunction is a scatter diagram.
//  with or without markers
//  with or without lines
//  can't have *neither*. Can have both.
var scatterDirFunction = function(d3Svc, $window) {
  //  factory model.
  return {
    restrict : 'EA',
    scope    : {
      data: '=' // bi-directional data-binding
    },
    link     : function(scope, elt, attrs) {
      d3Svc.d3().then(function(d3) {
        var plotValue = attrs.plotValue || 'value'
        var margin = parseInt(attrs.margin) || 20
        var barHeight = parseInt(attrs.barHeight) || 20
        var barPadding = parseInt(attrs.barPadding) || 5

        console.log('we will plot '+plotValue)

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
              return d[plotValue]
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
                  return xScale(d[plotValue])
                })
                .attr('x', Math.round(margin/2))
                .attr('y', function(d,i) {
                  return Math.round(barPadding/2 + i * (barHeight + barPadding))
                })
                .attr('fill', function(d) {
                  return color(d[plotValue])
                })
          var fontHeight = Math.round(0.5*barHeight)
          svg.selectAll('g')
            .data(data)
            // update()
            .append('text')
              .attr('x', Math.round(margin))
              .attr('y', function(d,i) {
                var y = (barHeight+0.75*fontHeight+barPadding)/2 + i*(barHeight+barPadding)
                return Math.round(y)
              })
              .text(function(d) {return d.name+' ('+d[plotValue]+')'})
              .attr('font-family', 'sans-serif')
              .style('font-size', fontHeight+'px')
              .attr('fill', 'black')
        }
      })
    }
  } // close our directive factory
}
//  End.
