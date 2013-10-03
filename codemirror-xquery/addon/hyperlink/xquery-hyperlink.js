(function() {
  "use strict";

  function isTokenType(type, typeToSearch) {
    if (!type)
      return false;
    return type.indexOf(typeToSearch) != -1;
  }

  function isVariableType(type) {
    return isTokenType(type, 'variable');
  }

  function isVariable2Type(type) {
    return isTokenType(type, 'variable-2');
  }

  function isVariableDefType(type) {
    return isTokenType(type, 'variable def');
  }

  function isStringType(type) {
    return isTokenType(type, 'string');
  }

  function searchVar(cm, cursor) {
    if (cursor.findPrevious()) {
      var type = cm.getTokenTypeAt(cursor.to());
      if (isVariableType(type) || isVariable2Type(type)) {
        var token = cm.getTokenAt(cursor.to()), state = token.state;
        if ((isVariableType(type) && state.currentVar) || isVariable2Type(type)) {
          var char = cm.getRange(cursor.to(), CodeMirror.Pos(cursor.to().line,
              cursor.to().ch + 1));
          if (char === ' ' || char === ':' || char === ',' || char === ')') {
            cm.setSelection(cursor.from(), cursor.to());
            return;
          }
        }
      }
      searchVar(cm, cursor);
    }
  }

  function searchFunc(cm, cursor, length) {
    if (cursor.findPrevious()) {
      var type = cm.getTokenTypeAt(cursor.to());
      if (isVariableDefType(type)) {
        var token = cm.getTokenAt(cursor.to()), state = token.state;
        if (state.functionDecl != null) {
          cm.setSelection(cursor.from(), cursor.to());
        } else {
          searchFunc(cm, cursor, length);
        }
      } else {
        searchFunc(cm, cursor, length);
      }
    }
  }

  function getHyperlink(cm, data) {
    if (!data)
      return;
    var token = data.token, pos = data.pos;
    switch (token.type) {
    case "variable def":
      var state = token.state, openExternal = cm.options.hyperlink.open;
      return {
        open : function() {
          // test if s ends with ':'
          var prefix = null, funcName = null, s = token.string;
          var prefixIndex = s.lastIndexOf(':');
          if (prefixIndex != -1) {
            // retrieve the prefix and function name.
            prefix = s.substring(0, prefixIndex);
            funcName = s.substring(prefixIndex + 1, s.length);
          }
          if (prefix) {
            // test if it's default prefix
            var module = CodeMirror.XQuery.findModuleByPrefix(prefix,
                state.importedModules);
            if (module) {
              var cur = data.pos, lineNo = cur.line, start = token.end - 1;
      		  var nbParams = CodeMirror.XQuery.getParamCount(cm, lineNo, start);
              var namespace = module.namespace, location = module.location, resource = module.resource;
              openExternal(namespace, location, funcName, nbParams, resource);
              return;
            }
          }
          var query = token.string, cursor = cm.getSearchCursor(query, pos);
          searchFunc(cm, cursor);
        }
      }
    case "variable":
      return {
        open : function() {
          var query = token.string, cursor = cm.getSearchCursor(query, pos);
          searchVar(cm, cursor);
        }
      };
    case "string":
      var state = token.state, openExternal = cm.options.hyperlink.open;
      var moduleDecl = state.moduleDecl;
      if (moduleDecl) {
        var resource = null;
        var namespace = moduleDecl.namespace, location = moduleDecl.location;
        var module = CodeMirror.XQuery.findModule(namespace, location);
        if (module) {
          resource = module.resource;
        }
        return {
          open : function() {
            openExternal(namespace, location, null, null, resource);
          }
        }
      }
    }
  }

  CodeMirror.registerHelper("hyperlink", "xquery", function(cm, data) {
    return getHyperlink(cm, data)
  });
})();