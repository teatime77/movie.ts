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

const TriangleCongruence = plane_ts.TriangleCongruence;
type TriangleCongruence = plane_ts.TriangleCongruence;

const Statement = plane_ts.Statement;
type Statement = plane_ts.Statement;

const ShapeEquation = plane_ts.ShapeEquation;
type  ShapeEquation = plane_ts.ShapeEquation;

const ExprTransform = plane_ts.ExprTransform;
type  ExprTransform = plane_ts.ExprTransform;

const TextBlock = plane_ts.TextBlock;
type  TextBlock = plane_ts.TextBlock;

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

export async function speakAndHighlight(shape : MathEntity, speech : Speech, lines : string[]){
    await speech.speak(lines.shift()!.trim());

    for(const dep of shape.dependencies()){
        
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
            await speech.speak(line);
        }
    }

    if(Plane.one.playMode == PlayMode.normal){
        await sleep(1000 * shape.interval);
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

        await plane_ts.playBackAll(PlayMode.normal);
    }
}

export function stopPlay(){
    msg("stop play");
    cancelSpeech();
    stopAudio();
    stopPlayFlag = true;
}

export async function playAllGraph(){
    firebase_ts.hideGraph();

    docSpeeches = [];
    const graph = firebase_ts.getGraph();

    const edge_map = new Map<string, firebase_ts.Edge>();

    graph.docs.forEach(x => msg(`${x.id}:${x.title}`));

    Plane.one.playMode = PlayMode.fastForward;
    for(const doc of graph.docs){
        msg(`graph-doc ${doc.id}:${doc.title}`);
        
        plane_ts.usedReasons.clear();

        await readDoc(doc.id);

        for(const reason of plane_ts.usedReasons){
            const reason_doc_id = plane_ts.reasonToDoc.get(reason);
            if(reason_doc_id != undefined){
                const reason_doc = graph.getDocById(reason_doc_id)!;
                assert(reason_doc != undefined);

                const edge = new firebase_ts.Edge(reason_doc, doc);
                edge_map.set(edge.key(), edge);
            }        
        }
    }
    Plane.one.playMode = PlayMode.stop;

    const predifned_edges : [number,number][] = [
/*        
        [7, 8],     // 8 : AngleEqualityReason.vertical_angles
        [50, 52],   // Angle bisector => The bisector of the apex angle of an isosceles triangle bisects the base perpendicularly.
*/        
    ];
    
    for(const [src_id, dst_id] of predifned_edges){
        const src_doc = graph.getDocById(src_id)!;
        const dst_doc = graph.getDocById(dst_id)!;
        assert(src_doc != undefined && dst_doc != undefined);

        const edge = new firebase_ts.Edge(src_doc, dst_doc);
        edge_map.set(edge.key(), edge);
    }

    graph.edgeMap = edge_map;
    graph.makeViz();

    firebase_ts.showGraph();

    const eng_texts = i18n_ts.getEngTexts();
    if(eng_texts != ""){

        msg(`eng-texts:[${eng_texts}]`);

        ($("lang-texts-text") as HTMLTextAreaElement).value = eng_texts;
        $dlg("lang-texts-dlg").showModal();
    }

    msg("play all done.");
}

export async function convert(){
    if(! confirm(TT("Do you want to start the conversion?"))){
        return;
    }
    
    for(const doc of firebase_ts.graph.docs){
        await readDoc(doc.id);
        if(theDoc == undefined){
            throw new MyError();
        }

        await updateGraphDoc();
    }

    msg("convert finished.")
}


}