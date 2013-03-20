(function() {
  var GUTTER_ID = "CodeMirror-folding-markers";
  var GUTTER_COLLAPSED_CLASSNAME = "CodeMirror-folding-marker-collapsed";
  var GUTTER_EXPANDED_CLASSNAME = "CodeMirror-folding-marker-expanded";

  // function showTooltip(e, content) {
  // var tt = document.createElement("div");
  // tt.className = "CodeMirror-lint-tooltip";
  // tt.appendChild(content.cloneNode(true));
  // document.body.appendChild(tt);
  //
  // function position(e) {
  // if (!tt.parentNode) return CodeMirror.off(document, "mousemove", position);
  // tt.style.top = (e.clientY - tt.offsetHeight - 5) + "px";
  // tt.style.left = (e.clientX + 5) + "px";
  // }
  // CodeMirror.on(document, "mousemove", position);
  // position(e);
  // tt.style.opacity = 1;
  // return tt;
  // }
  // function rm(elt) {
  // if (elt.parentNode) elt.parentNode.removeChild(elt);
  // }
  // function hideTooltip(tt) {
  // if (!tt.parentNode) return;
  // if (tt.style.opacity == null) rm(tt);
  // tt.style.opacity = 0;
  // setTimeout(function() { rm(tt); }, 600);
  // }
  //

  function FoldingState(cm, options, hasGutter) {
    this.marked = [];
    this.options = options;
    this.timeout = null;
    this.hasGutter = hasGutter;
    this.maybeStartFolding = [];
    // this.onMouseOver = function(e) { onMouseOver(cm, e); };
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

  function makeMarker(cm, pos, myRange) {
    var collapsed = myRange != null;
    var node = document.createElement("div");
    node.className = GUTTER_EXPANDED_CLASSNAME;
    if (collapsed == true)
      node.className = GUTTER_COLLAPSED_CLASSNAME;
    // node.innerHTML = isTop ? "\u25bc" : "\u25b2";
    // if (!isFinished) node.style.color = "red";
    // node.style.fontSize = "85%";
    // node.style.cursor = "pointer";
    // if (handler) CodeMirror.on(node, "mousedown", handler);
    CodeMirror.on(node, "mousedown", function() {
      if (node.className == GUTTER_COLLAPSED_CLASSNAME) {
        expandFolding(cm, myRange);
      } else {
        var state = cm._foldingState;
        updatePosFolding(cm, pos, true);
        node.className = GUTTER_COLLAPSED_CLASSNAME;
      }
    });
    if (myRange) {
      myRange._gutterFolding = node;
    }
    // CodeMirror.on(node, "mouseout", function() { if (tooltip)
    // hideTooltip(tooltip); });
    return node;
  }

  function expandFolding(cm, myRange) {
    myRange.clear();
    if (myRange._gutterFolding) {
      myRange._gutterFolding.className = GUTTER_EXPANDED_CLASSNAME;
    }
    var state = cm._foldingState;
    for ( var i = 0; i < state.marked.length; i++) {
      if (myRange == state.marked[i]) {
        state.marked.splice(i, 1);
        break;
      }
    }
  }

  //
  function clearMarks(cm) {
    var state = cm._foldingState;
    if (state.hasGutter)
      cm.clearGutter(GUTTER_ID);
    for ( var i = 0; i < state.marked.length; ++i)
      state.marked[i].clear();
    state.marked.length = 0;
  }
  //
  // function makeMarker(labels, severity, multiple) {
  // var marker = document.createElement("div"), inner = marker;
  // marker.className = "CodeMirror-lint-marker-" + severity;
  // if (multiple) {
  // inner = marker.appendChild(document.createElement("div"));
  // inner.className = "CodeMirror-lint-marker-multiple";
  // }
  //
  // var tooltip;
  // CodeMirror.on(inner, "mouseover", function(e) { tooltip = showTooltip(e,
  // labels); });
  // CodeMirror.on(inner, "mouseout", function() { if (tooltip)
  // hideTooltip(tooltip); });
  //
  // return marker;
  // }
  //
  // function getMaxSeverity(a, b) {
  // if (a == "error") return a;
  // else return b;
  // }
  //
  // function groupByLine(annotations) {
  // var lines = [];
  // for (var i = 0; i < annotations.length; ++i) {
  // var ann = annotations[i], line = ann.from.line;
  // (lines[line] || (lines[line] = [])).push(ann);
  // }
  // return lines;
  // }
  //
  // function annotationTooltip(ann) {
  // var severity = ann.severity;
  // if (!SEVERITIES.test(severity)) severity = "error";
  // var tip = document.createElement("div");
  // tip.className = "CodeMirror-lint-message-" + severity;
  // tip.appendChild(document.createTextNode(ann.message));
  // return tip;
  // }
  //
  // function startLinting(cm) {
  // var state = cm._foldingState, options = state.options;
  // if (options.async)
  // options.getAnnotations(cm, updateLinting, options);
  // else
  // updateLinting(cm, options.getAnnotations(cm.getValue()));
  // }
  //  
  // function updateLinting(cm, annotationsNotSorted) {
  // clearMarks(cm);
  // var state = cm._foldingState, options = state.options;
  //
  // var annotations = groupByLine(annotationsNotSorted);
  //
  // for (var line = 0; line < annotations.length; ++line) {
  // var anns = annotations[line];
  // if (!anns) continue;
  //
  // var maxSeverity = null;
  // var tipLabel = state.hasGutter && document.createDocumentFragment();
  //
  // for (var i = 0; i < anns.length; ++i) {
  // var ann = anns[i];
  // var severity = ann.severity;
  // if (!SEVERITIES.test(severity)) severity = "error";
  // maxSeverity = getMaxSeverity(maxSeverity, severity);
  //
  // if (options.formatAnnotation) ann = options.formatAnnotation(ann);
  // if (state.hasGutter) tipLabel.appendChild(annotationTooltip(ann));
  //
  // if (ann.to) state.marked.push(cm.markText(ann.from, ann.to, {
  // className: "CodeMirror-lint-span-" + severity,
  // __annotation: ann
  // }));
  // }
  //
  // if (state.hasGutter)
  // cm.setGutterMarker(line, GUTTER_ID, makeMarker(tipLabel, maxSeverity,
  // anns.length > 1));
  // }
  // if (options.onUpdateLinting) options.onUpdateLinting(annotationsNotSorted,
  // annotations, cm);
  // }
  //

  function onChange(cm, textChanged) {
    var state = cm._foldingState;
    updateFolding(cm, false);
    // var lineInfo = cm.lineInfo(textChanged.from.line);
    // if (!(lineInfo.gutterMarkers &&
    // lineInfo.gutterMarkers["CodeMirror-folding-markers"])) {
    // // the line has none folding markers
    // // check if it can start a folding
    // var lineText = lineInfo.text;
    // var index = lineText.indexOf('(:');
    // if (index != -1) {
    // var result = updatePosFolding(cm, CodeMirror.Pos(lineInfo.line, index),
    // false);
    // if (result == -1) {
    // state.maybeStartFolding[lineInfo.line]=true;
    // }
    // }
    // }
    // clearTimeout(state.timeout);
    // state.timeout = setTimeout(function(){startLinting(cm);},
    // state.options.delay || 500);
  }
  //
  // function popupSpanTooltip(ann, e) {
  // var tooltip = showTooltip(e, annotationTooltip(ann));
  // var target = e.target || e.srcElement;
  // CodeMirror.on(target, "mouseout", hide);
  // function hide() {
  // CodeMirror.off(target, "mouseout", hide);
  // hideTooltip(tooltip);
  // }
  // }
  //
  // // When the mouseover fires, the cursor might not actually be over
  // // the character itself yet. These pairs of x,y offsets are used to
  // // probe a few nearby points when no suitable marked range is found.
  // var nearby = [0, 0, 0, 5, 0, -5, 5, 0, -5, 0];
  //
  // function onMouseOver(cm, e) {
  // if (!/\bCodeMirror-lint-span-/.test((e.target || e.srcElement).className))
  // return;
  // for (var i = 0; i < nearby.length; i += 2) {
  // var spans = cm.findMarksAt(cm.coordsChar({left: e.clientX + nearby[i],
  // top: e.clientY + nearby[i + 1]}));
  // for (var j = 0; j < spans.length; ++j) {
  // var span = spans[j], ann = span.__annotation;
  // if (ann) return popupSpanTooltip(ann, e);
  // }
  // }
  // }

  function makeFolding(cm, rangeFinder, pos, range, widget, collapsed,
      hasGutter) {
    var myRange = null;
    if (collapsed) {
      // widget
      var myWidget = widget.cloneNode(true);
      CodeMirror.on(myWidget, "mousedown", function() {
        expandFolding(cm, myRange);
      });
      myRange = cm.markText(range.from, range.to, {
        replacedWith : myWidget,
        clearOnEnter : true,
        __isFold : true
      });
      var state = cm._foldingState;
      state.marked.push(myRange);
    }
    // gutter
    if (hasGutter)
      cm.setGutterMarker(range.from.line, GUTTER_ID, makeMarker(cm, pos,
          myRange));
  }

  function updatePosFolding(cm, pos, forceCollapsed) {
    var state = cm._foldingState, rangeFinder = state.options.rangeFinder, widget = state.options.widget, hasGutter = state.hasGutter;
    var range = rangeFinder(cm, pos);
    if (range) {
      var collapsed = range.collapsed == true;
      if (forceCollapsed != null)
        collapsed = forceCollapsed;
      makeFolding(cm, rangeFinder, pos, range, widget, collapsed, hasGutter);
      return range.from.line + 1;
    }
    return -1;
  }

  function updateFolding(cm, forceCollapsed) {
    var index = 0, count = cm.lineCount(), pos = null;
    for ( var i = 0; i < count && index < count; i++) {
      pos = CodeMirror.Pos(index, 0);
      var result = updatePosFolding(cm, pos, forceCollapsed);
      if (result != -1) {
        index = result;
      } else {
        index++;
      }
    }
  }

  CodeMirror.foldCode = function(cm) {
    var state = cm._foldingState;
    if (!state) {
      throw new Error('editor cannot support code folding!');
    }
    clearMarks(cm);
    updateFolding(cm, null);
  }

  CodeMirror.defineOption("foldingWith", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearMarks(cm);
      cm.off("change", onChange);
      CodeMirror.off(cm.getWrapperElement(), "mouseover",
          cm._foldingState.onMouseOver);
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
      // CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver);
      if (state.options && state.options.doFoldingOnLoad != false) {
        CodeMirror.foldCode(cm);
      }
    }
  });
})();
