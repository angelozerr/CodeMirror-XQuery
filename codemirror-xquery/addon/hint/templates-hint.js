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

    function getMarkerChanged(cm, textChanged) {
      var markers = cm.findMarksAt(textChanged.from);
      if (markers) {
        for ( var i = 0; i < markers.length; i++) {
          var marker = markers[i];
          if (marker._templateVar) {
            return marker;
          }
        }
      }
      return null;
    }

    function onChange(cm, textChanged) {
      var state = cm._templateState;
      if (!textChanged.origin || state.updating) {
        return;
      }
      try {
        state.updating = true;
        var markerChanged = getMarkerChanged(cm, textChanged);
        if (markerChanged == null) {
          uninstall(cm);
        } else {
          var posChanged = markerChanged.find();
          var newContent = cm.getRange(posChanged.from, posChanged.to);
          for ( var i = 0; i < state.marked.length; i++) {
            var marker = state.marked[i];
            if (marker != markerChanged
                && marker._templateVar == markerChanged._templateVar) {
              var pos = marker.find();
              cm.replaceRange(newContent, pos.from, pos.to);
            }
          }
        }
      } finally {
        state.updating = false;
      }
    }

    function selectNextVariable(cm) {
      var state = cm._templateState;
      if (state.marked.length > 0) {
        state.varIndex++;
        if (state.varIndex >= state.marked.length) {
          state.varIndex = 0;
        }
        var markText = state.marked[state.varIndex];
        var pos = markText.find();
        cm.setSelection(pos.from, pos.to);
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

      var state = new TemplateState();
      cm._templateState = state;

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
            var from = Pos(data.from.line + line, data.from.ch + token.x);
            var to = Pos(data.from.line + line, data.from.ch + token.x
                + token.variable.length);
            markers.push({
              from : from,
              to : to,
              variable : token.variable
            });
          }
        } else {
          content += token;
          if (token == "\n") {
            line++;
          }
        }
      }

      var from = data.from;
      var to = data.to;
      cm.replaceRange(content, from, to);

      for ( var i = 0; i < markers.length; i++) {
        var marker = markers[i], from = marker.from, to = marker.to;
        state.marked.push(cm.markText(from, to, {
          className : "CodeMirror-templates-variable",
          startStyle : "CodeMirror-templates-variable-start",
          endStyle : "CodeMirror-templates-variable-end",
          inclusiveLeft : true,
          inclusiveRight : true,
          _templateVar : marker.variable
        }));
      }
      selectNextVariable(cm);

      cm.on("change", onChange);
      cm.addKeyMap(ourMap);

    }

    function uninstall(cm) {
      var state = cm._templateState;
      for ( var i = 0; i < state.marked.length; i++) {
        state.marked[i].clear();
      }
      state.marked.length = 0;
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