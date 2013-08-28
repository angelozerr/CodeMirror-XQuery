(function() {
  "use strict";

  var HOVER_CLASS = " CodeMirror-hover";

  function showTooltip(e, content) {
    var tt = document.createElement("div");
    tt.className = "CodeMirror-hover-tooltip";
    if (typeof content == "string") {
      content = document.createTextNode(content);
    }
    tt.appendChild(content);
    document.body.appendChild(tt);

    function position(e) {
      if (!tt.parentNode)
        return CodeMirror.off(document, "mousemove", position);
      tt.style.top = Math.max(0, e.clientY - tt.offsetHeight - 5) + "px";
      tt.style.left = (e.clientX + 5) + "px";
    }
    CodeMirror.on(document, "mousemove", position);
    position(e);
    if (tt.style.opacity != null)
      tt.style.opacity = 1;
    return tt;
  }
  function rm(elt) {
    if (elt.parentNode)
      elt.parentNode.removeChild(elt);
  }
  function hideTooltip(tt) {
    if (!tt.parentNode)
      return;
    if (tt.style.opacity == null)
      rm(tt);
    tt.style.opacity = 0;
    setTimeout(function() {
      rm(tt);
    }, 600);
  }

  function showTooltipFor(e, content, node, state) {
    var tooltip = showTooltip(e, content);
    function hide() {
      CodeMirror.off(node, "mouseout", hide);
      CodeMirror.off(node, "click", hide);
      node.className = node.className.replace(HOVER_CLASS, "");
      if (tooltip) {
        hideTooltip(tooltip);
        tooltip = null;
      }
    }
    var poll = setInterval(function() {
      if (tooltip)
        for ( var n = node;; n = n.parentNode) {
          if (n == document.body)
            return;
          if (!n) {
            hide();
            break;
          }
        }
      if (!tooltip)
        return clearInterval(poll);
    }, 400);
    CodeMirror.on(node, "mouseout", hide);
    CodeMirror.on(node, "click", hide);
  }

  function TextHoverState(cm, options) {
    this.options = options;
    this.timeout = null;
    this.onMouseOver = function(e) {
      onMouseOver(cm, e);
    };
  }

  function parseOptions(cm, options) {
    if (options instanceof Function)
      return {
        getTextHover : options
      };
    if (!options || options === true)
      options = {};
    if (!options.getTextHover)
      options.getTextHover = cm.getHelper(CodeMirror.Pos(0, 0), "textHover");
    if (!options.getTextHover)
      throw new Error(
          "Required option 'getTextHover' missing (text-hover addon)");
    return options;
  }

  function onMouseOver(cm, e) {
    var node = e.target || e.srcElement;
    if (node) {
      var state = cm.state.textHover, token = getTokenAt(cm, e);
      var content = state.options.getTextHover(cm, token, e);
      if (content) {
        node.className += HOVER_CLASS;
        // clearTimeout(state.timeout);
        // state.timeout = setTimeout(function() {showTooltipFor(e, content,
        // node, state);}, 300);
        showTooltipFor(e, content, node, state);
      }
    }
  }

  function optionHandler(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      CodeMirror.off(cm.getWrapperElement(), "mouseover",
          cm.state.textHover.onMouseOver);
      delete cm.state.textHover;
    }

    if (val) {
      var state = cm.state.textHover = new TextHoverState(cm, parseOptions(cm,
          val));
      CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver);
    }
  }

  // When the mouseover fires, the cursor might not actually be over
  // the character itself yet. These pairs of x,y offsets are used to
  // probe a few nearby points when no suitable marked range is found.
  var nearby = [ 0, 0, 0, 5, 0, -5, 5, 0, -5, 0 ];

  function getTokenAt(cm, e) {
    var node = e.target || e.srcElement, text = node.innerText
        || node.textContent;
    for ( var i = 0; i < nearby.length; i += 2) {
      var pos = cm.coordsChar({
        left : e.clientX + nearby[i],
        top : e.clientY + nearby[i + 1]
      });
      var token = cm.getTokenAt(pos);
      if (token && token.string === text) {
        return token;
      }
    }
  }

  CodeMirror.defineOption("textHover", false, optionHandler); // deprecated

})();