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
    var editorDiv = $('<div class="border"></div>');
    editorDiv.insertAfter(editorData);
    var cmEditor = CodeMirror(editorDiv[0], {
        mode: type,
        lineNumbers: true,
        viewportMargin: Infinity,
        lineWrapping: true,
    });
    cmEditor.setValue(align(value));
    let copyJsLink = $("<button class='btn-svg' width='24' height='24'><svg style='width:24px;height:24px' viewBox='0 0 24 24'><path d='m 16,13 c 0,0.530049 0.211136,1.039261 0.585938,1.414062 C 16.960739,14.788864 17.469951,15 18,15 v -2 z' /><path d='m 18,9 c -1.092725,0 -2,0.9072752 -2,2 h 2 z' /><path d='M 2,3 V 17 H 4 V 3 Z' /><path d='M 4,1 V 3 H 16 V 1 Z' /><path d='M 8,5 V 7 H 21 V 5 Z' /><path d='M 6,7 V 21 H 8 V 7 Z' /><path d='m 13,9 v 8 h 2 V 9 Z' /><path d='m 18,9 v 2 h 3 V 9 Z' /><path d='m 16,11 v 2 h 2 v -2 z' /><path d='m 19,15 v 2 h 2 v -2 z' /><path d='m 16,17 v 2 h 3 v -2 z' /><path d='m 8,21 v 2 h 13 v -2 z' /><path d='m 10,15 v 2 h 2 v -2 z' /><path d='m 19,17 v 2 c 1.092725,0 2,-0.907275 2,-2 z' /><path d='m 13,17 v 2 c 1.092725,0 2,-0.907275 2,-2 z' /><path d='m 6,21 c 0,0.530049 0.2111364,1.039261 0.5859375,1.414062 C 6.9607386,22.788864 7.4699512,23 8,23 v -2 z' /><path d='m 10,17 c 0,0.530049 0.211136,1.039261 0.585938,1.414062 C 10.960739,18.788864 11.469951,19 12,19 v -2 z' /><path d='M 8,5 C 6.9072752,5 6.0000001,5.9072752 6,7 h 2 z' /><path d='m 4,1 c -1.0927248,-2e-8 -1.9999999,0.9072752 -2,2 h 2 z' /><path d='m 19,13 v 2 h 2 c 0,-1.092725 -0.907275,-2 -2,-2 z' /><path d='m 12,17 v 2 h 1 v -2 z' /><path d='m 18,13 v 2 h 1 v -2 z' /></svg></button>");
    copyJsLink.prependTo(editorDiv);
    new Clipboard(copyJsLink[0], {
        text: function (trigger) {
            return  cmEditor.getValueAsJS();
        }
    });
    let copyLink = $("<button class='btn-svg' width='24' height='24'><svg style='width:24px;height:24px' viewBox='0 0 24 24'><path d='M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'/></svg></button>")
    copyLink.prependTo(editorDiv);
    new Clipboard(copyLink[0], {
        text: function (trigger) {
            return cmEditor.getValue();
        }
    });
    if (type === "application/javascript") {
        let currentVars = {};
        Object.keys(vars).forEach(key => currentVars[key] = vars[key]);
        let executeLink = $("<button class='btn-svg' width='24' height='24'><svg width='24' height='24' viewBox='0 0 24 24'><path d='M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z' /></svg></button> ");
        executeLink.prependTo(editorDiv);
        let resultAreas = new Array();
        function execute() {
            resultAreas.forEach(a => a.remove());
            try {
                let result = new Function("rdf2h", ...Object.keys(currentVars), cmEditor.getValue())
                    (rdf2h, ...Object.values(currentVars).map(v => v()));
                let resultArea = $("<div class='result'>Returns the following result:<br>\
                 <div class='result result-bg'>"+result+"</div></div>");
                resultArea.insertAfter(editorDiv);
                resultAreas.push(resultArea);
            } catch (err) {
                let stackLines = err.stack.split("\n");
                let lineWithSelf = stackLines.findIndex(l => l.indexOf("at eval") > 0);
                err.stack = stackLines.splice(0, lineWithSelf).join("\n");
                let resultArea = $("<div class='result'>Throws the following error:<br>\
                <div class='result code result-bg c-red'>"+$('<div/>').text(err.message).html().replace("\n","<br>")+"\n"+$('<div/>').text(err.stack).html()+"</div></div>");
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
    let additionalClasses = $(editorData).attr("class").split(" ").filter(c => c !== "editor")
    additionalClasses.forEach(name => vars[name] = () => 
    {
        var graph = rdf.graph();
        rdf.parse(cmEditor.getValue(), graph, "http://example.org/"+name+"/", type);
        return graph;
    });
});
$(" .CodeMirror").css("height", "auto");

let createTestLink = $("<button class='copyAsTest btn-svg m-0'><svg width='24' height='24' viewBox='0 0 24 24'><path d='M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z' /></svg></button>");
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
$(".step").append(createTestLink);
$(".step").append($("<hr/>"));