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

type Reason = plane_ts.Reason;
const Reason = plane_ts.Reason;

type Shape = plane_ts.Shape;
const Shape = plane_ts.Shape;

type Motion = plane_ts.Motion;
const Motion = plane_ts.Motion;

type MathEntity = plane_ts.MathEntity;

const TriangleCongruence = plane_ts.TriangleCongruence;
type TriangleCongruence = plane_ts.TriangleCongruence;

const Statement = plane_ts.Statement;
type Statement = plane_ts.Statement;

const TextBlock = plane_ts.TextBlock;
type  TextBlock = plane_ts.TextBlock;

type SelectedShape = plane_ts.SelectedShape;
const SelectedShape = plane_ts.SelectedShape;

const PlayMode = plane_ts.PlayMode;
type  PlayMode = plane_ts.PlayMode;

const Mode = plane_ts.Mode;

namespace movie_ts {
//
export const TT = i18n_ts.TT;
export const TTs = i18n_ts.TTs;

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

async function speakAndHighlight(shape : MathEntity, speech : Speech, lines : string[]){
    speech.speak(lines.shift()!.trim());

    for(const dep of shape.dependencies()){
        if(dep instanceof SelectedShape){
            View.current.attentionShapes.push(dep);
        }
        
        dep.setMode(Mode.depend);

        if(Plane.one.playMode == PlayMode.normal){
            await sleep(0.5 * 1000 * shape.interval);
        }
    }


    shape.setMode(Mode.target);

    while(lines.length != 0){
        const line = lines.shift()!.trim();
        if(line != ""){
            await speech.waitEnd();
            speech.speak(line);
        }
    }

    if(Plane.one.playMode == PlayMode.normal){
        await sleep(1000 * shape.interval);
    }
}

async function generateTex(shape : TextBlock | Statement, speech : Speech, named_all_shape_map : Map<string, plane_ts.Shape>) {
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

export async function playLangs(){
    const langs = [
        "ara",
        "chi",
         "eng",
         "fre", 
         "ger",
         "hin",
         "ind",
         "jpn",
         "kor",
         "rus",
         "spa",
         "por",    
    ]
    for(const code3 of langs){

        voiceLanguageCode = code3;
        setCookie("VoiceLanguage", code3);
        i18n_ts.setTextLanguageCode(code3)
        i18n_ts.loadTranslationMap();

        setCookie("TextLanguage", code3);

        await play(PlayMode.normal);
    }
}

export async function play(play_mode : PlayMode) {
    Plane.one.playMode = play_mode;
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

    Plane.one.clearNarrationBox();

    // media_ts.recordAudio();
    // await media_ts.startAudioRecorder();

    for(const shape of view_shapes){
        if(stopPlayFlag){
            stopPlayFlag = false;
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

        if(shape instanceof TriangleCongruence){
            await shape.asyncPlay(speech);
        }
        else if(shape instanceof Motion){
            await shape.animate(speech);
        }
        else if(shape.narration != ""){

            await speakAndHighlight(shape, speech, TTs(shape.narration));
        }
        else{

            const root_reading = shape.reading();
            if(root_reading.text == ""){

            }
            else if(root_reading.args.length == 0){

                await speakAndHighlight(shape, speech, [root_reading.text]);
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
                    speech.speak(TT(text));
                }                
            }
        }

        await speech.waitEnd();

        Array.from(highlighted.values()).forEach(x => x.readable.highlight(false));
        speech.callback = undefined;

        if(shape instanceof TextBlock && shape.isTex || shape instanceof Statement && shape.mathText != ""){

            await generateTex(shape, speech, named_all_shape_map);
        }

        View.current.attentionShapes = [];
        all_shapes.forEach(x => {x.setMode(Mode.none); });
    }

    // media_ts.stopAudioRecorder();

    View.current.dirty = true;

    View.current.shapes = view_shapes;

    View.current.restoreView();

    all_shapes.forEach(x => {x.show(); x.setMode(Mode.none); });

    View.current.dirty = true;
    View.current.updateShapes();

    Plane.one.playMode = PlayMode.stop;
    playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/play.png`);
}

export function stopPlay(){
    cancelSpeech();
    stopAudio();
    stopPlayFlag = true;
}

export async function playAll(){
    docSpeeches = [];

    const items = await firebase_ts.getAllDbItems();
    const db_docs : DbDoc[] = items.filter(x => x instanceof DbDoc) as DbDoc[];

    
    for(const db_doc of db_docs){
        const eng_texts_prev = i18n_ts.getEngTexts().slice();

        await readDoc(db_doc.id);
        await play(PlayMode.playAll);

        const eng_texts_new = i18n_ts.getEngTexts();
    }

    const eng_texts = i18n_ts.getEngTexts();
    const all_texts =  Array.from( eng_texts.entries() ).map(x=>`${x[0]}:${x[1]}`).join("\n\n");

    const doc_speeches = JSON.stringify(docSpeeches, null, 4);

    ($("lang-texts-text") as HTMLTextAreaElement).value = doc_speeches;
    $dlg("lang-texts-dlg").showModal();
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
        await theDoc.updateDocDB();
    }

    msg("convert finished.")
}

}