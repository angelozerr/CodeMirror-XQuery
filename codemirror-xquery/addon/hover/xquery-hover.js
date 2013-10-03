(function() {
  "use strict";

  function getHtmlOfFunction(module, f, prefix) {
	  var className = startsWithString(module.namespace, 'java:') ? 'CodeMirror-hover-module-java' : 'CodeMirror-hover-module-xml';
      var html = '';
      html +='<span class="';
      html +=className;
      html +='">&nbsp;</span>';
      html += '<b>';
      html += getSignature(prefix, f);
      html += '</b>';
      if (f.doc) {
        if (html != '') {
          html += '<br/>';
        }
        html += f.doc;
      }
      if (module.resource) {
        html += '<br/>File: ' + module.resource;
      }
      return html;
  }
  function getHtml(module, funcName, nbParams, prefix) {
    var functions = module.functions, f2 = null;
    for ( var i = 0; i < functions.length; i++) {
      var f = functions[i];
      var name = f.name;
      if (name == funcName) {
    	// check param count
    	var nbParamsOfFunc = 0;
    	if (f.params) nbParamsOfFunc = f.params.length;
    	if (nbParams != nbParamsOfFunc) {
    		f2 = f;
    	} else {
    		return getHtmlOfFunction(module, f, prefix);
    	}
      }
    }
    if (f2 != null) {
		return getHtmlOfFunction(module, f2, prefix);    	
    }
    return '';
  }
  function getSignature(prefix, f) {
    var label = f.name;
    if (prefix != null) {
      label = prefix + ':' + label;
    }
    label += '(';
    var params = f.params;
    if (params) {
      for ( var i = 0; i < params.length; i++) {
        if (i > 0)
          label += ', ';
        var param = params[i];
        label += '$' + param.name;
        var as = param.as;
        if (as && as.length > 0)
          label += ' as ' + as;
      }
    }
    label += ')';
    var as = f.as;
    if (as && as.length > 0)
      label += ' as ' + as;
    return label;
  }

  function startsWithString(str, token) {
    return str.slice(0, token.length).toUpperCase() == token.toUpperCase();
  }
  
  function getTextHover(cm, data) {
  	if (!data)
      return;
    var token = data.token, html = '';
    switch (token.type) {
    	case "variable def":
		  var s = token.string;// node.innerText || node.textContent;
		  var prefixIndex = s.lastIndexOf(':');
		  
		  var cur = data.pos, lineNo = cur.line, start = token.end - 1;
  		  var nbParams = CodeMirror.XQuery.getParamCount(cm, lineNo, start);
		  if (prefixIndex != -1) {
		    var lineCount = cm.lineCount();
		    var token = cm.getTokenAt(CodeMirror.Pos(lineCount, cm
		        .getLine(lineCount - 1).length));
		    if (!token.state)
		      return null;
		    var importedModules = token.state.importedModules;
		    var prefix = s.substring(0, prefixIndex);
		    var funcName = s.substring(prefixIndex + 1, s.length);
		    var module = CodeMirror.XQuery.findModuleByPrefix(prefix, importedModules);
		    if (module) {
		      // loop for each function
		      html = getHtml(module, funcName, nbParams, prefix)
		    }
		  } else {
		    // module without prefix (ex : concat of fn:concat)
		    var modules = CodeMirror.XQuery.getModulesNoNeedsPrefix();
		    for ( var i = 0; i < modules.length; i++) {
		      var module = modules[i];
		      var content = getHtml(module, s, nbParams, module.prefix);
		      if (content != '') {
		        html = content;
		        break;
		      }
		    }
		  }    	
    	break;
    }
	if (html === '')
	  return null;
	var result = document.createElement('div');
	result.innerHTML = html;
	return result;    
  }

  CodeMirror.registerHelper("textHover", "xquery", function(cm, data) {
    return getTextHover(cm, data)
  });
  
})();