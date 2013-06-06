(function () {
  
  var Pos = CodeMirror.Pos;
  
  function createCompletionElement(htmlStructure, insertStartBracket) {   
    var completion = {
       text : htmlStructure.tag,
       className : 'CodeMirror-completion-xml CodeMirror-completion-xml-element'
    }
    completion.hint = function(cm, data, completion) {         
      var from = Pos(data.from.line, data.from.ch);
      var to = Pos(data.to.line, data.to.ch);
      var insertText = '';
      if (insertStartBracket) insertText = '<'; else insertText = '';
      insertText += htmlStructure.tag;
      cm.replaceRange(insertText, from, to);
    }
    completion.info = function(completion) { 
      var html = '<b>Element: </b>' + completion.text;
      var attr = htmlStructure.attr;
      if(attr) {
        html+= '<br/>';
        html+='<b>Attributes: </b>'
        html+='<ul>'
        for ( var i = 0; i < attr.length; i++) {
          html+= '<li>';          
          html+= attr[i].key;
          html+= '</li>';
        }
        html+='</ul>'
      }
      return html;
    }
    return completion;
  }
  
  function createCompletionAttributeName(name) {
    var completion = {
        text : name,
        className : 'CodeMirror-completion-xml CodeMirror-completion-xml-attribute'
    }
    completion.hint = function(cm, data, completion) {         
      var from = Pos(data.from.line, data.from.ch);
      var to = Pos(data.to.line, data.to.ch);
      var insertText = name + "=\"\" ";
      cm.replaceRange(insertText, from, to);
      cm.setCursor(Pos(data.from.line, data.from.ch + name.length + 2));
    }
    return completion;
  }

  function createCompletionAttributeValue(attr) {
    var completion = {
        text : attr
    }
    return completion;
  }
  
  function xmlHint(editor, htmlStructure, globalAttributes, getToken) {
    var cur = editor.getCursor();
    var token = getToken(editor, cur);
    var keywords = [];
    var i = 0;
    var j = 0;
    var k = 0;
    var from = {line: cur.line, ch: cur.ch};
    var to = {line: cur.line, ch: cur.ch};
    var flagClean = true;

    var text = editor.getRange({line: 0, ch: 0}, cur);

    var open = text.lastIndexOf('<');
    var close = text.lastIndexOf('>');
    var tokenString = token.string.replace("<","");

    if(open > close) {
      var last = editor.getRange({line: cur.line, ch: cur.ch - 1}, cur);
      if(last == "<") {
        for(i = 0; i < htmlStructure.length; i++) {
          keywords.push(createCompletionElement(htmlStructure[i], false));
        }
        from.ch = token.start + 1;
      } else {
        var counter = 0;
        var found = function(token, type, position) {
          counter++;
          if(counter > 50) return;
          if(token.type == type) {
            return token;
          } else {
            position.ch = token.start;
            var newToken = editor.getTokenAt(position);
            return found(newToken, type, position);
          }
        };

        var nodeToken = found(token, "tag", {line: cur.line, ch: cur.ch});
        var node = nodeToken.string.substring(1);

        if(token.type === null && token.string.trim() === "") {
          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                keywords.push(createCompletionAttributeName(htmlStructure[i].attr[j].key));
              }

              for(k = 0; k < globalAttributes.length; k++) {
                keywords.push(createCompletionAttributeName(globalAttributes[k].key));
              }
            }
          }
        } else if(token.type == "string") {
          tokenString = tokenString.substring(1, tokenString.length - 1);
          var attributeToken = found(token, "attribute", {line: cur.line, ch: cur.ch});
          var attribute = attributeToken.string;

          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                if(htmlStructure[i].attr[j].key == attribute) {
                  for(k = 0; k < htmlStructure[i].attr[j].values.length; k++) {
                    keywords.push(createCompletionAttributeValue(htmlStructure[i].attr[j].values[k]));
                  }
                }
              }

              for(j = 0; j < globalAttributes.length; j++) {
                if(globalAttributes[j].key == attribute) {
                  for(k = 0; k < globalAttributes[j].values.length; k++) {
                    keywords.push(createCompletionAttributeValue(globalAttributes[j].values[k]));
                  }
                }
              }
            }
          }
          from.ch = token.start + 1;
        } else if(token.type == "attribute") {
          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                keywords.push(createCompletionAttributeName(htmlStructure[i].attr[j].key));
              }

              for(k = 0; k < globalAttributes.length; k++) {
                keywords.push(createCompletionAttributeName(globalAttributes[k].key));
              }
            }
          }
          from.ch = token.start;
        } else if(token.type == "tag") {
          for(i = 0; i < htmlStructure.length; i++) {
            keywords.push(createCompletionElement(htmlStructure[i], false));
          }

          from.ch = token.start + 1;
        }
      }
    } else {
      for(i = 0; i < htmlStructure.length; i++) {
        keywords.push(createCompletionElement(htmlStructure[i], true));
      }

      tokenString = tokenString.trim();
      from.ch = token.start;
    }

    if(flagClean === true && tokenString.trim() === "") {
      flagClean = false;
    }

    if(flagClean) {
      keywords = cleanResults(tokenString, keywords);
    }

    var data = {list: keywords, from: from, to: to};
    if (CodeMirror.attachContextInfo) {
      CodeMirror.attachContextInfo(data);
    }
    return data;
  }


  var cleanResults = function(text, keywords) {
    var results = [];
    var i = 0;

    for(i = 0; i < keywords.length; i++) {
      var keyword = keywords[i];
      if (keyword.text) keyword = keyword.text;
      if(keyword.substring(0, text.length) == text) {
        results.push(keywords[i]);
      }
    }

    return results;
  };

  var grammarsMap = [];
  
  CodeMirror.addXmlGrammar = function(grammar) {
    var name = grammar.name;
    if (name) {
      grammarsMap[name] = grammar;
    }
  }
  
  CodeMirror.xmlHint = function(editor, name) {
    if(String.prototype.trim == undefined) {
      String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
    }
    var grammar = grammarsMap[name];
    return xmlHint(editor, grammar.xmlStructure, grammar.globalAttributes, function (e, cur) { return e.getTokenAt(cur); });
  };
})();
