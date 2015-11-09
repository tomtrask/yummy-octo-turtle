//  Begin...totally different idea to turn d3 into an angular module.
//  From: http://www.ng-newsletter.com/posts/d3-on-angular.html
angular.module('d3', [])
  .factory('d3Svc', ['$document', '$q', '$rootScope',
    function($document, $q, $rootScope) {
      var d = $q.defer()

      console.log('here is that value for window.d3: '+window.d3)


      //  Aha...find d3 in the window scope and wrap it in this hyah jimmy hat.
      function onScriptLoad() {
        // Load client in the browser
        $rootScope.$apply(function() {
          d.resolve(window.d3)
        })
      }

      //  Ok, this is cute and all but really, we're loading d3.*.min.js already...
      // Create a script tag with d3 as the source
      // and call our onScriptLoad callback when it
      // has been loaded
      var scriptTag = $document[0].createElement('script')
      //  We don't need to set type
      //  scriptTag.type = 'text/javascript'
      scriptTag.async = true
      scriptTag.src = 'http://d3js.org/d3.v3.min.js'
      scriptTag.onreadystatechange = function () {
        if (this.readyState == 'complete') {
          onScriptLoad()
        }
      }
      scriptTag.onload = onScriptLoad

      var s = $document[0].getElementsByTagName('body')[0]
      s.appendChild(scriptTag)

      return {
        d3: function() {
          return d.promise
        }
      }
}])
//  End.