import { DbDoc, getMyDoc, getRootFolder, initFirebase, initForMovie, makeDocsGraph, refId, uploadCanvasImg, writeGraphDocDB } from "@firebase";
import { msg, getPlayMode, PlayMode, MyError, range, sleep, assert, parseURL, langCodeList, setTextLanguageCode, voiceLanguageCode, initI18n, appMode, AppMode, initSpeech, $dlg, setVoiceLanguageCode } from "@i18n";
import { $button, $flex, bgColor, Button, fgColor, getPhysicalSize, Grid, Layout } from "@layout";
import { stopPlay } from "./flow";
import { playLesson, initLesson, makeLessonPlayGrid, makeLessonEditGrid, initLessonPlay } from "./lesson";
import { getCookie, showLangDlg, makePlayEditGrid, langButtonClicked } from "./movie_ui";
import { includeDialog } from "./movie_util";
import { getOperationsText, GlobalState, initPlane, initRelations, loadData, loadOperationsText, Plane, playBack, removeDiv } from "@plane";

export let theDoc : DbDoc | undefined;
export let root : Grid;
export let urlOrigin : string;
export let urlParams : Map<string, string>;
export let urlBase : string;
export let playStopButton : Button;

export function setDoc(doc : DbDoc | undefined){
    theDoc = doc;
}

