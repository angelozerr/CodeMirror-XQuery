(function() {
  var server, defs = [];
  var Pos = CodeMirror.Pos;
  var docs = [], curDoc;
  var bigDoc = 250;
  var cachedFunction = {
    line : null,
    ch : null,
    name : null,
    type : null,
    bad : null
  };

  CodeMirror.tern = {};
  CodeMirror.tern.addDef = function(def) {
    defs.push(def);
  }

  CodeMirror.ternHints = function(cm, c) {
    var req = buildRequest(cm, {
      type : "completions",
      caseInsensitive : true,
      types : true,
      docs : true
    });

    server
        .request(
            req,
            function(error, data) {
              if (error)
                return displayError(error);
              var completions = [], after = "";
              var from = data.start, to = data.end;
              if (cm.getRange(Pos(from.line, from.ch - 2), from) == "[\""
                  && cm.getRange(to, Pos(to.line, to.ch + 2)) != "\"]")
                after = "\"]";

              for ( var i = 0; i < data.completions.length; ++i) {
                var completion = data.completions[i], className = typeToIcon(completion.type);
                if (data.guess)
                  className += " Tern-completion-guess";
                var item = {
                  "text" : completion.name + ' - ' + completion.type,
                  "className" : className,
                  "ternItem" : completion
                };
                item.hint = function(cm, data, completion) {
                  var from = Pos(data.from.line, data.from.ch);
                  var to = Pos(data.to.line, data.to.ch);
                  var ternItem = completion.ternItem;
                  cm.replaceRange(ternItem.name, from, to);
                }
                completions.push(item);
              }

              // var out = document.getElementById("out");
              var data = {
                from : from,
                to : to,
                list : completions
              };

              if (CodeMirror.attachContextInfo) {
                // if context info is available, attach it
                CodeMirror.attachContextInfo(data);
              }
              /*
               * CodeMirror.on(obj, "close", function() { out.innerHTML = "";
               * }); CodeMirror.on(obj, "select", function(cur) { out.innerHTML =
               * ""; if (cur.doc) { var node =
               * out.appendChild(document.createElement("div")); node.className =
               * "hint-doc"; node.appendChild(document.createTextNode(cur.doc)); }
               * });
               */
              c(data);
            });
  }

  function buildRequest(cm, query, allowFragments) {
    // files
    var files = [];
    files.push({
      type : "full",
      name : "xxx",
      text : cm.getValue()
    });
    // query
    query.lineCharPositions = true;
    if (query.end == null) {
      query.end = cm.getCursor("end");
      if (cm.somethingSelected())
        query.start = cm.getCursor("start");
    }
    query.file = "#0";
    return {
      query : query,
      files : files
    }
    /*var files = [], offsetLines = 0;
    if (typeof query == "string")
      query = {
        type : query
      };
    query.lineCharPositions = true;
    if (query.end == null) {
      query.end = cm.getCursor("end");
      if (cm.somethingSelected())
        query.start = cm.getCursor("start");
    }
    var startPos = query.start || query.end;
    //curDoc.changed=true; 
    if (curDoc.changed) {
      if (cm.lineCount() > bigDoc && allowFragments !== false
          && curDoc.changed.to - curDoc.changed.from < 100
          && curDoc.changed.from <= startPos.line
          && curDoc.changed.to > query.end.line) {
        files.push(getFragmentAround(cm, startPos, query.end));
        query.file = "#0";
        var offsetLines = files[0].offsetLines;
        if (query.start != null)
          query.start = incLine(-offsetLines, query.start);
        query.end = incLine(-offsetLines, query.end);
      } else {
        files.push({
          type : "full",
          name : curDoc.name,
          text : cm.getValue()
        });
        query.file = curDoc.name;
        curDoc.changed = null;
      }
    } else {
      query.file = curDoc.name;
    }
    for ( var i = 0; i < docs.length; ++i) {
      var doc = docs[i];
      if (doc.changed && doc != curDoc) {
        files.push({
          type : "full",
          name : doc.name,
          text : doc.doc.getValue()
        });
        doc.changed = null;
      }
    }

    return {
      query : query,
      files : files
    };*/
  }

  function displayError(err) {
    /*
     * var out = document.getElementById("out"); out.innerHTML = "";
     * out.appendChild(document.createTextNode(err.message || String(err)));
     */
    alert(err.message || String(err));
  }

  function typeToIcon(type) {
    var suffix;
    if (type == "?")
      suffix = "unknown";
    else if (type == "number" || type == "string" || type == "bool")
      suffix = type;
    else if (/^fn\(/.test(type))
      suffix = "fn";
    else if (/^\[/.test(type))
      suffix = "array";
    else
      suffix = "object";
    return "Tern-completion-" + suffix;
  }

  function getFile() {

  }

  function getServer() {
    if (server == null) {
      server = new tern.Server({
        getFile : getFile,
        async : true,
        defs : defs,
        debug : true
      /*
       * , plugins: {requirejs: {}, doc_comment: true}
       */
      });
    }
    return server;
  }

  function registerDoc(name, doc) {
    var data = {
      name : name,
      doc : doc,
      changed : null
    };
    docs.push(data);
    /*
     * var docTabs = document.getElementById("docs"); var li =
     * docTabs.appendChild(document.createElement("li"));
     * li.appendChild(document.createTextNode(name)); if (editor.getDoc() ==
     * doc) { setSelectedDoc(docs.length - 1); curDoc = data; }
     */
    server.addFile(name, doc.getValue());
    curDoc = data;
    CodeMirror.on(doc, "change", trackChange);
  }

  function trackChange(doc, change) {
    if (cachedFunction.line > change.from.line
        || cachedFunction.line == change.from.line
        && cachedFunction.ch >= change.from.ch)
      cachedFunction.line = -1;

    for ( var i = 0; i < docs.length; ++i) {
      var data = docs[i];
      if (data.doc == doc)
        break;
    }
    var changed = data.changed;
    if (changed == null)
      data.changed = changed = {
        from : change.from.line,
        to : change.from.line
      };
    var end = change.from.line + (change.text.length - 1);
    if (change.from.line < changed.to)
      changed.to = changed.to - (change.to.line - end);
    if (end >= changed.to)
      changed.to = end + 1;
    if (changed.from > change.from.line)
      changed.from = change.from.line;

    if (doc.lineCount() > bigDoc && change.to - changed.from > 100)
      setTimeout(function() {
        if (data.changed && data.changed.to - data.changed.from > 100)
          sendDoc(data);
      }, 100);
  }

  function sendDoc(doc) {
    server.request({
      files : [ {
        type : "full",
        name : doc.name,
        text : doc.doc.getValue()
      } ]
    }, function(error) {
      if (error)
        return displayError(error);
      else
        doc.changed = null;
    });
  }
  var i = 0;
  CodeMirror.defineOption("ternWith", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      /*
       * clearMarks(cm); cm.off("change", onChange); delete cm._foldingState;
       */
    }

    if (val) {
      getServer();
      //registerDoc("xxx" + i++, cm.getDoc());
    }
  });

})();