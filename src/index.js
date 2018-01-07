import Clipboard from "clipboard";
import $ from "jquery";
import CodeMirror from "codemirror";
import "codemirror/mode/turtle/turtle"
import "codemirror/mode/javascript/javascript"
import css from 'codemirror/lib/codemirror.css'

new Clipboard('.btn', {
    text: function (trigger) {
        return trigger + " it is";
    }
});

function align(string) {
    let lines = string.split(/\r?\n/);
    let minMargin = lines.filter(l => l.trim().length > 0)
        .map(value =>
        value.match(/ */)[0].length)
        .reduce((a,b) => a < b ? a : b);
    return lines.map(l => l.substr(minMargin))
        .filter((l, pos, array) => !(pos === 0 || pos === array.length-1) && l.trim().length !== 0)
        .join("\n");
}
let vars = {};
$(".editor").toArray().forEach((editorData) => {
    var value = $(editorData).html();
    var type = $(editorData).attr("type");
    $(editorData).hide();
    var editorDiv = $("<div></div>");
    editorDiv.insertAfter(editorData);
    var cmEditor = CodeMirror(editorDiv[0], {
        mode: type,
        lineNumbers: true,
        viewportMargin: Infinity
    });
    cmEditor.setValue(align(value));
    let copyLink = $("<a href='#'>copy as JS-String</a>");
    copyLink.insertAfter(editorDiv);
    new Clipboard(copyLink[0], {
        text: function (trigger) {
            return "\'" + cmEditor.getValue().replace(/\'/g, "\\'")
                .split("\n").join("\\n\\\n") + "\'";
        }
    });
    $("<br/>").insertAfter(copyLink);
    //vars()
console.log($(editorData).attr("class").split(" ").filter(c => c !== "editor"));
});
$(" .CodeMirror").css("height", "auto");