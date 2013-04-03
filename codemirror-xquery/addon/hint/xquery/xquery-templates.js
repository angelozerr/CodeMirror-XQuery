(function() {
  var templates = {
    "context" : "xquery",
    "templates" : [ {
      "name" : "let",
      "description" : "Insert a single Let Clause",
      "template" : "let $$${variable} := expression"
    }, {
      "name" : "flowr",
      "description" : "Insert a simple FLWOR Expression",
      "template" : "for $$${iteration_variable} in expression\nlet $$${variable} := expression\nreturn $$${iteration_variable}${cursor}"
    } ]
  };  
  CodeMirror.templatesHint.addTemplates(templates);
})();