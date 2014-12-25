(function() {
  "use strict";

  var XQuery = CodeMirror.XQuery = {};

  // --------------- XQuery module functions ---------------------

  var defaultModulePrefixes = [];
  var defaultModules = [];

  var moduleNamespaces = [];
  var modules = [];
  var modulesNoNeedsPrefix = [];

  function loadModulesIfNeeded() {
    if (XQuery.loadModulesIfNeeded) {
      if (XQuery.loadModulesIfNeeded())
        XQuery.loadModulesIfNeeded = null;
    }
  }

  XQuery.loadModulesIfNeeded = null;

  function getDefaultModulePrefixes() {
    loadModulesIfNeeded();
    return defaultModulePrefixes;
  }
  XQuery.getDefaultModulePrefixes = getDefaultModulePrefixes;

  function getModulesNoNeedsPrefix() {
    loadModulesIfNeeded();
    return modulesNoNeedsPrefix;
  }
  XQuery.getModulesNoNeedsPrefix = getModulesNoNeedsPrefix;

  function getModuleNamespaces() {
    loadModulesIfNeeded();
    return moduleNamespaces;
  }
  XQuery.getModuleNamespaces = getModuleNamespaces;

  function defineModule(module) {
    if (module && module.namespace) {
      if (module.prefix) {
        defaultModulePrefixes.push(module.prefix);
        defaultModules[module.prefix] = module;
        if (module.prefixRequired == false) {
          modulesNoNeedsPrefix.push(module);
        }
      } else {
        moduleNamespaces.push(module.namespace);
        modules[module.namespace] = module;
      }
    }
  }
  XQuery.defineModule = defineModule;

  function findDefaultModuleByPrefix(prefix) {
    loadModulesIfNeeded();
    return defaultModules[prefix];
  }
  XQuery.findDefaultModuleByPrefix = findDefaultModuleByPrefix;

  function getImportedModule(importedModules, prefix) {
    loadModulesIfNeeded();
    if (importedModules) {
      for ( var i = 0; i < importedModules.length; i++) {
        var importedModule = importedModules[i];
        var name = importedModule.prefix;
        if (name == prefix) {
          return importedModule;
        }
      }
    }
    return null;
  }

  function findModuleByPrefix(prefix, importedModules) {
    loadModulesIfNeeded();
    var module = findDefaultModuleByPrefix(prefix);
    if (!module) {
      // search the declared module which checks the prefix
      // ex import module namespace dls = "http://marklogic.com/xdmp/dls"
      // at
      // "/MarkLogic/dls.xqy";
      // prefix=dls will retrieve the module
      // "http://marklogic.com/xdmp/dls"
      // at "/MarkLogic/dls.xqy";
      var importedModule = getImportedModule(importedModules, prefix);
      // it exists an included module with the given prefix, search the
      // module
      // with the given namespace URI
      // (ex:"http://marklogic.com/xdmp/dls").
      module = findModuleByDeclaration(importedModule);
    }
    return module

  }
  XQuery.findModuleByPrefix = findModuleByPrefix;

  function findModuleByDeclaration(importedModule) {
    loadModulesIfNeeded();
    if (importedModule && importedModule.namespace) {
      var module = findModule(importedModule.namespace, importedModule.location);
      if (module) {
        return module;
      }
    }
    return null;
  }
  XQuery.findModuleByPrefix = findModuleByPrefix;

  function findModuleByNamespace(namespace) {
    loadModulesIfNeeded();
    return modules[namespace];
  }
  XQuery.findModuleByNamespace = findModuleByNamespace;

  function findModule(namespace, location) {
    loadModulesIfNeeded();
    var module = modules[namespace];
    if (module) {
      return module;
    }
    return null;
  }
  XQuery.findModule = findModule;

  // Search and select declare var
  function searchVar(cm, cursor) {
    if (cursor.find()) {
      var type = cm.getTokenTypeAt(cursor.to());
      if (type === 'variable') {
        var token = cm.getTokenAt(cursor.to()), state = token.state;
        if ((type === 'variable' && state.currentVar)) {
          var character = cm.getRange(cursor.to(), CodeMirror.Pos(cursor.to().line,
              cursor.to().ch + 1));
          if (character === ' ' || character === ':' || character === ',' || character === ')') {
            cm.setSelection(cursor.from(), cursor.to());
            return;
          }
        }
      }
      searchVar(cm, cursor);
    }
  }

  XQuery.selectDeclaredVar = function(cm, varName) {
    var query = varName, cursor = cm.getSearchCursor(query, CodeMirror
        .Pos(0, 0));
    searchVar(cm, cursor);
  }
  
  function scan(line, currentNbBracket, currentNbParams, start) {
      if (!line.text) return  {stop:true};
      var pos = 0, end = line.text.length;
      //if (line.text.length > maxScanLen) return null;
      if (start != null) pos = start + 1;
      for (; pos != end; pos += 1) {
        var ch = line.text.charAt(pos);
        if (currentNbBracket == null) {
        	// character must be space or (
        	if (ch === '(') {
        		currentNbBracket = 1;
        	}
        	else if (ch != ' ') {
        		return {stop:true};
        	}
        } else {
        	if (ch === '(') {
				currentNbBracket++;
			} else if (ch == ')') {
				currentNbBracket--;
			} else if (ch == ',') {
				if (currentNbBracket == 1) {
					currentNbParams++;
				}
			} else {
				if (currentNbBracket == 1 && currentNbParams == 0) {
					currentNbParams++;
				}
			}
	        if (currentNbBracket == 0) {
	        	return {currentNbBracket: currentNbBracket, currentNbParams: currentNbParams, stop: true};
	        }
        }
      }
      return {currentNbBracket: currentNbBracket, currentNbParams: currentNbParams};
   }
  
  XQuery.getParamCount = function (cm, lineNo, start) {
	  var currentNbBracket = null, currentNbParams = 0;
	  for (var i = lineNo, result, e = Math.min(i + 100, cm.lineCount()); i != e; i+=1) {
		  var line = cm.getLineHandle(i);
	      if (i == lineNo) result = scan(line, currentNbBracket, currentNbParams, start);
	      else result = scan(line, currentNbBracket, currentNbParams);
	      currentNbBracket = result.currentNbBracket;
	      currentNbParams = result.currentNbParams;
	      if (result.stop) break;
	    }
	  return currentNbParams;
  }

})();