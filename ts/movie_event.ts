namespace movie_ts {
//

export let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;
export let urlOrigin : string;
export let urlParams : Map<string, string>;
export let playStopButton : layout_ts.Button;

const $button = layout_ts.$button;
const $flex = layout_ts.$flex;

const PlayMode = plane_ts.PlayMode;

export const AppMode = i18n_ts.AppMode;

export async function bodyOnLoad(){
    [ urlOrigin, , urlParams] = i18n_ts.parseURL();
    msg(`params:${JSON.stringify(urlParams) }`);

    document.body.style.color = layout_ts.fgColor;
    document.body.style.backgroundColor = layout_ts.bgColor;

    let voice_lang = getCookie("VoiceLanguage");
    let text_lang  = getCookie("TextLanguage");

    if(voice_lang == undefined || text_lang == undefined){
        const code_pair = i18n_ts.langCodeList.find(x => x[1] == navigator.language);
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
        i18n_ts.setTextLanguageCode(text_lang);
    }

    msg(`lang voice:${i18n_ts.voiceLanguageCode} text:${text_lang} nav:${navigator.language}`);

    await i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    let root : layout_ts.Grid;

    const button_size = window.innerHeight / 16;

    playStopButton = $button({
        id : "play-stop-button",
        click : async (ev : MouseEvent)=>{
            if(getPlayMode() == PlayMode.stop){

                playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/pause.png`);

                switch(i18n_ts.appMode){
                case AppMode.edit:
                case AppMode.play:
                    await plane_ts.playBack(PlayMode.normal);
                    playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/play.png`);
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
                switch(i18n_ts.appMode){
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

                playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/play.png`);
            }
        },
        url    : `${urlOrigin}/lib/plane/img/play.png`,
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
                url    : `${urlOrigin}/lib/plane/img/volume.png`,
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
            ,
            $button({
                click : async (ev : MouseEvent)=>{
                    showLangDlg(false);
                },
                url    : `${urlOrigin}/lib/plane/img/subtitle.png`,
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
        ]
    });

    play_buttons.div.style.display = "flex";
    play_buttons.div.style.alignItems = "center";
    play_buttons.div.style.justifyContent = "center";


    switch(i18n_ts.appMode){
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

    layout_ts.Layout.initLayout(root);

    await plane_ts.initPlane(plane, root);
    
    await includeDialog("./lib/firebase/dialog.html");
    await includeDialog("./lib/movie/dialog.html");

    // await asyncInitSpeech();
    i18n_ts.initSpeech();

    await firebase_ts.initFirebase();
    firebase_ts.readDocFnc = readDoc;

    if(i18n_ts.appMode == AppMode.lessonPlay){
        firebase_ts.refId = "wutfxujVE0GGD5YW";
        msg(`set ref-ID:[${firebase_ts.refId}]`);
    }

    const size = layout_ts.getPhysicalSize();
    msg(`size:${size.width_cm.toFixed(1)} ${size.height_cm.toFixed(1)}`);
    msg(`navigator:${navigator.appVersion}`);

    plane_ts.initRelations();

    const doc_id = urlParams.get("id");
    if(doc_id != undefined){

        const root_folder = await firebase_ts.getRootFolder();

        await readDoc(parseInt(doc_id));
    }

    const buttons = document.getElementsByClassName("lang_button") as HTMLCollectionOf<HTMLButtonElement>;
    for(const button of buttons){
        button.addEventListener("click", langButtonClicked);
    }

    if(i18n_ts.appMode == AppMode.lessonPlay){
        await initLessonPlay();
    }
    else if(i18n_ts.appMode != AppMode.lessonEdit){

        await firebase_ts.makeDocsGraph();
    }
}

async function undo_redo_test(){
    const view = View.current;

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
    const view = View.current;

    let operations = await plane_ts.loadOperationsText(data);

    const num_operations = operations.length;
    operations.forEach(x => view.addOperation(x));

    await plane_ts.playBack(PlayMode.fastForward);
    assert(num_operations == view.operations.length);

    await undo_redo_test();
}

export async function readDoc(doc_id : number) {
    plane_ts.removeDiv();

    const view = View.current;
    view.clearView();
    // msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(doc_id);
    if(theDoc != undefined){

        msg(`read doc:${theDoc.id} ${theDoc.name}`);
        const data = JSON.parse(theDoc.text);

        if(2 <= data.version){

            await loadOperationsAndPlay(data);
        }
        else{

            plane_ts.loadData(data);
        }
    }
}

export async function updateGraphDoc(){
    if(theDoc == undefined){
        throw new MyError("doc is undefined.");
    }

    const text = plane_ts.getOperationsText();
    
    const data = JSON.parse(text);
    await loadOperationsAndPlay(data);

    msg(`update Graph Doc ${theDoc.id}:${theDoc.name} \n${text}`);
    if(! window.confirm(`update doc?\n${theDoc.id}:${theDoc.name}`)){
        return;
    }

    await firebase_ts.writeGraphDocDB(theDoc.id, theDoc.name, text);

    await firebase_ts.uploadCanvasImg(theDoc.id, View.current.canvas.canvas);
}

export function SignUp(){
    $dlg("sign-up").showModal();
}

}