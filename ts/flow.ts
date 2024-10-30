type Term = parser_ts.Term;
const Term = parser_ts.Term;

type App = parser_ts.App;
const App = parser_ts.App;

type ConstNum = parser_ts.ConstNum;
const ConstNum = parser_ts.ConstNum;

type RefVar = parser_ts.RefVar;
const RefVar = parser_ts.RefVar;

const isGreek = parser_ts.isGreek;
const texName = parser_ts.texName;

const isLetterOrAt = parser_ts.isLetterOrAt;

const parseMath = parser_ts.parseMath;

const View = plane_ts.View;

type AbstractShape = plane_ts.AbstractShape;
const Statement = plane_ts.Statement;
type Statement = plane_ts.Statement;
const TextBlock = plane_ts.TextBlock;

const Mode = plane_ts.Mode;

namespace movie_ts {
//

function addTexDiv(){
    const div = document.createElement("div");
    // div.style.width = `${this.texWidth()}px`;
    $div("katex-div").style.display = "";
    $div("katex-div").appendChild(div);

    return div;
}

export async function playStatement(statement : Statement, speech : Speech) {
}

async function speakAndHighlight(shape : AbstractShape, speech : Speech, text : string){
    speech.speak(text);

    for(const dep of shape.dependencies()){
        dep.setMode(Mode.depend);
        await sleep(0.5 * 1000 * shape.interval);
    }

    shape.setMode(Mode.target);
    await sleep(1000 * shape.interval);
}

export async function play() {
    const speech = new Speech();

    const all_shapes = View.current.allShapes();
    all_shapes.forEach(x => x.hide());

    const named_all_shapes = all_shapes.filter(x => x.name != "");
    const named_all_shape_map = new Map<string, plane_ts.Shape>();

    named_all_shapes.forEach(x => named_all_shape_map.set(x.name, x));

    for(const shape of View.current.shapes){
        shape.allShapes().forEach(x => x.show());

        if(shape.mute){
            continue;
        }

        let highlighted = new Set<Reading>();

        if(shape.narration != ""){

            await speakAndHighlight(shape, speech, shape.narration);
        }
        else{

            const root_reading = shape.reading();
            if(root_reading.text == ""){

            }
            else if(root_reading.args.length == 0){

                await speakAndHighlight(shape, speech, root_reading.text);
            }
            else{

                const text = root_reading.prepareReading();

                const readings = root_reading.getAllReadings();

                msg(`reading:${shape.constructor.name} ${text}`);
                msg("    " + readings.map(x => `[${x.start}->${x.end}:${x.text}]`).join(" "));

                speech.callback = (idx : number)=>{
                    for(const reading of readings){
                        if(reading.start <= idx){

                            if(!highlighted.has(reading)){
                                msg(`hilight: start:${reading.start} ${reading.text}`);
                                reading.readable.highlight(true);
                                highlighted.add(reading);
                            }
                        }
                    }
                }

                if(text != ""){
                    speech.speak(text);
                }                
            }
        }

        await speech.waitEnd();

        Array.from(highlighted.values()).forEach(x => x.readable.highlight(false));
        speech.callback = undefined;

        if(shape instanceof TextBlock && shape.isTex || shape instanceof Statement && shape.mathText != ""){

            let text : string;
            let div  : HTMLDivElement;

            if(shape instanceof TextBlock){
                text = shape.text;
                div  = shape.div;
            }
            else{

                text = shape.mathText;
                if(shape.texUI == undefined){
                    shape.texUI = shape.makeTexUI();
                }

                div  = shape.texUI.div;
            }
            try{
    
                const term = parseMath(text);

                await doGenerator( parser_ts.showFlow(speech, term, div, named_all_shape_map), 1 );

            }
            catch(e){
                if(e instanceof parser_ts.SyntaxError){
                    return;
                }
    
                throw e;
            }
        }

        all_shapes.forEach(x => {x.setMode(Mode.none); });
    }
    
}

}