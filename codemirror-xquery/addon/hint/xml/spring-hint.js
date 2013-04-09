(function() {
  
  var springStructure = [
     {tag: 'beans', attr: []},
     {tag: 'bean', attr: [
       {key: 'id', values: []},
       {key: 'name', values: []},
       {key: 'scope', values: ['singleton','prototype','request', 'session', 'globalSession']},
       {key: 'class', values: []}
     ]},
     {tag: 'property', attr: [
       {key: 'name', values: []},
       {key: 'value', values: []}
     ]}
   ];
  
   
  var spring = {
    "name" : "spring",
    "xmlStructure" : springStructure,
    "globalAttributes" : []
  };
  
  CodeMirror.addXmlGrammar(spring);
  
  CodeMirror.springHint = function(editor) {
    return CodeMirror.xmlHint(editor, "spring");
  }
})();