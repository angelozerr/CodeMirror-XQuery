CodeMirror.registerHelper("textHover", "xquery", function(cm, data) {
  if (!data)
    return;
  var token = data.token;
  function getHtml(module, funcName, prefix) {
    var functions = module.functions;
    for ( var i = 0; i < functions.length; i++) {
      var f = functions[i];
      var name = f.name;
      if (name == funcName) {
        var html = '';
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

  var html = '';
  var s = token.string;// node.innerText || node.textContent;
  var prefixIndex = s.lastIndexOf(':');
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
      html = getHtml(module, funcName, prefix)
    }
  } else {
    // module without prefix (ex : concat of fn:concat)
    var modules = CodeMirror.XQuery.getModulesNoNeedsPrefix();
    for ( var i = 0; i < modules.length; i++) {
      var module = modules[i];
      var content = getHtml(module, s, module.prefix);
      if (content != '') {
        html = content;
        break;
      }
    }
  }
  if (html === '')
    return null;
  var result = document.createElement('div');
  result.innerHTML = html;
  return result;
});