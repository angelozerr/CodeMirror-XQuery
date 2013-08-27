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

  XQuery.selectDeclaredVar = function(cm, varName) {
    var query = varName, cursor = cm.getSearchCursor(query, CodeMirror
        .Pos(0, 0));
    searchVar(cm, cursor);
  }

})();