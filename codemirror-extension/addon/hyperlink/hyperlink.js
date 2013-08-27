(function() {
  "use strict";

  function HyperlinkState(cm, options) {
    this.options = options;
    this.node = null;
    this.hyperlink = null;
    this.onMouseOver = function(e) {
      onMouseOver(cm, e);
    };
    this.onKeyUp = function(e) {
      onKeyUp(cm, e);
    };
    this.onClick = function(cm, e) {
      onClick(cm, e);
    };
  }

  function parseOptions(cm, options) {
    if (options instanceof Function)
      return {
        getHyperlink : options
      };
    if (!options || options === true)
      options = {};
    if (!options.getHyperlink)
      options.getHyperlink = cm.getHelper(CodeMirror.Pos(0, 0), "hyperlink");
    if (!options.getHyperlink)
      throw new Error(
          "Required option 'getHyperlink' missing (hyperlink addon)");
    return options;
  }

  function onKeyUp(cm, e) {
    disable(cm)
  }

  function onMouseOver(cm, e) {
    if (!e.ctrlKey) {
      disable(cm);
      return;
    }
    var node = e.target || e.srcElement;
    if (node) {
      var state = cm.state.hyperlink;
      if (node === state.node)
        return;
      disable(cm);
      var pos = cm.coordsChar({
        left : e.clientX,
        top : e.clientY
      });
      var hyperlink = state.options.getHyperlink(cm, pos);
      if (hyperlink) {
        state.node = node;
        state.hyperlink = hyperlink;
        node.className = node.className + ' CodeMirror-hyperlink'
      }
    }
  }

  function onClick(cm, e) {
    var state = cm.state.hyperlink;
    if (state.hyperlink) {
      state.hyperlink.open();
      disable(cm);
      // we don't want the cursor to move
      CodeMirror.e_stop(e);
      e.returnValue = false; // don't why, but with XUL Runner 1.9/eclipse,
      // e.preventDefault is null?
    }
  }

  function disable(cm) {
    var state = cm.state.hyperlink;
    var node = state.node;
    if (node != null) {
      var index = node.className.indexOf(' CodeMirror-hyperlink');
      if (index != -1) {
        node.className = node.className.substring(0, node.className.length
            - ' CodeMirror-hyperlink'.length);
      }
    }
    state.node = null;
    state.hyperlink = null;
  }

  function optionHandler(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      var state = cm.state.hyperlink;
      CodeMirror.off(cm.getWrapperElement(), "mousemove", state.onMouseOver);
      CodeMirror.off(cm.getWrapperElement(), "keyup", state.onKeyUp);
      CodeMirror.off(cm, "mousedown", state.onClick);
      delete cm.state.hyperlink;
    }

    if (val) {
      var state = cm.state.hyperlink = new HyperlinkState(cm, parseOptions(cm,
          val));
      CodeMirror.on(cm.getWrapperElement(), "mousemove", state.onMouseOver);
      CodeMirror.on(cm.getWrapperElement(), "keyup", state.onKeyUp);
      CodeMirror.on(cm, "mousedown", state.onClick);
    }
  }

  CodeMirror.commands.hyperlink = function(cm) {
    var hyperlink = cm.state.hyperlink.options.getHyperlink(cm, cm.getCursor());
    if (hyperlink) {
      hyperlink.open();
    }
  }
  
  CodeMirror.defineOption("hyperlink", false, optionHandler); // deprecated

})();