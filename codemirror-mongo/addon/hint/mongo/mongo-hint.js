(function() {

  var Pos = CodeMirror.Pos;

  function mongoHint(editor, collectionsProvider) {
    var cur = editor.getCursor();
    var from = {
      line : cur.line,
      ch : cur.ch
    };
    var to = {
      line : cur.line,
      ch : cur.ch
    };
    var keywords = [];

    var databases = collectionsProvider();
    for ( var i = 0; i < databases.length; i++) {
      var completion = {
        text : databases[i],
        className : 'CodeMirror-completion-mongo-db'
      }
      keywords.push(completion);
    }

    var data = {
      list : keywords,
      from : from,
      to : to
    };
    if (CodeMirror.attachContextInfo) {
      CodeMirror.attachContextInfo(data);
    }
    return data;
  }

  CodeMirror.mongoHint = function(editor, collectionsProvider) {
    return mongoHint(editor, collectionsProvider);
  }
})();