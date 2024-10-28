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

    for(const shape of View.current.shapes){
        if(shape instanceof plane_ts.TextBlock){

            shape.div.innerHTML = "";
            const texts = shape.text.replace("\r\n", "\n").split("\n").map(x => x.trim()).filter(x => x != "");
            for(const text of texts){
                msg(text);
                const term = parseMath(text);
                if(term instanceof App){

                    const div = document.createElement("div");
                    shape.div.append(div);
                    
                    await doGenerator( parser_ts.showFlow(speech, term, div), 1 );
                }
                else{
        
                    msg(`${term.constructor.name}`);
                    throw new MyError();
                }    
            }
        }
        else{

            if(shape.mute){
                continue;
            }

            let highlighted = new Set<Reading>();

            if(shape.narration != ""){

                await speakAndHighlight(shape, speech, shape.narration);
            }
            else{

                const root_reading = shape.reading();
                if(root_reading.args.length == 0){

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

            shape.dependencies().forEach(x => {x.setMode(Mode.none); });

            shape.setMode(Mode.none);
        }
    }
    
}

}