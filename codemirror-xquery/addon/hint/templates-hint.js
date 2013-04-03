(function() {
  var templatesMap = [];
  var Pos = CodeMirror.Pos;
  
  function startsWith(str, token) {
    return str.slice(0, token.length).toUpperCase() == token.toUpperCase();
  }

  CodeMirror.templatesHint = {};

  function getLabel(proposal) {
    var template = proposal.template;
    return document.createTextNode(template.name);
  }

  CodeMirror.templatesHint.getCompletions = function(cm, completions, text) {

    var ourMap = {
      Tab : selectNextVariable,
      Esc : uninstall
    }

    function TemplateState() {
      this.marked = [];
      this.varIndex = -1;
    }

    function onChange() {

    }

    function selectNextVariable() {
      var templateState = cm._templateState;
      if (templateState.marked.length > 0) {
        templateState.varIndex++;
        if (templateState.varIndex >= templateState.marked.length) {
          templateState.varIndex = 0;
        }
        var markText = templateState.marked[templateState.varIndex];
        var pos = markText.find();
        cm.setSelection(pos.from, Pos(pos.from.line, pos.from.ch +2));
      }
    }

    function parseTemplate(template) {
      var content = template.template;
      var tokens = [];
      var varParsing = false;
      var last = null;
      var token = '';
      var posX = 0;
      for ( var i = 0; i < content.length; i++) {
        var current = content.charAt(i);
        if (current == "\n") {
          if (token != '') {
            tokens.push(token);
          }
          token = '';
          tokens.push(current);
          posX = 0;
          last = null;
        } else {
          var addChar = true;
          if (varParsing) {
            if (current == "}") {
              varParsing = false;
              addChar = false;
              tokens.push({
                "variable" : token,
                "x" : posX
              });
              posX += token.length;
              token = '';
            }
          } else {
            if (current == "$" && (i + 1) <= content.length) {
              i++;
              var next = content.charAt(i);
              if (next == "{") {
                varParsing = true;
                addChar = false;
                if (token != '') {
                  tokens.push(token);
                  posX += token.length;
                }
                token = '';
              }
            }

          }
          if (addChar && last != "$") {
            token += current;
            last = current;
          } else {
            last = null;
          }
        }
      }
      if (token != '') {
        tokens.push(token);
      }
      return tokens;
    }

    function isSpecialVar(variable) {
      return variable == 'cursor' || variable == 'line_selection';
    }

    function install(cm, data, completion) {

      var templateState = new TemplateState();
      cm._templateState = templateState;

      var template = completion.template;
      var tokens = parseTemplate(template);
      var content = '';
      var line = 0;
      var markers = [];
      for ( var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.variable) {
          if (!isSpecialVar(token.variable)) {
            content += token.variable;
            var from = Pos(data.line + line, data.token.start
                + token.x);
            var to = Pos(data.line + line, data.token.start
                + token.x + token.variable.length);
            markers.push({
              from : from,
              to : to
            });
          }
        } else {
          content += token;
          if (token == "\n") {
            line++;
          }
        }
      }

      var from = Pos(data.line, data.token.start);
      var to = Pos(data.line, data.token.end);
      cm.replaceRange(content, from, to);

      for ( var i = 0; i < markers.length; i++) {
        var marker = markers[i], from = marker.from, to = marker.to;
        templateState.marked.push(cm.markText(from, to, {
          className : "CodeMirror-templates-variable"
        }));
      }
      selectNextVariable();

      cm.on("change", onChange);
      cm.addKeyMap(ourMap);

    }

    function uninstall() {
      var templateState = cm._templateState;
      for ( var i = 0; i < templateState.marked.length; i++) {
        templateState.marked[i].clear();        
      } 
      cm.off("change", onChange);
      cm.removeKeyMap(ourMap);
      delete cm._templateState;
    }

    var mode = cm.doc.mode.name;
    var list = templatesMap[mode];
    if (list) {
      for ( var i = 0; i < list.length; i++) {
        var templates = list[i].templates;
        for ( var j = 0; j < templates.length; j++) {
          var template = templates[j];
          if (startsWith(template.name, text)) {
            var label = template.name;
            if (template.description) {
              label += '- ' + template.description;
            }
            var className = "CodeMirror-template";
            if (template.className)
              className = template.className;
            var completion = {
              "className" : className,
              "text" : label,
              "template" : template
            };
            completion.hint = function(cm, data, completion) {
              install(cm, data, completion);
            };
            completions.push(completion);
          }
        }
      }
    }
  }

  CodeMirror.templatesHint.addTemplates = function(templates) {
    var context = templates.context;
    if (context) {
      var list = templatesMap[context];
      if (!list) {
        list = [];
        templatesMap[context] = list;
      }
      list.push(templates);
    }
  }

})();