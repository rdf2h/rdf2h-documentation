import Clipboard from "clipboard";
import $ from "jquery";
import rdf2h from "rdf2h";
import rdf from "rdflib";
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
        .reduce((a, b) => a < b ? a : b);
    return lines.map(l => l.substr(minMargin))
        .filter((l, pos, array) => !(pos === 0 || pos === array.length - 1) && l.trim().length !== 0)
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
    let copyLink = $("<a href='#' >copy as JS-String</a>");
    copyLink.insertAfter(editorDiv);
    new Clipboard(copyLink[0], {
        text: function (trigger) {
            return "\'" + cmEditor.getValue().replace(/\'/g, "\\'")
                .split("\n").join("\\n\\\n") + "\'";
        }
    });
    if (type === "application/javascript") {
        let currentVars = {};
        Object.keys(vars).forEach(key => currentVars[key] = vars[key]);
        let executeLink = $("<a href='#'>execute</a> ");
        executeLink.insertAfter(editorDiv);
        let resultAreas = new Array();
        executeLink.click(() => {
            resultAreas.forEach(a => a.remove());
            let result;
            try {
                result = new Function("rdf2h", ...Object.keys(currentVars), cmEditor.getValue())
                    (rdf2h, ...Object.values(currentVars).map(v => v()));
            } catch (err) {
                let stackLines = err.stack.split("\n");
                let lineWithSelf = stackLines.findIndex(l => l.indexOf("at eval") > 0);
                err.stack = stackLines.splice(0, lineWithSelf).join("\n");
                throw err;
            }
            let resultArea = $("<div class='result'>Returns the following result:<br>\
            <code class='result'>"+result+"</code></div>");
            resultArea.insertAfter(editorDiv);
            resultAreas.push(resultArea);
        });
    }
    $("<br/>").insertAfter(copyLink);
    let additionalClasses = $(editorData).attr("class").split(" ").filter(c => c !== "editor")
    additionalClasses.forEach(name => vars[name] = () => 
    {
        var graph = rdf.graph();
        rdf.parse(cmEditor.getValue(), graph, "http://example.org/"+name+"/", type);
        return graph;
    });
});
$(" .CodeMirror").css("height", "auto");