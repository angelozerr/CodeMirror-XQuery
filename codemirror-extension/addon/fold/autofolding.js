(function() {
  var GUTTER_ID = "CodeMirror-folding-markers";
  var GUTTER_COLLAPSED_CLASSNAME = "CodeMirror-folding-marker-collapsed";
  var GUTTER_EXPANDED_CLASSNAME = "CodeMirror-folding-marker-expanded";

  function FoldingState(cm, options, hasGutter) {
    this.marked = [];
    this.options = options;
    this.timeout = null;
    this.hasGutter = hasGutter;
    this.updateFolding = slowUpdateFolding;
    if (options.canStartFolding) this.updateFolding = fastUpdateFolding;
  }

  function parseRequiredOptions(options) {
    if (options instanceof Function) {
      return {
        rangeFinder : options
      };
    } else if (!options || !options.rangeFinder)
      throw new Error("Required option 'rangeFinder' missing (folding addon)");
    return options;
  }

  function parseOptions(options) {
    var newOptions = parseRequiredOptions(options);
    var widget = newOptions.widget;
    if (widget == null)
      widget = "...";
    if (typeof widget == "string") {
      var text = document.createTextNode(widget);
      widget = document.createElement("span");
      widget.appendChild(text);
      widget.className = "CodeMirror-folding-widget";
    }
    newOptions.widget = widget;
    return newOptions;
  }

  function expandFolding(cm, myRange) {
    var state = cm._foldingState;
    // clear the mark text range
    myRange.clear();
    // remove the mark text range from the marked list
    for ( var i = 0; i < state.marked.length; i++) {
      if (myRange == state.marked[i]) {
        state.marked.splice(i, 1);
        break;
      }
    }
    // change class name for the gutter to expanded
    if (myRange._gutterFolding) {
      myRange._gutterFolding.className = GUTTER_EXPANDED_CLASSNAME;
    }
    
  }
  
  function collapseFolding(cm, gutterNode) {
    var state = cm._foldingState;
    updateFoldingAt(cm, gutterNode._pos, true);
    gutterNode.className = GUTTER_COLLAPSED_CLASSNAME;
  }
  
  function makeMarker(cm, pos, myRange) {
    var collapsed = myRange != null;
    var node = document.createElement("div");
    node.className = GUTTER_EXPANDED_CLASSNAME;
    if (collapsed == true) node.className = GUTTER_COLLAPSED_CLASSNAME;
    node._pos = pos;
    CodeMirror.on(node, "mousedown", function() {
      if (node.className == GUTTER_COLLAPSED_CLASSNAME) {
        expandFolding(cm, myRange);
      } else {
        collapseFolding(cm, node);
      }
    });
    if (myRange) {
      myRange._gutterFolding = node;
    }
    return node;
  }

  function clearMarks(cm) {
    var state = cm._foldingState;
    if (state.hasGutter)
      cm.clearGutter(GUTTER_ID);
    for ( var i = 0; i < state.marked.length; ++i)
      state.marked[i].clear();
    state.marked.length = 0;
  }
  
  function onChange(cm, textChanged) {
    var state = cm._foldingState;
    clearTimeout(state.timeout);    
    state.timeout = setTimeout(function(){ state.updateFolding(cm, textChanged);}, state.options.delay || 500);
  }
  
  function makeFolding(cm, range, collapsed) {
    var state = cm._foldingState, widget = state.options.widget, hasGutter = state.hasGutter
    var myRange = null;
    if (collapsed) {
      // widget
      var myWidget = widget.cloneNode(true);
      CodeMirror.on(myWidget, "mousedown", function() {
        expandFolding(cm, myRange);
      });
      myRange = cm.markText(range.from, range.to, {
        replacedWith : myWidget,
        clearOnEnter : true
      });
      var state = cm._foldingState;
      state.marked.push(myRange);
    }
    // gutter
    if (hasGutter){
      var pos = range;
      if (range.from) pos = CodeMirror.Pos(range.from.line, 0);
      cm.setGutterMarker(pos.line, GUTTER_ID, makeMarker(cm, pos,
          myRange));      
    }
  }

  function updateFoldingAt(cm, pos, forceCollapsed) {
    var state = cm._foldingState, rangeFinder = state.options.rangeFinder;
    var range = rangeFinder(cm, pos);
    if (range) {
      var collapsed = range.collapsed == true;
      if (forceCollapsed != null)
        collapsed = forceCollapsed;
      makeFolding(cm, range, collapsed);
      return range.from.line + 1;
    } else {
      // remove folding gutter
      cm.setGutterMarker(pos.line, GUTTER_ID, null);      
    }
    return -1;
  }

  function updateFolding(cm, forceCollapsed) {    
    var index = 0, count = cm.lineCount(), pos = null;
    for ( var i = 0; i < count; i++) {
      pos = CodeMirror.Pos(i, 0);
      var result = updateFoldingAt(cm, pos, forceCollapsed);
      if (result != -1) {
        index = result;
      } else {
        index++;
      }
    }    
  }
  
  function slowUpdateFolding(cm, textChanged) {
    updateFolding(cm, false);
  }
  
  function fastUpdateFolding(cm, textChanged) {
    var state = cm._foldingState, rangeFinder = state.options.rangeFinder;
    var from = textChanged.from;
    var to = textChanged.to;
    var index = from.line, count = from.line + to.line, pos = null;
    if (count > cm.lineCount()) count = cm.lineCount(); 
    for ( var i = index; i < count; i++) {
      var lineText = cm.getLine(i);
      if (state.options.canStartFolding(lineText)) {
        makeFolding(cm, CodeMirror.Pos(i, 0), false);
      } else {
        // remove folding gutter
        cm.setGutterMarker(i, GUTTER_ID, null);      
      }
    }
  }
  
  /*function updateFoldingFromTextChanged(cm, textChanged) {
    var from = textChanged.from;
    var to = textChanged.to;
    var forceCollapsed = false;
    var index = from.line, count = from.line + to.line, pos = null;
    if (count > cm.lineCount()) count = cm.lineCount(); 
    for ( var i = index; i < count; i++) {
      pos = CodeMirror.Pos(i, 0);
      var result = updateFoldingAt(cm, pos, forceCollapsed);
      if (result != -1) {
        index = result;
      } else {
        index++;
      }
    }  
  }*/
  
  CodeMirror.foldCode = function(cm) {
    var state = cm._foldingState;
    if (!state) {
      throw new Error('editor cannot support code folding!');
    }
    clearMarks(cm);
    updateFolding(cm, null);
  }

  CodeMirror.foldingRangeFinder = function(finders) {

    // the interface for the folding API
    return {
      rangeFinder: function(cm, pos) {
        for ( var i = 0; i < finders.length; i++) {
          var finder = finders[i];
          var rangeFinder = finder.rangeFinder;
          if (rangeFinder) {
            var range = rangeFinder(cm, pos);
            if (range) {
              if (finder.collapsed) range.collapsed = finder.collapsed; 
              return range;
            }
          }
        }
        return null;
      },

      canStartFolding: function(lineText) {
        for ( var i = 0; i < finders.length; i++) {
          var finder = finders[i];
          var startFolding = finder.startFolding;
          if (startFolding) {
            if (lineText.indexOf(startFolding) != -1) {
              return true;
            }
          }
        }        
        return false;
      }
    };

  };
  
  CodeMirror.defineOption("foldingWith", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearMarks(cm);
      cm.off("change", onChange);
      delete cm._foldingState;
    }

    if (val) {
      var gutters = cm.getOption("gutters"), hasLintGutter = false;
      for ( var i = 0; i < gutters.length; ++i)
        if (gutters[i] == GUTTER_ID)
          hasLintGutter = true;
      var state = cm._foldingState = new FoldingState(cm, parseOptions(val),
          hasLintGutter);
      cm.on("change", onChange);
      if (state.options && state.options.doFoldingOnLoad != false) {
        CodeMirror.foldCode(cm);
      }
    }
  });
})();
