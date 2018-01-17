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
    let copyJsLink = $("<button width='24' height='24'><svg style='width:24px;height:24px' viewBox='0 0 24 24'><path d='M 18,14 A 1,1 0 0 1 17.292893,13.707107 1,1 0 0 1 17,13' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m17 11a1 1 0 0 1 1 -1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m3 17v-14' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m4 2h12' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m8 6h13' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m7 7v14' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m14 9v8' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m21 10h-3' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m17 11v2' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m20 15v2' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m19 18h-3' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m8 22h13' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m11 15v2' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m20 17a1 1 0 0 1 -1 1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m14 17a1 1 0 0 1 -1 1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='M 8,22 A 1,1 0 0 1 7.2928932,21.707107 1,1 0 0 1 7,21' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='M 12,18 A 1,1 0 0 1 11.292893,17.707107 1,1 0 0 1 11,17' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m7 7a1 1 0 0 1 1 -1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m3 3a1 1 0 0 1 1 -1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m19 14a1 1 0 0 1 1 1' fill='none' stroke='#000' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m13 18h-1' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/><path d='m19 14h-1' fill='none' stroke='#000' stroke-linejoin='round' stroke-miterlimit='3.6508' stroke-width='2'/></svg></button>");
    copyJsLink.insertAfter(editorDiv);
    new Clipboard(copyJsLink[0], {
        text: function (trigger) {
            return  cmEditor.getValueAsJS();
        }
    });
    let copyLink = $("<button width='24' height='24'><svg style='width:24px;height:24px' viewBox='0 0 24 24'><path fill='#000' d='M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'/></svg></button>")
    copyLink.insertAfter(editorDiv);
    new Clipboard(copyLink[0], {
        text: function (trigger) {
            return cmEditor.getValue();
        }
    });
    /*cmEditor.addWidget({'line':0, 'ch':0}, copyJsLink[0], false)*/
    if (type === "application/javascript") {
        let currentVars = {};
        Object.keys(vars).forEach(key => currentVars[key] = vars[key]);
        let executeLink = $("<button width='24' height='24'><svg width='24' height='24' viewBox='0 0 24 24'><path d='M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z' /></svg></button> ");
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
    $("<br/>").insertAfter(copyJsLink);
    let additionalClasses = $(editorData).attr("class").split(" ").filter(c => c !== "editor")
    additionalClasses.forEach(name => vars[name] = () => 
    {
        var graph = rdf.graph();
        rdf.parse(cmEditor.getValue(), graph, "http://example.org/"+name+"/", type);
        return graph;
    });
});
$(" .CodeMirror").css("height", "auto");

let createTestLink = $("<a class='copyAsTest' href='#'><svg width='24' height='24' viewBox='0 0 24 24'><path d='M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z' /></svg></a>");
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