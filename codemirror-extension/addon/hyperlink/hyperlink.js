(function() {
    "use strict";
    
    function HyperlinkState(cm, options) {
	this.options = options;
	this.hasHyperlink = options.getHyperlink().hasHyperlink;
	this.processHyperlink = options.getHyperlink().processHyperlink;
	this.onMouseOver = function(e) {
	    onMouseOver(cm, e);
	};
	this.onKeyUp = function(e) {
	    onKeyUp(cm, e);
	};
	this.onClick = function(e) {
	    onClick(cm, e);
	};
    }

    function parseOptions(cm, options) {
      if (options instanceof Function) return {getHyperlink: options};
      if (!options || options === true) options = {};
      if (!options.getHyperlink) options.getHyperlink = cm.getHelper(CodeMirror.Pos(0, 0), "hyperlink");
      if (!options.getHyperlink) throw new Error("Required option 'getHyperlink' missing (hyperlink addon)");
      return options;
    }
    
    function onKeyUp(cm, e) {
	disable(cm)
    }

    function onMouseOver(cm, e) {
	disable(cm)
	if (!e.ctrlKey)
	    return;
	var node = e.target || e.srcElement;
	if (node) {
	    var state = cm.state.hyperlink;	    
	    var hasHyperlink = state.hasHyperlink(cm, node, e);
	    if (hasHyperlink) {
		state.node = node;
		node.className = node.className + ' CodeMirror-hyperlink'
	    }
	}
    }

    function onClick(cm, e) {
	var state = cm.state.hyperlink;	 
	if (state.node) {
	    state.processHyperlink(cm, state.node, e);
	}
    }
    
    function disable(cm) {
	var state = cm.state.hyperlink;
	var node = state.node;
	if (node != null) {
	    var index = node.className.indexOf(' CodeMirror-hyperlink');
	    if (index != -1) {
		node.className = node.className.substring(0,
			node.className.length - ' CodeMirror-hyperlink'.length);
	    }
	}
	state.node = null;
    }

    function optionHandler(cm, val, old) {
	if (old && old != CodeMirror.Init) {
	    var state = cm.state.hyperlink;
	    CodeMirror.off(cm.getWrapperElement(), "mousemove",
		    state.onMouseOver);
	    CodeMirror.off(cm.getWrapperElement(), "keyup", state.onKeyUp);
	    CodeMirror.off(cm, "cursorActivity", state.onClick);	    
	    delete cm.state.hyperlink;
	}

	if (val) {
	    var state = cm.state.hyperlink = new HyperlinkState(cm,
		    parseOptions(cm, val));
	    CodeMirror.on(cm.getWrapperElement(), "mousemove",
		    state.onMouseOver);
	    CodeMirror.on(cm.getWrapperElement(), "keyup", state.onKeyUp);
	    CodeMirror.on(cm, "cursorActivity", state.onClick);
	}
    }

    CodeMirror.defineOption("hyperlink", false, optionHandler); // deprecated

})();