export async function bodyOnLoad(){
    [ urlOrigin, , urlParams, urlBase ] = parseURL();
    msg(`params:${JSON.stringify(urlParams) }`);

    document.body.style.color = fgColor;
    document.body.style.backgroundColor = bgColor;

    let voice_lang = getCookie("VoiceLanguage");
    let text_lang  = getCookie("TextLanguage");

    if(voice_lang == undefined || text_lang == undefined){
        const code_pair = langCodeList.find(x => x[1] == navigator.language);
        if(code_pair != undefined){
            if(voice_lang == undefined){
                voice_lang = code_pair[0];
            }

            if(text_lang == undefined){
                text_lang = code_pair[0];
            }
        }
    }

    if(voice_lang != undefined){
        setVoiceLanguageCode(voice_lang);
    }
    if(urlParams.get("lesson") != undefined || urlParams.get("mode") == "lesson"){

        setVoiceLanguageCode("jpn");
    }

    if(text_lang != undefined){
        setTextLanguageCode(text_lang);
    }

    msg(`lang voice:${voiceLanguageCode} text:${text_lang} nav:${navigator.language}`);

    await initI18n();

    const plane = new Plane();
    let root : Grid;

    const button_size = window.innerHeight / 16;

    playStopButton = $button({
        id : "play-stop-button",
        click : async (ev : MouseEvent)=>{
            if(getPlayMode() == PlayMode.stop){

                playStopButton.setImgUrl(`${urlBase}/lib/plane/img/pause.png`);

                switch(appMode){
                case AppMode.edit:
                case AppMode.play:
                    await playBack(PlayMode.normal);
                    playStopButton.setImgUrl(`${urlBase}/lib/plane/img/play.png`);
                    break;

                case AppMode.lessonPlay:
                case AppMode.lessonEdit:
                    await playLesson();
                    break;

                default:
                    throw new MyError();
                }
            }
            else{
                switch(appMode){
                case AppMode.edit:
                case AppMode.play:
                    stopPlay();
                    break;

                case AppMode.lessonPlay:
                case AppMode.lessonEdit:
                    stopPlay();
                    // await stopLesson();
                    break;

                default:
                    throw new MyError();
                }

                playStopButton.setImgUrl(`${urlBase}/lib/plane/img/play.png`);
            }
        },
        url    : `${urlBase}/lib/plane/img/play.png`,
        // position : "static",
        margin : "auto 5px",
        width  : `${button_size}px`,
        height : `${button_size}px`,
    });

    const play_buttons = $flex({
        children : [
            playStopButton
            ,
            $button({
                click : async (ev : MouseEvent)=>{
                    showLangDlg(true);
                },
                url    : `${urlBase}/lib/plane/img/volume.png`,
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
            ,
            $button({
                click : async (ev : MouseEvent)=>{
                    showLangDlg(false);
                },
                url    : `${urlBase}/lib/plane/img/subtitle.png`,
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
        ]
    });

    play_buttons.div.style.display = "flex";
    play_buttons.div.style.alignItems = "center";
    play_buttons.div.style.justifyContent = "center";


    switch(appMode){
    case AppMode.lessonPlay:
        initLesson();
        root = makeLessonPlayGrid(button_size);
        playStopButton.button.style.visibility = "hidden";
        break;
    
    case AppMode.lessonEdit:
        initLesson();
        root = makeLessonEditGrid(play_buttons, button_size);
        break;

    case AppMode.edit:
    case AppMode.play:
    default:
        root = makePlayEditGrid(plane, play_buttons, button_size);
        break;
    }

    Layout.initLayout(root);

    await initPlane(plane, root);
    
    await includeDialog(`${urlBase}/lib/firebase/dialog.html`);
    await includeDialog(`${urlBase}/lib/movie/dialog.html`);

    // await asyncInitSpeech();
    initSpeech();

    await initFirebase();

    initForMovie(readDoc);

    const size = getPhysicalSize();
    msg(`size:${size.width_cm.toFixed(1)} ${size.height_cm.toFixed(1)}`);
    msg(`navigator:${navigator.appVersion}`);

    initRelations();

    const doc_id = urlParams.get("id");
    if(doc_id != undefined){

        await getRootFolder();

        await readDoc(parseInt(doc_id));
    }

    const buttons = document.getElementsByClassName("lang_button") as HTMLCollectionOf<HTMLButtonElement>;
    for(const button of buttons){
        button.addEventListener("click", langButtonClicked);
    }

    if(appMode == AppMode.lessonPlay){
        await initLessonPlay();
    }
    else if(appMode != AppMode.lessonEdit){

        await makeDocsGraph();
    }
}

async function undo_redo_test(){
    const view = GlobalState.View__current!;

    for(let cnt = 1;;cnt++){
        for(const _ of range(cnt)){
            await view.undo();
            await sleep(10);
        }
        const stop = (view.shapes.length == 0);
        for(const _ of range(cnt)){
            await view.redo();
            await sleep(10);
        }

        if(stop){
            break;
        }
    }
}

export async function loadOperationsAndPlay(data : any) {
    const view = GlobalState.View__current!;

    let operations = await loadOperationsText(data);

    const num_operations = operations.length;
    operations.forEach(x => view.addOperation(x));

    await playBack(PlayMode.fastForward);
    assert(num_operations == view.operations.length);

    // await undo_redo_test();
}

export async function readDoc(doc_id : number) {
    removeDiv();

    const view = GlobalState.View__current!;
    view.clearView();
    // msg(`id:${id}`);
    theDoc = await getMyDoc(doc_id);
    if(theDoc != undefined){

        msg(`read doc:${theDoc.id} ${theDoc.name}`);
        const data = JSON.parse(theDoc.text);

        if(2 <= data.version){

            await loadOperationsAndPlay(data);
        }
        else{

            loadData(data);
        }
    }
}

export async function updateGraphDoc(){
    if(theDoc == undefined){
        throw new MyError("doc is undefined.");
    }

    const text = getOperationsText();
    
    const data = JSON.parse(text);
    await loadOperationsAndPlay(data);

    msg(`update Graph Doc ${theDoc.id}:${theDoc.name} \n${text}`);
    if(! window.confirm(`update doc?\n${theDoc.id}:${theDoc.name}`)){
        return;
    }

    await writeGraphDocDB(theDoc.id, theDoc.name, text);

    await uploadCanvasImg(theDoc.id, GlobalState.View__current!.canvas);
}

export function SignUp(){
    $dlg("sign-up").showModal();
}

document.addEventListener('DOMContentLoaded', bodyOnLoad );
