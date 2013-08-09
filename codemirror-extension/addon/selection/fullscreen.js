(function() {
    var indexOf = [].indexOf || function(prop) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === prop) return i;
        }
        return -1;
    };
    
    function getElementsByClassName (className,context) {
        if (context.getElementsByClassName) return context.getElementsByClassName(className);
        var elems = document.querySelectorAll ? context.querySelectorAll("." + className) : (function() {
            var all = context.getElementsByTagName("*"),
                elements = [],
                i = 0;
            for (; i < all.length; i++) {
                if (all[i].className && (" " + all[i].className + " ").indexOf(" " + className + " ") > -1 && indexOf.call(elements,all[i]) === -1) elements.push(all[i]);
            }
            return elements;
        })();
        return elems;
    };
    
    CodeMirror.on(window, "resize",
    function() {
      if (!document.body)
	  return;	  
      var showing = getElementsByClassName("CodeMirror-fullscreen", document.body)[0];
      if (!showing)
        return;
      showing.CodeMirror.getWrapperElement().style.height = winHeight() + "px";
    });
    
})();

function isFullScreen(cm) {
  return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
}
function winHeight() {
  return window.innerHeight
      || (document.documentElement || document.body).clientHeight;
}
function setFullScreen(cm, full) {
  var wrap = cm.getWrapperElement();
  if (full) {
    wrap.className += " CodeMirror-fullscreen";
    wrap.style.height = winHeight() + "px";
    document.documentElement.style.overflow = "hidden";
  } else {
    wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
    wrap.style.height = "";
    document.documentElement.style.overflow = "";
  }
  cm.refresh();
}