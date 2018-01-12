import Clipboard from "clipboard";
import jQuery from "jquery";
import rdf2h from "rdf2h";
import rdf from "rdflib";
import CodeMirror from "codemirror";
import "codemirror/mode/turtle/turtle"
import "codemirror/mode/javascript/javascript"
import css from 'codemirror/lib/codemirror.css'

let $ = jQuery;

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
CodeMirror.prototype.getValueAsJS = function() {
    return "\'" + this.getValue().replace(/\'/g, "\\'")
                .split("\n").join("\\n\\\n") + "\'";
}
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
            return  cmEditor.getValueAsJS();
        }
    });
    if (type === "application/javascript") {
        let currentVars = {};
        Object.keys(vars).forEach(key => currentVars[key] = vars[key]);
        let executeLink = $("<a href='#'>run again</a> ");
        executeLink.insertAfter(editorDiv);
        let resultAreas = new Array();
        function execute() {
            resultAreas.forEach(a => a.remove());
            try {
                let result = new Function("rdf2h", ...Object.keys(currentVars), cmEditor.getValue())
                    (rdf2h, ...Object.values(currentVars).map(v => v()));
                let resultArea = $("<div class='result'>Returns the following result:<br>\
                 <code class='result'>"+result+"</code></div>");
                resultArea.insertAfter(editorDiv);
                resultAreas.push(resultArea);
            } catch (err) {
                let stackLines = err.stack.split("\n");
                let lineWithSelf = stackLines.findIndex(l => l.indexOf("at eval") > 0);
                err.stack = stackLines.splice(0, lineWithSelf).join("\n");
                let resultArea = $("<div class='result error'>Throws the following error:<br>\
                <code class='result'>"+$('<div/>').text(err.message).html().replace("\n","<br>")+"\n"+$('<div/>').text(err.stack).html()+"</code></div>");
                resultArea.insertAfter(editorDiv);
                resultAreas.push(resultArea);
            }
            
        }
        execute();
        executeLink.click(() => {
            execute();
            return false;
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

let createTestLink = $("<a class='copyAsTest' href='#'>Copy as test</a>");
new Clipboard(".copyAsTest", {
    text: function (trigger) {
        let section = $(event.target.closest(".step"));
        let codeMirros = section.find(".CodeMirror").toArray().map(e => e.CodeMirror);
        let templates = codeMirros[0].getValueAsJS();
        let data = codeMirros[1].getValueAsJS();
        let code = codeMirros[2].getValue();
        let testTemplate = `it(\'Test generated from manual.\', function () {
            var dataTurtle = ${data};
            var templatesTurtle = ${templates};
            var templates = rdf.graph();
            rdf.parse(templatesTurtle, templates, "http://example.org/templates/", "text/turtle");
            var data = rdf.graph();
            rdf.parse(dataTurtle, data, "http://example.org/data", "text/turtle");
            var renderingResult = (() => { ${code} })();
            console.log("result: " + renderingResult);
            assert.equal("EXPECTED RESULT", renderingResult);
        });`
        section.find(".CodeMirror").toArray().forEach((cm) => console.log(cm));
        alert(testTemplate);
        return  testTemplate;
    }
});
/*createTestLink.click((event) => {
    
});*/
$(".step").append($("<hr/>"));
$(".step").append(createTestLink);