(function() {
  "use strict";
  function jumpToDef(cm, open) {
    var pos = cm.getCursor();
    var token = cm.getTokenAt(pos), state = token.state, type = token.type;
    switch (type) {
    case "string":
      var moduleDecl = state.moduleDecl;
      if (moduleDecl) {
        var resource = null;
        var namespace = moduleDecl.namespace, location = moduleDecl.location;
        var module = CodeMirror.XQuery.findModule(namespace, location);
        if (module) {
          resource = module.resource;
        }
        open(namespace, location, null, resource);
      }
      break;
    case "variable def":
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
          var namespace = module.namespace, location = module.location, resource = module.resource;
          open(namespace, location, funcName, resource);
        }
      }

      break;
    case "variable":
      var query = token.string, cursor = cm.getSearchCursor(query, pos);
      search(cm, cursor)
      break;
    }
  }

  function search(cm, cursor) {
    if (cursor.findPrevious()) {
      var type = cm.getTokenTypeAt(cursor.to());
      if (type === 'variable') {
        var token = cm.getTokenAt(cursor.to());
        if (token.state.currentVar) {
          cm.setSelection(cursor.from(), cursor.to());
        } else {
          search(cm, cursor);
        }
      } else {
        search(cm, cursor);
      }
    }
  }

  CodeMirror.commands.xqueryHyperlinkProcessor = function(cm) {
    var open = cm.options.hyperlink.open;
    jumpToDef(cm, open);
  }

  CodeMirror.registerHelper("hyperlink", "xquery", function() {
    return {
      hasHyperlink : function(cm, node, e) {
        if (node.className == 'cm-variable cm-def')
          return true;
        if (node.className == 'cm-variable')
          return true;
        return false;
      },
      processHyperlink : function(cm, node, e) {
        cm.execCommand("xqueryHyperlinkProcessor");
      }
    }

  });
})();
