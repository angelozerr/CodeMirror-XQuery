(function() {
  var templates = {
    "context" : "javascript",
    "templates" : [ {
      "name" : "for",
      "description" : "iterate over array",
      "template" : "for (var ${index} = 0; ${index} < ${array}.length; ${index}++) {\n${line_selection}${cursor}\n}"
    }, {
      "name" : "ifelse",
      "description" : "if else statement",
      "template" : "if (${condition}) {\n${cursor}\n} else {\n\n}"
    } ]
  };  
  CodeMirror.templatesHint.addTemplates(templates);
})();