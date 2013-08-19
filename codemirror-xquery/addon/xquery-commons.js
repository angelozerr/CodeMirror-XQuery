(function() {
	"use strict";

	var XQuery = CodeMirror.XQuery = {};

	// --------------- XQuery module functions ---------------------

	var defaultModulePrefixes = [];
	var defaultModules = [];

	var moduleNamespaces = [];
	var modules = [];
	var modulesNoNeedsPrefix = [];

	function getDefaultModulePrefixes() {
		return defaultModulePrefixes;
	}
	XQuery.getDefaultModulePrefixes = getDefaultModulePrefixes;

	function getModulesNoNeedsPrefix() {
		return modulesNoNeedsPrefix;
	}
	XQuery.getModulesNoNeedsPrefix = getModulesNoNeedsPrefix;

	function getModuleNamespaces() {
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
		return defaultModules[prefix];
	}
	XQuery.findDefaultModuleByPrefix = findDefaultModuleByPrefix;

	function getImportedModule(importedModules, prefix) {
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
		if (importedModule && importedModule.namespace) {
			var module = findModule(importedModule.namespace,
					importedModule.location);
			if (module) {
				return module;
			}
		}
		return null;
	}
	XQuery.findModuleByPrefix = findModuleByPrefix;

	function findModuleByNamespace(namespace) {
		return modules[namespace];
	}
	XQuery.findModuleByNamespace = findModuleByNamespace;

	function findModule(namespace, location) {
		var module = modules[namespace];
		if (module) {
			return module;
		}
		return null;
	}
	XQuery.findModule = findModule;
	
})();