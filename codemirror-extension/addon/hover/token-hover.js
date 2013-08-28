CodeMirror.registerHelper("textHover", "javascript", function(cm, token, e) {
  var html = 'token null';
  if (token) {
    var node = e.target || e.srcElement
    html = 'node.innerText: ' + (node.innerText || node.textContent);
    html += '</br>node.className: ' + node.className;
    html += '</br>className: ' + token.className;
    html += '</br>end: ' + token.end;
    html += '</br>start: ' + token.start;
    html += '</br>string: ' + token.string;
    html += '</br>type: ' + token.type;
  }
  var result = document.createElement('div');
  result.innerHTML = html;
  return result;
});