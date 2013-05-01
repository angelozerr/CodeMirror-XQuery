CodeMirror.tarckVars = (function() {

  function XQTrackVarsState(cm, options) {
    this.options = options;
    this.timeout = null;
  }

  function parseOptions(options) {
    if (options instanceof Function)
      return {
        trackVars : options
      };
    else if (!options || !options.trackVars)
      throw new Error("Required option 'trackVars' missing (track-vars addon)");
    return options;
  }

  function onChange(cm) {
    var state = cm._xqTrackVarsState;
    clearTimeout(state.timeout);
    state.timeout = setTimeout(function() {
      startXQTrackVars(cm);
    }, state.options.delay || 500);
  }

  function hasVarsChanged(cm, globalVars) {
    var state = cm._xqTrackVarsState;
    var lastVars = state.lastVars;
    if (lastVars) {
      if (lastVars.length != globalVars.length)
        return true;
      for ( var i = 0; i < lastVars.length; i++) {
        if (lastVars[i] != globalVars[i])
          return true;
      }
      return false;
    }
    return true;
  }

  function getVars(globalVars) {
    var vars = [];    
    while (globalVars) {
      var varDecl = globalVars.varDecl;
      vars.unshift(varDecl.dataType);
      vars.unshift(varDecl.name);
      globalVars = globalVars.next;
    }
    return vars;
  }

  function startXQTrackVars(cm) {
    var lineCount = cm.lineCount();
    var token = cm.getTokenAt(CodeMirror.Pos(lineCount, cm
        .getLine(lineCount - 1).length));
    if (token.state) {
      var state = cm._xqTrackVarsState;
      var globalVars = getVars(token.state.globalVars);
      var changed = hasVarsChanged(cm, globalVars);
      state.options.trackVars(globalVars, changed);
      state.lastVars = globalVars; 
    }
  }

  CodeMirror.defineOption("trackVars", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearMarks(cm);
      cm.off("change", onChange);
      delete cm._xqTrackVarsState;
    }

    if (val) {
      cm._xqTrackVarsState = new XQTrackVarsState(cm, parseOptions(val));
      cm.on("change", onChange);
      startXQTrackVars(cm);
    }
  });
})();
