var jade = require('jade');
module.exports = 
function anonymous(locals) {
var buf = [];
with (locals || {}) {
buf.push("<div" + (jade.attrs({ 'data-state':(state), "class": ('toggle') + ' ' + (name) }, {"class":true,"data-state":true})) + "><div class=\"toggle-handle\"></div><div class=\"toggle-progress-wrap\"><div class=\"toggle-progress\"><div class=\"toggle-progress-fill\">" + (jade.escape(null == (jade.interp = fillText || '') ? "" : jade.interp)) + "</div><div class=\"toggle-progress-empty\">" + (jade.escape(null == (jade.interp = emptyText || '') ? "" : jade.interp)) + "</div></div></div><div class=\"toggle-states\">");
// iterate states
;(function(){
  var $$obj = states;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var state = $$obj[$index];

buf.push("<div" + (jade.attrs({ 'data-state':(state) }, {"data-state":true})) + ">");
if ( typeof stateMarker != 'undefined')
{
buf.push("<div" + (jade.attrs({ "class": (stateMarker) }, {"class":true})) + "></div>");
}
buf.push("</div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      if ($$obj.hasOwnProperty($index)){      var state = $$obj[$index];

buf.push("<div" + (jade.attrs({ 'data-state':(state) }, {"data-state":true})) + ">");
if ( typeof stateMarker != 'undefined')
{
buf.push("<div" + (jade.attrs({ "class": (stateMarker) }, {"class":true})) + "></div>");
}
buf.push("</div>");
      }

    }

  }
}).call(this);

buf.push("</div></div>");
}
return buf.join("");
}