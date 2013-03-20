CodeMirror.xqueryFolding = new function() {

  // the interface for the folding API
  return {
    rangeFinder: function(cm, pos) {
      // comments folding
      var range = CodeMirror.commentRangeFinder(cm, pos, '(:', ':)');
      if (range) {
        range.collapsed = true;
        return range;
      }
      // brackets folding
      var range = CodeMirror.braceRangeFinder(cm, pos);
      if (range) {
        range.collapsed = false;
        return range;
      }
      // xml tags folding
      var range = CodeMirror.tagRangeFinder(cm, pos);
      if (range) {
        range.collapsed = false;
        return range;
      }      
      return range;
    },

    getStartRange: function(lineText) {
      
      return false;
    }
  };

};