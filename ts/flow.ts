type  DbDoc = firebase_ts.DbDoc;
const DbDoc = firebase_ts.DbDoc;

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

const Plane = plane_ts.Plane;
const View = plane_ts.View;

type Shape = plane_ts.Shape;
const Shape = plane_ts.Shape;

type Motion = plane_ts.Motion;
const Motion = plane_ts.Motion;

type MathEntity = plane_ts.MathEntity;
const Statement = plane_ts.Statement;
type Statement = plane_ts.Statement;
const TextBlock = plane_ts.TextBlock;

const Mode = plane_ts.Mode;

namespace movie_ts {
//
export let stopPlayFlag : boolean = false;

function addTexDiv(){
    const div = document.createElement("div");
    // div.style.width = `${this.texWidth()}px`;
    $div("katex-div").style.display = "";
    $div("katex-div").appendChild(div);

    return div;
}

export async function playStatement(statement : Statement, speech : Speech) {
}

async function speakAndHighlight(shape : MathEntity, speech : Speech, text : string){
    speech.speak(text);

    for(const dep of shape.dependencies()){
        dep.setMode(Mode.depend);

        if(! Plane.one.isPlayingAll){
            await sleep(0.5 * 1000 * shape.interval);
        }
    }

    shape.setMode(Mode.target);

    if(! Plane.one.isPlayingAll){
        await sleep(1000 * shape.interval);
    }
}

export async function play() {
    Plane.one.isPlaying = true;
    stopPlayFlag = false;

    View.current.restoreView();

    const speech = new Speech();

    const all_shapes = View.current.allShapes();
    all_shapes.forEach(x => x.hide());

    const named_all_shapes = all_shapes.filter(x => x instanceof Shape && x.name != "") as Shape[];
    const named_all_shape_map = new Map<string, plane_ts.Shape>();

    named_all_shapes.forEach(x => named_all_shape_map.set(x.name, x));

    const view_shapes = View.current.shapes.slice();
    View.current.shapes = [];
    View.current.dirty = true;

    Plane.one.clearPlane();
    await sleep(2000);

    for(const shape of view_shapes){
        if(stopPlayFlag){
            msg("stop play");
            break;
        }

        shape.show();
        View.current.shapes.push(shape);

        shape.allShapes().forEach(x => x.show());

        if(shape.mute){
            continue;
        }

        let highlighted = new Set<Reading>();

        if(shape instanceof Motion){
            await shape.animate(speech);
        }
        else if(shape.narration != ""){

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
                if(shape.latexBox == undefined){
                    shape.latexBox = shape.makeTexUI();
                }

                div  = shape.latexBox.div;
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

    View.current.dirty = true;
    await sleep(2000);
    Plane.one.clearPlane();

    View.current.shapes = view_shapes;

    View.current.restoreView();

    all_shapes.forEach(x => {x.show(); x.setMode(Mode.none); });

    View.current.dirty = true;
    View.current.updateShapes();

    Plane.one.isPlaying = false;
}

export function stopPlay(){
    cancelSpeech();
    stopPlayFlag = true;
}

export async function playAll(){
    const items = await firebase_ts.getAllDbItems();
    const db_docs : DbDoc[] = items.filter(x => x instanceof DbDoc) as DbDoc[];
    
    Plane.one.isPlayingAll = true;

    for(const db_doc of db_docs){
        await readDoc(db_doc.id);
        await play();
    }

    Plane.one.isPlayingAll = false;
}

export async function convert(){
    const user = firebase_ts.getUser();
    if(user == null){
        throw new MyError();
    }

    const items = await firebase_ts.getAllDbItems();
    const db_docs : DbDoc[] = items.filter(x => x instanceof DbDoc) as DbDoc[];
    
    for(const db_doc of db_docs){
        await readDoc(db_doc.id);
        if(theDoc == undefined){
            throw new MyError();
        }

        theDoc.text = plane_ts.View.getJson();
        if(theDoc.text == ""){
            return;
        }
    
        msg(`convert:${theDoc.name} [${theDoc.text}]`);
        theDoc.updateDocDB("2");    
        // theDoc.updateDocDB(user.uid);    
    }

    msg("convert finished.")
}

}