(function() {
  "use strict";

  function showTooltip(clientX, clientY, content) {
    var tt = document.createElement("div");
    tt.className = "CodeMirror-lint-tooltip";
    if (typeof content == "string") {
    	content = document.createTextNode(content);
    }     
    tt.appendChild(content);
    document.body.appendChild(tt);

    function position(clientX, clientY) {
      if (!tt.parentNode) return CodeMirror.off(document, "mousemove", position);
      tt.style.top = Math.max(0, clientY - tt.offsetHeight - 5) + "px";
      tt.style.left = (clientX + 5) + "px";
    }
    CodeMirror.on(document, "mousemove", position);
    position(clientX, clientY);
    if (tt.style.opacity != null) tt.style.opacity = 1;
    return tt;
  }
  function rm(elt) {
    if (elt.parentNode) elt.parentNode.removeChild(elt);
  }
  function hideTooltip(tt) {
    if (!tt.parentNode) return;
    if (tt.style.opacity == null) rm(tt);
    tt.style.opacity = 0;
    setTimeout(function() { rm(tt); }, 600);
  }

  function showTooltipFor(clientX, clientY, content, node) {
    var tooltip = showTooltip(clientX, clientY, content);
    function hide() {
      CodeMirror.off(node, "mouseout", hide);
      CodeMirror.off(node, "click", hide);
      if (tooltip) { hideTooltip(tooltip); tooltip = null; }
    }
    var poll = setInterval(function() {
      if (tooltip) for (var n = node;; n = n.parentNode) {
        if (n == document.body) return;
        if (!n) { hide(); break; }
      }
      if (!tooltip) return clearInterval(poll);
    }, 400);
    CodeMirror.on(node, "mouseout", hide);
    CodeMirror.on(node, "click", hide);
  }

  function TextHoverState(cm, options) {
    this.options = options;
    this.timeout = null;
    this.onMouseOver = function(e) { onMouseOver(cm, e); };
  }

  function parseOptions(cm, options) {
    if (options instanceof Function) return {getTextHover: options};
    if (!options || options === true) options = {};
    if (!options.getTextHover) options.getTextHover = cm.getHelper(CodeMirror.Pos(0, 0), "textHover");
    if (!options.getTextHover) throw new Error("Required option 'getTextHover' missing (text-hover addon)");
    return options;
  }
  
  function onMouseOver(cm, e) {
    var node = e.target || e.srcElement;
    if (node) {
      var state = cm.state.textHover;
      clearTimeout(state.timeout);
      var clientX = e.clientX, clientY = e.clientY;
      state.timeout = setTimeout(function(){show(cm, clientX, clientY, state, node);}, state.options.delay || 1000);            
    }
  }
  
  function show(cm, clientX, clientY, state, node) {
  	var content = state.options.getTextHover(cm, node);
    if (content) {
      showTooltipFor(clientX, clientY, content, node);
    }
  }

  function popupSpanTooltip(ann, e) {
    var target = e.target || e.srcElement;
    alert(ann);
   // showTooltipFor(e, annotationTooltip(ann), target);
  }
  
  function optionHandler(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      CodeMirror.off(cm.getWrapperElement(), "mouseover", cm.state.textHover.onMouseOver);
      delete cm.state.textHover;
    }

    if (val) {
      var state = cm.state.textHover = new TextHoverState(cm, parseOptions(cm, val));
      CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver);
    }
  }
  
  CodeMirror.defineOption("textHover", false, optionHandler); // deprecated
  
})();