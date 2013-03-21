(function() {
  
  function XQueryCommentFinder(cm, start) {
    return CodeMirror.commentRangeFinder(cm, start, "(:", ":)");
  }
  
  var xqueryFoldingConfig = [];
  xqueryFoldingConfig.push({rangeFinder: XQueryCommentFinder, collapsed: true, startFolding: "(:"});
  xqueryFoldingConfig.push({rangeFinder: CodeMirror.braceRangeFinder, startFolding: "{"});
  xqueryFoldingConfig.push({rangeFinder: CodeMirror.tagRangeFinder, startFolding: "<"});
   
  CodeMirror.xqueryFolding = new CodeMirror.foldingRangeFinder(xqueryFoldingConfig);

})();